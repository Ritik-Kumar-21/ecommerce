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
    source TEXT DEFAULT 'shopvibe',
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
    'INSERT INTO products (name, description, price, image, category, stock, source) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );

  const products = [
    // ===== ELECTRONICS (Amazon Bestsellers) =====
    {
      name: 'boAt Rockerz 450 Headphones',
      description: 'Bluetooth on-ear headphones with 40mm drivers, 15 hours playback, padded ear cushions and lightweight design. India\'s #1 audio brand.',
      price: 1199,
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
      category: 'Electronics',
      stock: 150,
      source: 'amazon',
    },
    {
      name: 'boAt Airdopes 141 TWS Earbuds',
      description: 'True wireless earbuds with ENx noise cancellation, 42H total playback, BEAST mode for gaming, IPX4 water resistance.',
      price: 1299,
      image: 'https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=400&h=400&fit=crop',
      category: 'Electronics',
      stock: 200,
      source: 'amazon',
    },
    {
      name: 'Fire-Boltt Phoenix Smartwatch',
      description: 'Bluetooth calling smartwatch with 1.39" HD display, SpO2 monitoring, heart rate tracker, 7-day battery life. India\'s #1 smartwatch brand.',
      price: 1799,
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop',
      category: 'Electronics',
      stock: 120,
      source: 'flipkart',
    },
    {
      name: 'Noise ColorFit Pro 5 Smartwatch',
      description: '1.85" AMOLED display, Bluetooth calling, AI voice assistant, 100+ sports modes, IP68 water resistance.',
      price: 2499,
      image: 'https://images.unsplash.com/photo-1546868871-af0de0ae72be?w=400&h=400&fit=crop',
      category: 'Electronics',
      stock: 85,
      source: 'flipkart',
    },
    {
      name: 'JBL Tune 510BT Wireless Headphones',
      description: 'On-ear wireless headphones with Pure Bass sound, 40-hour battery, foldable design, and multipoint connection.',
      price: 3499,
      image: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400&h=400&fit=crop',
      category: 'Electronics',
      stock: 60,
      source: 'amazon',
    },
    {
      name: 'OnePlus Nord Buds 2r',
      description: 'True wireless earbuds with 12.4mm titanium drivers, up to 38H battery, AI noise cancellation for calls, IP55 rating.',
      price: 1799,
      image: 'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=400&h=400&fit=crop',
      category: 'Electronics',
      stock: 95,
      source: 'flipkart',
    },

    // ===== FOOTWEAR (Flipkart Bestsellers) =====
    {
      name: 'Puma Fierce Runner Shoes',
      description: 'Lightweight running shoes with textile upper, cushioned midsole, and rubber outsole. Perfect for daily runs and gym workouts.',
      price: 4499,
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop',
      category: 'Footwear',
      stock: 75,
      source: 'flipkart',
    },
    {
      name: 'Nike Revolution 6 Running Shoes',
      description: 'Men\'s road running shoes with foam midsole, breathable mesh upper, and durable rubber outsole for everyday comfort.',
      price: 3995,
      image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400&h=400&fit=crop',
      category: 'Footwear',
      stock: 60,
      source: 'amazon',
    },
    {
      name: 'Adidas Runfalcon 3.0 Training Shoes',
      description: 'Lightweight training shoes with breathable mesh, Cloudfoam midsole, and grippy rubber outsole.',
      price: 3599,
      image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&h=400&fit=crop',
      category: 'Footwear',
      stock: 55,
      source: 'flipkart',
    },
    {
      name: 'Campus Oxyfit Running Shoes',
      description: 'Lightweight running shoes with memory foam insole, mesh upper, and phylon midsole. Bestseller on Amazon India.',
      price: 1249,
      image: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=400&h=400&fit=crop',
      category: 'Footwear',
      stock: 200,
      source: 'amazon',
    },

    // ===== FASHION (Amazon & Flipkart) =====
    {
      name: 'Allen Solid Slim Fit Polo T-Shirt',
      description: 'Premium cotton polo t-shirt with ribbed collar, slim fit design. Available in multiple colors. Amazon bestseller.',
      price: 699,
      image: 'https://images.unsplash.com/photo-1625910513413-5fc3bab5869c?w=400&h=400&fit=crop',
      category: 'Fashion',
      stock: 300,
      source: 'amazon',
    },
    {
      name: 'Levi\'s 511 Slim Fit Jeans',
      description: 'Classic slim fit jeans with stretch for comfort, mid-rise waist, and narrow leg. Iconic Levi\'s quality.',
      price: 2999,
      image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop',
      category: 'Fashion',
      stock: 100,
      source: 'flipkart',
    },
    {
      name: 'Wildcraft Unisex Backpack 46L',
      description: 'Water-resistant rucksack with padded shoulder straps, laptop compartment, and rain cover. Perfect for travel and college.',
      price: 2199,
      image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop',
      category: 'Fashion',
      stock: 80,
      source: 'flipkart',
    },
    {
      name: 'Fastrack Analog Watch for Men',
      description: 'Stylish analog watch with quartz movement, leather strap, and water-resistant design. Trendy and affordable.',
      price: 1495,
      image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400&h=400&fit=crop',
      category: 'Fashion',
      stock: 90,
      source: 'flipkart',
    },
    {
      name: 'Ray-Ban Aviator Classic Sunglasses',
      description: 'Iconic aviator sunglasses with polarized green lenses, gold metal frame, and UV protection. Timeless style.',
      price: 7490,
      image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop',
      category: 'Fashion',
      stock: 30,
      source: 'amazon',
    },

    // ===== HOME & KITCHEN (Amazon & Flipkart Bestsellers) =====
    {
      name: 'Prestige Iris 750W Mixer Grinder',
      description: '750W powerful motor mixer grinder with 3 stainless steel jars, super efficient blade system. India\'s trusted brand.',
      price: 2499,
      image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop',
      category: 'Home & Kitchen',
      stock: 65,
      source: 'flipkart',
    },
    {
      name: 'Prestige Iris Non-Stick Cookware Set',
      description: '5-piece non-stick cookware set with granite finish, induction base, and heat-resistant handles. PFOA free.',
      price: 3299,
      image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop',
      category: 'Home & Kitchen',
      stock: 45,
      source: 'amazon',
    },
    {
      name: 'Milton Thermosteel Bottle 1L',
      description: 'Double wall vacuum insulated steel bottle, keeps hot 24hrs & cold 12hrs. Leak-proof lid, BPA free. Amazon #1 bestseller.',
      price: 649,
      image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&h=400&fit=crop',
      category: 'Home & Kitchen',
      stock: 500,
      source: 'amazon',
    },
    {
      name: 'Bajaj Majesty New SWX 3 Sandwich Maker',
      description: 'Compact sandwich maker with non-stick coated plates, indicator lights, and cool-touch handle. Quick and easy breakfast.',
      price: 1395,
      image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop',
      category: 'Home & Kitchen',
      stock: 70,
      source: 'flipkart',
    },
    {
      name: 'Kuber Industries Storage Containers Set',
      description: 'Airtight food storage containers set of 6 with lids, BPA free, microwave safe. Keep your kitchen organized.',
      price: 599,
      image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop',
      category: 'Home & Kitchen',
      stock: 250,
      source: 'amazon',
    },

    // ===== BEAUTY & PERSONAL CARE (Amazon Bestsellers) =====
    {
      name: 'mCaffeine Coffee Body Scrub',
      description: 'Exfoliating body scrub with raw coffee, coconut oil, and vitamin E. Paraben free, SLS free, dermatologically tested.',
      price: 449,
      image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop',
      category: 'Beauty',
      stock: 300,
      source: 'amazon',
    },
    {
      name: 'Biotique Bio Green Apple Shampoo',
      description: 'Fresh daily purifying shampoo with green apple extract and sea algae. For all hair types. Ayurvedic recipe.',
      price: 299,
      image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop',
      category: 'Beauty',
      stock: 400,
      source: 'flipkart',
    },
    {
      name: 'Nivea Soft Light Moisturizer 200ml',
      description: 'Light moisturizing cream with Vitamin E for soft and smooth skin. Non-greasy, suitable for all skin types.',
      price: 249,
      image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop',
      category: 'Beauty',
      stock: 500,
      source: 'amazon',
    },

    // ===== FITNESS (Amazon & Flipkart) =====
    {
      name: 'Boldfit Yoga Mat 6mm',
      description: 'Extra thick anti-slip yoga mat with carrying strap. Perfect for yoga, pilates, and home workouts. Eco-friendly TPE material.',
      price: 599,
      image: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400&h=400&fit=crop',
      category: 'Fitness',
      stock: 200,
      source: 'amazon',
    },
    {
      name: 'Kobo Rubber Hex Dumbbell Set',
      description: 'Adjustable dumbbell set with rubber-coated weights, chrome handle. Perfect for home gym workouts.',
      price: 2499,
      image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=400&fit=crop',
      category: 'Fitness',
      stock: 50,
      source: 'flipkart',
    },
    {
      name: 'Nivia Storm Football Size 5',
      description: 'Machine-stitched football with 32 panel design, FIFA approved size. Durable and high grip. India\'s leading sports brand.',
      price: 499,
      image: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=400&h=400&fit=crop',
      category: 'Fitness',
      stock: 150,
      source: 'flipkart',
    },

    // ===== MOBILE ACCESSORIES (Amazon & Flipkart) =====
    {
      name: 'Spigen Case for iPhone 15 Pro',
      description: 'Slim military-grade protection case with air cushion technology, precise cutouts, and wireless charging compatible.',
      price: 999,
      image: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400&h=400&fit=crop',
      category: 'Mobile Accessories',
      stock: 120,
      source: 'amazon',
    },
    {
      name: 'Portronics Car Charger 20W',
      description: 'Dual port fast car charger with USB-C PD and USB-A QC 3.0. Compact design, LED indicator, and surge protection.',
      price: 599,
      image: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400&h=400&fit=crop',
      category: 'Mobile Accessories',
      stock: 180,
      source: 'flipkart',
    },
    {
      name: 'Ambrane 10000mAh Power Bank',
      description: 'Slim portable charger with dual USB output, fast charging support, LED indicator, and BIS certified lithium polymer battery.',
      price: 899,
      image: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400&h=400&fit=crop',
      category: 'Mobile Accessories',
      stock: 250,
      source: 'amazon',
    },
  ];

  const insertMany = db.transaction((items) => {
    for (const item of items) {
      insert.run(item.name, item.description, item.price, item.image, item.category, item.stock, item.source);
    }
  });

  insertMany(products);
  console.log(`Seeded ${products.length} products from Amazon & Flipkart`);
}

export default db;
