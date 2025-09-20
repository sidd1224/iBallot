-- Migration to create digilocker_mock_data table for testing
-- This table stores mock user data for Digilocker verification testing

CREATE TABLE public.digilocker_mock_data (
    id SERIAL PRIMARY KEY,
    phone_number VARCHAR(15) NOT NULL UNIQUE,
    uid VARCHAR(20) NOT NULL UNIQUE,
    dob DATE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better performance
CREATE INDEX idx_digilocker_mock_phone ON digilocker_mock_data(phone_number);
CREATE INDEX idx_digilocker_mock_uid ON digilocker_mock_data(uid);

-- Add comments for documentation
COMMENT ON TABLE digilocker_mock_data IS 'Mock data table for Digilocker verification testing';
COMMENT ON COLUMN digilocker_mock_data.phone_number IS 'Phone number for verification';
COMMENT ON COLUMN digilocker_mock_data.uid IS 'Aadhaar UID';
COMMENT ON COLUMN digilocker_mock_data.dob IS 'Date of Birth';
COMMENT ON COLUMN digilocker_mock_data.full_name IS 'Full name of the user';

-- Insert test user data
INSERT INTO digilocker_mock_data (phone_number, uid, dob, full_name) VALUES
('9876543210', '123456789012', '1990-05-15', 'Rajesh Kumar'),
('9876543211', '123456789013', '1985-12-03', 'Priya Sharma'),
('9876543212', '123456789014', '1992-08-22', 'Amit Patel'),
('9876543213', '123456789015', '1988-03-10', 'Sneha Gupta'),
('9876543214', '123456789016', '1995-11-28', 'Vikram Singh'),
('9876543215', '123456789017', '1983-07-14', 'Anita Verma'),
('9876543216', '123456789018', '1991-01-05', 'Rohit Jain'),
('9876543217', '123456789019', '1987-09-18', 'Kavya Reddy'),
('9876543218', '123456789020', '1993-04-12', 'Arjun Agarwal'),
('9876543219', '123456789021', '1989-06-25', 'Pooja Nair'),
-- Add some underage users for testing age validation
('9876543220', '123456789022', '2010-03-15', 'Young User'),
('9876543221', '123456789023', '2008-08-10', 'Minor User');
