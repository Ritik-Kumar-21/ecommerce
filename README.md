# ShopVibe — E-Commerce Store

A full-stack e-commerce website built with React, Vite, Express.js, and SQLite.

## Features

- **Product Catalog** — Browse products with search and category filters
- **Product Details** — Full product pages with images, descriptions, and stock info
- **Shopping Cart** — Add/remove items, adjust quantities
- **Checkout** — Place orders with shipping info
- **User Auth** — Register, login, and session management
- **Reviews & Ratings** — Rate and review products (1-5 stars)
- **Admin Dashboard** — Manage products, view orders, see stats
- **Responsive Design** — Works on desktop and mobile

## Tech Stack

- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Express.js + SQLite (better-sqlite3)
- **Auth:** Cookie-based token auth with bcrypt password hashing

## Getting Started

```bash
npm install
npm run dev
```

This starts both the backend (port 3001) and frontend (port 5173).

Open [http://localhost:5173](http://localhost:5173)

## Admin Access

- **Email:** admin@shopvibe.com
- **Password:** admin123

## Project Structure

```
├── server/
│   ├── index.js          # Express API routes
│   └── db.js             # SQLite database & seed data
├── src/
│   ├── components/        # Reusable UI components
│   ├── context/           # React contexts (Auth, Cart)
│   ├── lib/               # API helper functions
│   ├── pages/             # Page components
│   └── App.jsx            # Router setup
└── package.json
```
