-- Convert services_provided to text array
-- First, handle existing data by wrapping single values in arrays
UPDATE clients 
SET services_provided = CASE 
  WHEN services_provided IS NULL THEN NULL
  WHEN services_provided = '' THEN NULL
  ELSE services_provided
END
WHERE services_provided IS NOT NULL;

-- Change column type to text array
ALTER TABLE clients 
ALTER COLUMN services_provided TYPE text[] 
USING CASE 
  WHEN services_provided IS NULL OR services_provided = '' THEN NULL 
  ELSE ARRAY[services_provided]::text[]
END;