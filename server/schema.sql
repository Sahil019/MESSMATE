-- PostgreSQL Schema for Neon DB

-- Create users table first (other tables depend on it)
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'admin')),
  mobile_number VARCHAR(20),
  mess_status VARCHAR(20) DEFAULT 'paid' CHECK (mess_status IN ('paid', 'half_paid', 'unpaid')),
  selected_package VARCHAR(36),
  package_amount DECIMAL(10,2) DEFAULT 0.00,
  total_amount DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (selected_package) REFERENCES meal_plans(id)
);

-- Create meal_plans table
CREATE TABLE IF NOT EXISTS meal_plans (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  monthly_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default meal plans (PostgreSQL way)
INSERT INTO meal_plans (id, name, monthly_price) VALUES
('basic', 'Basic Plan', 2500.00),
('premium', 'Premium Plan', 3500.00),
('deluxe', 'Deluxe Plan', 4500.00)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  monthly_price = EXCLUDED.monthly_price;

-- Create leave_requests table
CREATE TABLE IF NOT EXISTS leave_requests (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for leave_requests
CREATE INDEX idx_leave_requests_user_id ON leave_requests(user_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_leave_requests_dates ON leave_requests(start_date, end_date);

-- Create attendance_logs table
CREATE TABLE IF NOT EXISTS attendance_logs (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  meal_date DATE NOT NULL,
  meal_type VARCHAR(20) NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner')),
  status VARCHAR(20) DEFAULT 'will_attend' CHECK (status IN ('will_attend', 'consumed', 'skip', 'leave', 'not_attended')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, meal_date, meal_type)
);

-- Create billing_records table
CREATE TABLE IF NOT EXISTS billing_records (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  billing_month DATE NOT NULL,
  breakfast_count INT DEFAULT 0,
  lunch_count INT DEFAULT 0,
  dinner_count INT DEFAULT 0,
  total_meals INT DEFAULT 0,
  total_amount DECIMAL(10,2) DEFAULT 0.00,
  is_paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, billing_month)
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  transaction_id VARCHAR(255) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  billing_month VARCHAR(7),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for payments
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_billing_month ON payments(billing_month);

-- Create payment_settings table
CREATE TABLE IF NOT EXISTS payment_settings (
  id INT PRIMARY KEY DEFAULT 1,
  qr_code_path VARCHAR(255),
  upi_id VARCHAR(100),
  upi_name VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default payment_settings row
INSERT INTO payment_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- Create waste_records table
CREATE TABLE IF NOT EXISTS waste_records (
  id SERIAL PRIMARY KEY,
  meal_date DATE NOT NULL,
  meal_type VARCHAR(20) NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner')),
  total_served INT DEFAULT 0,
  total_consumed INT DEFAULT 0,
  waste_amount INT DEFAULT 0,
  waste_percentage DECIMAL(5,2) DEFAULT 0.00,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (meal_date, meal_type)
);

-- Create indexes for waste_records
CREATE INDEX idx_waste_records_date ON waste_records(meal_date);
CREATE INDEX idx_waste_records_meal_type ON waste_records(meal_type);
