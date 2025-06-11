-- Migration: Add simplified communication fields to ivr_requests table
-- Date: 2025-06-10
-- Description: Replace complex messaging system with simple comment/response fields

-- Add simplified communication fields to ivr_requests table
ALTER TABLE ivr_requests
ADD COLUMN doctor_comment TEXT,
ADD COLUMN ivr_response TEXT,
ADD COLUMN comment_updated_at TIMESTAMP WITH TIME ZONE;

-- Add indexes for performance
CREATE INDEX idx_ivr_requests_comment_updated_at ON ivr_requests(comment_updated_at);
CREATE INDEX idx_ivr_requests_doctor_comment ON ivr_requests(doctor_comment) WHERE doctor_comment IS NOT NULL;
CREATE INDEX idx_ivr_requests_ivr_response ON ivr_requests(ivr_response) WHERE ivr_response IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN ivr_requests.doctor_comment IS 'Doctor comment/question for IVR specialist';
COMMENT ON COLUMN ivr_requests.ivr_response IS 'IVR specialist response to doctor comment';
COMMENT ON COLUMN ivr_requests.comment_updated_at IS 'Timestamp when comment or response was last updated';