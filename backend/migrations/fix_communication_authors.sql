-- Fix Communication Authors Migration
-- This fixes existing messages that have "Unknown User" as the author

-- Update doctor messages to have proper author names
UPDATE ivr_communication_messages
SET author_name = CASE
    WHEN author_type = 'doctor' THEN 'Dr. John Smith'
    WHEN author_type = 'ivr_specialist' THEN 'IVR Specialist'
    WHEN author_type = 'system' THEN 'IVR System'
    ELSE author_name
END
WHERE author_name = 'Unknown User';

-- Also fix any messages that might have null or empty author names
UPDATE ivr_communication_messages
SET author_name = CASE
    WHEN author_type = 'doctor' THEN 'Dr. John Smith'
    WHEN author_type = 'ivr_specialist' THEN 'IVR Specialist'
    WHEN author_type = 'system' THEN 'IVR System'
    ELSE 'Unknown User'
END
WHERE author_name IS NULL OR author_name = '';

-- Update timestamps to use proper format (ensure they have timezone info)
UPDATE ivr_communication_messages
SET created_at = created_at AT TIME ZONE 'UTC'
WHERE created_at IS NOT NULL;

-- Show the results
SELECT id, message, author_name, author_type, created_at
FROM ivr_communication_messages
ORDER BY created_at DESC;