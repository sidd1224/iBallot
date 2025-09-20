-- Migration to restructure database with ECI admin table and user table
-- This replaces the old voter_control and voter_metadata tables

-- Drop old tables if they exist
DROP TABLE IF EXISTS voter_control CASCADE;
DROP TABLE IF EXISTS voter_metadata CASCADE;

-- Create ECI admin table (populated by ECI with voter data)
CREATE TABLE public.eci_admin_data (
    id SERIAL PRIMARY KEY,
    uid_hash VARCHAR(64) NOT NULL UNIQUE,
    ac_name VARCHAR(200) NOT NULL,
    pc_name VARCHAR(200) NOT NULL,
    ward_number VARCHAR(50),
    enc_private_key BYTEA,
    wallet_address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user table (populated during registration)
CREATE TABLE public.users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    uid_hash VARCHAR(64) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    phone_number VARCHAR(15),
    full_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Add indexes for better performance
CREATE INDEX idx_eci_admin_uid_hash ON eci_admin_data(uid_hash);
CREATE INDEX idx_eci_admin_ac_name ON eci_admin_data(ac_name);
CREATE INDEX idx_eci_admin_pc_name ON eci_admin_data(pc_name);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_uid_hash ON users(uid_hash);
CREATE INDEX idx_users_phone_number ON users(phone_number);

-- Add comments for documentation
COMMENT ON TABLE eci_admin_data IS 'ECI admin table containing voter constituency and wallet data';
COMMENT ON COLUMN eci_admin_data.uid_hash IS 'Hashed Aadhaar UID';
COMMENT ON COLUMN eci_admin_data.ac_name IS 'Assembly Constituency name';
COMMENT ON COLUMN eci_admin_data.pc_name IS 'Parliament Constituency name';
COMMENT ON COLUMN eci_admin_data.ward_number IS 'Ward number';
COMMENT ON COLUMN eci_admin_data.enc_private_key IS 'Encrypted private key';
COMMENT ON COLUMN eci_admin_data.wallet_address IS 'Blockchain wallet address';

COMMENT ON TABLE users IS 'User registration data';
COMMENT ON COLUMN users.username IS 'Unique username';
COMMENT ON COLUMN users.uid_hash IS 'Hashed Aadhaar UID (links to eci_admin_data)';
COMMENT ON COLUMN users.password IS 'Hashed password';
COMMENT ON COLUMN users.phone_number IS 'Phone number from Digilocker';
COMMENT ON COLUMN users.full_name IS 'Full name from Digilocker';

-- Insert some sample ECI admin data for testing
INSERT INTO eci_admin_data (uid_hash, ac_name, pc_name, ward_number) VALUES
-- These will be populated with actual UID hashes during registration
('sample_hash_1', 'Sample Assembly Constituency 1', 'Sample Parliament Constituency 1', 'Ward 001'),
('sample_hash_2', 'Sample Assembly Constituency 2', 'Sample Parliament Constituency 2', 'Ward 002'),
('sample_hash_3', 'Sample Assembly Constituency 3', 'Sample Parliament Constituency 3', 'Ward 003');
