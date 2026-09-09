import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const db = new Database(path.join(__dirname, 'shop.db'));

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'customer',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    image TEXT,
    category TEXT,
    stock INTEGER DEFAULT 10,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS cart_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER DEFAULT 1,
    FOREIGN KEY (product_id) REFERENCES products(id),
    UNIQUE(session_id, product_id)
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    user_id INTEGER,
    customer_name TEXT,
    customer_email TEXT,
    customer_address TEXT,
    total REAL NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    price REAL NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(product_id, user_id)
  );
`);

// Seed admin user
const adminExists = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@shopvibe.com');
if (!adminExists) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run(
    'Admin',
    'admin@shopvibe.com',
    hash,
    'admin'
  );
  console.log('Seeded admin user (admin@shopvibe.com / admin123)');
}

// Seed products if empty
const count = db.prepare('SELECT COUNT(*) as count FROM products').get();
if (count.count === 0) {
  const insert = db.prepare(
    'INSERT INTO products (name, description, price, image, category, stock) VALUES (?, ?, ?, ?, ?, ?)'
  );

  const products = [
    {
      name: 'Classic Leather Backpack',
      description: 'Handcrafted genuine leather backpack with brass hardware. Perfect for work or travel.',
      price: 129.99,
      image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop',
      category: 'Bags',
      stock: 25,
    },
    {
      name: 'Wireless Noise-Cancelling Headphones',
      description: 'Premium over-ear headphones with active noise cancellation and 30-hour battery life.',
      price: 249.99,
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
      category: 'Electronics',
      stock: 40,
    },
    {
      name: 'Minimalist Watch',
      description: 'Sleek analog watch with Japanese movement and genuine leather strap.',
      price: 189.99,
      image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400&h=400&fit=crop',
      category: 'Accessories',
      stock: 30,
    },
    {
      name: 'Organic Cotton T-Shirt',
      description: 'Soft, breathable organic cotton tee. Available in multiple colors.',
      price: 34.99,
      image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop',
      category: 'Clothing',
      stock: 100,
    },
    {
      name: 'Ceramic Coffee Mug Set',
      description: 'Set of 4 handmade ceramic mugs, dishwasher and microwave safe.',
      price: 44.99,
      image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400&h=400&fit=crop',
      category: 'Home',
      stock: 50,
    },
    {
      name: 'Running Shoes',
      description: 'Lightweight performance running shoes with responsive cushioning.',
      price: 119.99,
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop',
      category: 'Footwear',
      stock: 35,
    },
    {
      name: 'Portable Bluetooth Speaker',
      description: 'Waterproof speaker with 360° sound and 12-hour playtime.',
      price: 79.99,
      image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=400&fit=crop',
      category: 'Electronics',
      stock: 60,
    },
    {
      name: 'Sunglasses',
      description: 'Polarized UV400 lenses with lightweight titanium frame.',
      price: 159.99,
      image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop',
      category: 'Accessories',
      stock: 45,
    },
    {
      name: 'Desk Lamp',
      description: 'Adjustable LED desk lamp with touch dimmer and USB charging port.',
      price: 59.99,
      image: 'https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?w=400&h=400&fit=crop',
      category: 'Home',
      stock: 30,
    },
    {
      name: 'Yoga Mat',
      description: 'Eco-friendly non-slip yoga mat with alignment guides. 6mm thick.',
      price: 39.99,
      image: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400&h=400&fit=crop',
      category: 'Fitness',
      stock: 70,
    },
    {
      name: 'Canvas Tote Bag',
      description: 'Heavy-duty canvas tote with reinforced handles. Great for shopping or beach.',
      price: 24.99,
      image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=400&h=400&fit=crop',
      category: 'Bags',
      stock: 80,
    },
    {
      name: 'Mechanical Keyboard',
      description: 'Compact mechanical keyboard with hot-swappable switches and RGB backlight.',
      price: 89.99,
      image: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=400&h=400&fit=crop',
      category: 'Electronics',
      stock: 35,
    },
  ];

  const insertMany = db.transaction((items) => {
    for (const item of items) {
      insert.run(item.name, item.description, item.price, item.image, item.category, item.stock);
    }
  });

  insertMany(products);
  console.log('Seeded 12 products');
}

export default db;
