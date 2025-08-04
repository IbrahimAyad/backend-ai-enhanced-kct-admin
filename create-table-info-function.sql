-- Create RPC function to get table columns
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION get_table_columns(table_name text)
RETURNS text[]
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    column_names text[];
BEGIN
    SELECT array_agg(column_name::text ORDER BY ordinal_position)
    INTO column_names
    FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND information_schema.columns.table_name = get_table_columns.table_name;
    
    RETURN COALESCE(column_names, ARRAY[]::text[]);
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_table_columns(text) TO authenticated;

-- Test the function
SELECT get_table_columns('products');