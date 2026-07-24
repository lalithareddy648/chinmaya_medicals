-- drop_and_recreate.sql
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS carts;
DROP TABLE IF EXISTS medicines;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS settings;

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  reset_token VARCHAR(255),
  reset_token_expires TIMESTAMP,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS medicines (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  description TEXT,
  price NUMERIC(10,2),
  discount NUMERIC(5,2) DEFAULT 0,
  stock INT DEFAULT 0,
  needs_prescription BOOLEAN DEFAULT FALSE,
  manufacturer VARCHAR(255),
  dosage VARCHAR(255),
  image TEXT,
  expiry_date VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255),
  user_name VARCHAR(255),
  user_email VARCHAR(255),
  total_amount NUMERIC(10,2),
  shipping_address JSONB,
  payment_method VARCHAR(50),
  payment_status VARCHAR(50) DEFAULT 'Pending',
  delivery_status VARCHAR(50) DEFAULT 'Processing',
  prescription_url TEXT,
  customer_coordinates JSONB,
  driver_coordinates JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
  id VARCHAR(255) PRIMARY KEY,
  order_id VARCHAR(255) REFERENCES orders(id) ON DELETE CASCADE,
  medicine_id VARCHAR(255),
  name VARCHAR(255),
  category VARCHAR(100),
  price NUMERIC(10,2),
  discount NUMERIC(5,2),
  discounted_price NUMERIC(10,2),
  quantity INT,
  total NUMERIC(10,2)
);

CREATE TABLE IF NOT EXISTS carts (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255),
  items JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
  id VARCHAR(255) PRIMARY KEY,
  discount_percentage NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
