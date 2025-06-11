-- Migration: Add IVR Communication Messages Table
-- Description: Create table for persistent storage of communication messages between doctors and IVR specialists
-- Date: 2024-03-16

-- Create the IVR communication messages table
CREATE TABLE IF NOT EXISTS ivr_communication_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ivr_request_id UUID NOT NULL REFERENCES ivr_requests(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Message content
    message TEXT NOT NULL CHECK (length(message) <= 2000),
    message_type VARCHAR(20) NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'system')),
    author_type VARCHAR(20) NOT NULL CHECK (author_type IN ('doctor', 'ivr_specialist', 'system')),
    author_name VARCHAR(200) NOT NULL,

    -- Attachments (stored as JSON array)
    attachments JSONB DEFAULT '[]'::jsonb,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ivr_comm_messages_request_id ON ivr_communication_messages(ivr_request_id);
CREATE INDEX IF NOT EXISTS idx_ivr_comm_messages_author_id ON ivr_communication_messages(author_id);
CREATE INDEX IF NOT EXISTS idx_ivr_comm_messages_created_at ON ivr_communication_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_ivr_comm_messages_author_type ON ivr_communication_messages(author_type);

-- Create trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_ivr_communication_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ivr_communication_messages_updated_at
    BEFORE UPDATE ON ivr_communication_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_ivr_communication_messages_updated_at();

-- Insert some sample communication messages for testing
INSERT INTO ivr_communication_messages (
    id,
    ivr_request_id,
    author_id,
    message,
    message_type,
    author_type,
    author_name,
    attachments,
    created_at,
    updated_at
) VALUES
-- Sample messages for IVR request (using existing test data)
(
    gen_random_uuid(),
    '660e8400-e29b-41d4-a716-446655440004'::uuid,
    'db1e02b6-bde0-436a-8d00-45ea090c0804'::uuid,
    'IVR request submitted for wound care authorization. Patient has diabetic foot ulcer requiring immediate attention.',
    'text',
    'doctor',
    'Dr. John Smith',
    '[]'::jsonb,
    '2024-03-15T10:30:00Z',
    '2024-03-15T10:30:00Z'
),
(
    gen_random_uuid(),
    '660e8400-e29b-41d4-a716-446655440004'::uuid,
    '311e87c4-812e-4f8c-b842-62f4d5cdffbe'::uuid,
    'Thank you for your submission. We are reviewing the documentation and will respond within 24-48 hours.',
    'text',
    'ivr_specialist',
    'Sarah Johnson, IVR Specialist',
    '[]'::jsonb,
    '2024-03-16T09:15:00Z',
    '2024-03-16T09:15:00Z'
),
(
    gen_random_uuid(),
    '660e8400-e29b-41d4-a716-446655440004'::uuid,
    '311e87c4-812e-4f8c-b842-62f4d5cdffbe'::uuid,
    'Please provide additional wound measurements and recent HbA1c results to complete the review.',
    'text',
    'ivr_specialist',
    'Sarah Johnson, IVR Specialist',
    '[]'::jsonb,
    '2024-03-17T14:20:00Z',
    '2024-03-17T14:20:00Z'
);

-- Verify the table was created successfully
SELECT 'IVR Communication Messages table created successfully' as status;