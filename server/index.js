import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import cookieParser from 'cookie-parser';
import db from './db.js';

const app = express();
const PORT = 3001;
const JWT_SECRET = 'shopvibe-secret-key-' + crypto.randomUUID();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Simple token-based auth (JWT-like using crypto)
function createToken(user) {
  const payload = JSON.stringify({ id: user.id, email: user.email, role: user.role });
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(payload).digest('hex');
  return Buffer.from(payload).toString('base64') + '.' + signature;
}

function verifyToken(token) {
  try {
    const [payloadB64, signature] = token.split('.');
    const payload = Buffer.from(payloadB64, 'base64').toString();
    const expected = crypto.createHmac('sha256', JWT_SECRET).update(payload).digest('hex');
    if (signature !== expected) return null;
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

// Auth middleware
function requireAuth(req, res, next) {
  const token = req.cookies?.token || req.headers['authorization']?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  const user = verifyToken(token);
  if (!user) return res.status(401).json({ error: 'Invalid token' });
  req.user = user;
  next();
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  next();
}

// Session middleware for cart
app.use((req, res, next) => {
  if (!req.headers['x-session-id']) {
    req.headers['x-session-id'] = crypto.randomUUID();
  }
  next();
});

// ============ AUTH ============

app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(400).json({ error: 'Email already registered' });
  }
  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)').run(name, email, hash);
  const user = { id: result.lastInsertRowid, email, role: 'customer' };
  const token = createToken(user);
  res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
  res.json({ user: { id: user.id, name, email, role: user.role } });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  const token = createToken({ id: user.id, email: user.email, role: user.role });
  res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
  res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
});

app.get('/api/auth/me', (req, res) => {
  const token = req.cookies?.token || req.headers['authorization']?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: 'Invalid token' });
  const user = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(payload.id);
  if (!user) return res.status(401).json({ error: 'User not found' });
  res.json({ user });
});

// ============ PRODUCTS ============

app.get('/api/products', (req, res) => {
  const { category, search, source } = req.query;
  let query = 'SELECT * FROM products WHERE 1=1';
  const params = [];

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  if (source) {
    query += ' AND source = ?';
    params.push(source);
  }
  if (search) {
    query += ' AND (name LIKE ? OR description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY created_at DESC';
  const products = db.prepare(query).all(...params);
  res.json(products);
});

app.get('/api/products/:id', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

app.get('/api/categories', (req, res) => {
  const categories = db.prepare('SELECT DISTINCT category FROM products ORDER BY category').all();
  res.json(categories.map((c) => c.category));
});

// ============ REVIEWS ============

app.get('/api/products/:id/reviews', (req, res) => {
  const reviews = db
    .prepare(
      `
    SELECT r.*, u.name as user_name
    FROM reviews r
    JOIN users u ON r.user_id = u.id
    WHERE r.product_id = ?
    ORDER BY r.created_at DESC
  `
    )
    .all(req.params.id);
  res.json(reviews);
});

app.get('/api/products/:id/reviews/stats', (req, res) => {
  const stats = db
    .prepare(
      `
    SELECT COUNT(*) as count, COALESCE(AVG(rating), 0) as average
    FROM reviews WHERE product_id = ?
  `
    )
    .get(req.params.id);
  res.json(stats);
});

app.post('/api/products/:id/reviews', requireAuth, (req, res) => {
  const { rating, comment } = req.body;
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  const existing = db
    .prepare('SELECT id FROM reviews WHERE product_id = ? AND user_id = ?')
    .get(req.params.id, req.user.id);
  if (existing) {
    return res.status(400).json({ error: 'You have already reviewed this product' });
  }

  db.prepare('INSERT INTO reviews (product_id, user_id, rating, comment) VALUES (?, ?, ?, ?)').run(
    req.params.id,
    req.user.id,
    rating,
    comment || ''
  );

  const reviews = db
    .prepare(
      `
    SELECT r.*, u.name as user_name
    FROM reviews r
    JOIN users u ON r.user_id = u.id
    WHERE r.product_id = ?
    ORDER BY r.created_at DESC
  `
    )
    .all(req.params.id);
  res.json(reviews);
});

app.delete('/api/reviews/:id', requireAuth, (req, res) => {
  const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(req.params.id);
  if (!review) return res.status(404).json({ error: 'Review not found' });
  if (review.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Not authorized' });
  }
  db.prepare('DELETE FROM reviews WHERE id = ?').run(req.params.id);
  res.json({ message: 'Review deleted' });
});

// ============ CART ============

app.get('/api/cart', (req, res) => {
  const sessionId = req.headers['x-session-id'];
  const items = db
    .prepare(
      `
    SELECT ci.id, ci.quantity, p.id as product_id, p.name, p.price, p.image, p.stock
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    WHERE ci.session_id = ?
  `
    )
    .all(sessionId);
  res.json(items);
});

app.post('/api/cart', (req, res) => {
  const sessionId = req.headers['x-session-id'];
  const { product_id, quantity = 1 } = req.body;

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(product_id);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const existing = db
    .prepare('SELECT * FROM cart_items WHERE session_id = ? AND product_id = ?')
    .get(sessionId, product_id);

  if (existing) {
    db.prepare('UPDATE cart_items SET quantity = quantity + ? WHERE id = ?').run(quantity, existing.id);
  } else {
    db.prepare('INSERT INTO cart_items (session_id, product_id, quantity) VALUES (?, ?, ?)').run(
      sessionId,
      product_id,
      quantity
    );
  }

  const items = db
    .prepare(
      `
    SELECT ci.id, ci.quantity, p.id as product_id, p.name, p.price, p.image, p.stock
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    WHERE ci.session_id = ?
  `
    )
    .all(sessionId);
  res.json(items);
});

app.put('/api/cart/:id', (req, res) => {
  const sessionId = req.headers['x-session-id'];
  const { quantity } = req.body;

  if (quantity <= 0) {
    db.prepare('DELETE FROM cart_items WHERE id = ? AND session_id = ?').run(req.params.id, sessionId);
  } else {
    db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ? AND session_id = ?').run(
      quantity,
      req.params.id,
      sessionId
    );
  }

  const items = db
    .prepare(
      `
    SELECT ci.id, ci.quantity, p.id as product_id, p.name, p.price, p.image, p.stock
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    WHERE ci.session_id = ?
  `
    )
    .all(sessionId);
  res.json(items);
});

app.delete('/api/cart/:id', (req, res) => {
  const sessionId = req.headers['x-session-id'];
  db.prepare('DELETE FROM cart_items WHERE id = ? AND session_id = ?').run(req.params.id, sessionId);

  const items = db
    .prepare(
      `
    SELECT ci.id, ci.quantity, p.id as product_id, p.name, p.price, p.image, p.stock
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    WHERE ci.session_id = ?
  `
    )
    .all(sessionId);
  res.json(items);
});

// ============ CHECKOUT / ORDERS ============

app.post('/api/checkout', (req, res) => {
  const sessionId = req.headers['x-session-id'];
  const { customer_name, customer_email, customer_address } = req.body;

  const cartItems = db
    .prepare(
      `
    SELECT ci.*, p.price, p.name, p.stock
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    WHERE ci.session_id = ?
  `
    )
    .all(sessionId);

  if (cartItems.length === 0) {
    return res.status(400).json({ error: 'Cart is empty' });
  }

  for (const item of cartItems) {
    if (item.quantity > item.stock) {
      return res.status(400).json({ error: `Not enough stock for ${item.name}` });
    }
  }

  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const createOrder = db.transaction(() => {
    const result = db
      .prepare(
        'INSERT INTO orders (session_id, user_id, customer_name, customer_email, customer_address, total) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .run(sessionId, req.user?.id || null, customer_name, customer_email, customer_address, total);

    const orderId = result.lastInsertRowid;

    for (const item of cartItems) {
      db.prepare('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)').run(
        orderId,
        item.product_id,
        item.quantity,
        item.price
      );
      db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(item.quantity, item.product_id);
    }

    db.prepare('DELETE FROM cart_items WHERE session_id = ?').run(sessionId);
    return orderId;
  });

  const orderId = createOrder();
  res.json({ order_id: orderId, total });
});

app.get('/api/orders/:id', (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const items = db
    .prepare(
      `
    SELECT oi.*, p.name, p.image
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = ?
  `
    )
    .all(req.params.id);

  res.json({ ...order, items });
});

// ============ ADMIN ============

// Admin: Get all products (with stock info)
app.get('/api/admin/products', requireAuth, requireAdmin, (req, res) => {
  const products = db.prepare('SELECT * FROM products ORDER BY created_at DESC').all();
  res.json(products);
});

// Admin: Create product
app.post('/api/admin/products', requireAuth, requireAdmin, (req, res) => {
  const { name, description, price, image, category, stock } = req.body;
  if (!name || !price) {
    return res.status(400).json({ error: 'Name and price are required' });
  }
  const result = db
    .prepare('INSERT INTO products (name, description, price, image, category, stock) VALUES (?, ?, ?, ?, ?, ?)')
    .run(name, description || '', price, image || '', category || '', stock || 10);
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
  res.json(product);
});

// Admin: Update product
app.put('/api/admin/products/:id', requireAuth, requireAdmin, (req, res) => {
  const { name, description, price, image, category, stock } = req.body;
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Product not found' });

  db.prepare(
    'UPDATE products SET name = ?, description = ?, price = ?, image = ?, category = ?, stock = ? WHERE id = ?'
  ).run(
    name ?? existing.name,
    description ?? existing.description,
    price ?? existing.price,
    image ?? existing.image,
    category ?? existing.category,
    stock ?? existing.stock,
    req.params.id
  );

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  res.json(product);
});

// Admin: Delete product
app.delete('/api/admin/products/:id', requireAuth, requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Product not found' });
  db.prepare('DELETE FROM order_items WHERE product_id = ?').run(req.params.id);
  db.prepare('DELETE FROM reviews WHERE product_id = ?').run(req.params.id);
  db.prepare('DELETE FROM cart_items WHERE product_id = ?').run(req.params.id);
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.json({ message: 'Product deleted' });
});

// Admin: Get all orders
app.get('/api/admin/orders', requireAuth, requireAdmin, (req, res) => {
  const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
  res.json(orders);
});

// Admin: Update order status
app.put('/api/admin/orders/:id', requireAuth, requireAdmin, (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  res.json(order);
});

// Admin: Dashboard stats
app.get('/api/admin/stats', requireAuth, requireAdmin, (req, res) => {
  const totalProducts = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
  const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
  const totalRevenue = db.prepare('SELECT COALESCE(SUM(total), 0) as sum FROM orders').get().sum;
  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const pendingOrders = db
    .prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'pending'")
    .get().count;

  res.json({ totalProducts, totalOrders, totalRevenue, totalUsers, pendingOrders });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
