CREATE DATABASE IF NOT EXISTS aquamonitor_db;

USE aquamonitor_db;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255),
    phone VARCHAR(15),
    role ENUM('user', 'admin') DEFAULT 'user',
    picture VARCHAR(1024),
    google_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert a default admin user (Password: admin123)
-- In a real app, passwords should be hashed (e.g., using bcrypt)
INSERT INTO users (name, email, password, role) 
VALUES ('System Admin', 'admin@aquamonitor.com', 'admin123', 'admin')
ON DUPLICATE KEY UPDATE email=email;

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
