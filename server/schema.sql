-- Create leave_requests table
CREATE TABLE IF NOT EXISTS leave_requests (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status ENUM('pending', 'approved', 'reject') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_leave_requests_user_id ON leave_requests(user_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_leave_requests_dates ON leave_requests(start_date, end_date);

-- Create attendance_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS attendance_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  meal_date DATE NOT NULL,
  meal_type ENUM('breakfast', 'lunch', 'dinner') NOT NULL,
  status ENUM('will_attend', 'consumed', 'skip', 'leave', 'not_attended') DEFAULT 'will_attend',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_attendance_logs (user_id, meal_date, meal_type),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create billing_records table if it doesn't exist
CREATE TABLE IF NOT EXISTS billing_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  billing_month DATE NOT NULL,
  breakfast_count INT DEFAULT 0,
  lunch_count INT DEFAULT 0,
  dinner_count INT DEFAULT 0,
  total_meals INT DEFAULT 0,
  total_amount DECIMAL(10,2) DEFAULT 0.00,
  is_paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_billing (user_id, billing_month),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create meal_plans table if it doesn't exist
CREATE TABLE IF NOT EXISTS meal_plans (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  monthly_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default meal plans
INSERT INTO meal_plans (id, name, monthly_price) VALUES
('basic', 'Basic Plan', 2500.00),
('premium', 'Premium Plan', 3500.00),
('deluxe', 'Deluxe Plan', 4500.00)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  monthly_price = VALUES(monthly_price);

-- Create payments table if it doesn't exist
CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  transaction_id VARCHAR(255) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  billing_month VARCHAR(7), -- Format: YYYY-MM
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for payments table
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_billing_month ON payments(billing_month);

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role ENUM('student', 'admin') NOT NULL,
  mobile_number VARCHAR(20),
  mess_status ENUM('paid', 'half_paid', 'unpaid') DEFAULT 'paid',
  selected_package VARCHAR(36),
  package_amount DECIMAL(10,2) DEFAULT 0.00,
  total_amount DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (selected_package) REFERENCES meal_plans(id)
);

-- Update existing users table to use correct enum values
ALTER TABLE users MODIFY COLUMN mess_status ENUM('paid', 'half_paid', 'unpaid') DEFAULT 'paid';

-- Update any existing invalid mess_status values
UPDATE users SET mess_status = 'unpaid' WHERE mess_status NOT IN ('paid', 'half_paid', 'unpaid');

-- Create payment_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS payment_settings (
  id INT PRIMARY KEY DEFAULT 1,
  qr_code_path VARCHAR(255) NULL,
  upi_id VARCHAR(100) NULL,
  upi_name VARCHAR(100) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create waste_records table for waste analyser functionality
CREATE TABLE IF NOT EXISTS waste_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  meal_date DATE NOT NULL,
  meal_type ENUM('breakfast', 'lunch', 'dinner') NOT NULL,
  total_served INT DEFAULT 0,
  total_consumed INT DEFAULT 0,
  waste_amount INT DEFAULT 0,
  waste_percentage DECIMAL(5,2) DEFAULT 0.00,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_waste_record (meal_date, meal_type)
);

-- Create indexes for waste_records table
CREATE INDEX idx_waste_records_date ON waste_records(meal_date);
CREATE INDEX idx_waste_records_meal_type ON waste_records(meal_type);
