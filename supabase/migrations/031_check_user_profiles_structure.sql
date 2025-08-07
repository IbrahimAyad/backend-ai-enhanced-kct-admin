-- Check the structure of user_profiles table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- Also check if the table exists at all
SELECT 
    EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles'
    ) as user_profiles_exists;

-- Check what columns might reference users
SELECT * FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'user_profiles'
AND (column_name LIKE '%user%' OR column_name = 'id');