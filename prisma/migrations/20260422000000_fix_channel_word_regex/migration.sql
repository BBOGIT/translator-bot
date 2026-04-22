-- Fix wordRegex for channel "Not Your Boring Teacher" to include all cat-face emoji variants
-- (U+1F638–U+1F63F). The original AI-generated pattern missed 😿 (U+1F63F).
UPDATE "channel_extraction_configs"
SET "wordRegex" = '[😸😹😺😻😼😽😾😿]\s*(\w+)',
    "updatedAt" = NOW()
WHERE "channelId" = '-1001350152328';
