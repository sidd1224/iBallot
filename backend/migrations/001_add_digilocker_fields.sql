-- Migration to add Digilocker-related fields to support new registration flow
-- This migration adds phone number, UID, and DOB fields to the voter_metadata table

-- Add new columns to voter_metadata table
ALTER TABLE voter_metadata 
ADD COLUMN phone_number VARCHAR(15),
ADD COLUMN uid VARCHAR(20),
ADD COLUMN dob DATE,
ADD COLUMN full_name VARCHAR(100);

-- Add indexes for better performance
CREATE INDEX idx_voter_metadata_phone ON voter_metadata(phone_number);
CREATE INDEX idx_voter_metadata_uid ON voter_metadata(uid);

-- Add comments for documentation
COMMENT ON COLUMN voter_metadata.phone_number IS 'Phone number from Digilocker verification';
COMMENT ON COLUMN voter_metadata.uid IS 'Aadhaar UID from Digilocker';
COMMENT ON COLUMN voter_metadata.dob IS 'Date of Birth from Digilocker';
COMMENT ON COLUMN voter_metadata.full_name IS 'Full name from Digilocker';
