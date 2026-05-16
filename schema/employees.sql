-- Employee Authentication Schema
-- Run this SQL in your Neon database console

CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Insert sample employees
-- You can add more employees here or through the application later
INSERT INTO employees (name, employee_id) VALUES
    ('Brad Vargason', 'EMP001'),
    ('Manager User', 'EMP002'),
    ('Tech Support', 'EMP003')
ON CONFLICT (employee_id) DO NOTHING;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_employee_id ON employees(employee_id);
