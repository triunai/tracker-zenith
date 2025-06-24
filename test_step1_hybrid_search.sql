-- 🧪 STEP 1 TESTING SCRIPT - Run this in Supabase SQL Editor
-- Copy-paste each section into your Supabase Dashboard > SQL Editor

-- ✅ 1. CHECK: New columns exist
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name IN ('expense', 'expense_item')
    AND column_name IN ('fts', 'embedding')
ORDER BY table_name, column_name;

-- Expected Result: Should show 4 rows (fts + embedding for both tables)

-- ✅ 2. CHECK: Embedding jobs table exists
SELECT COUNT(*) as embedding_jobs_count
FROM embedding_jobs;

-- Expected Result: Should return a number (could be 0 if no expenses exist yet)

-- ✅ 3. CHECK: Indexes exist
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('expense', 'expense_item', 'embedding_jobs')
    AND indexname LIKE '%fts%' OR indexname LIKE '%embedding%'
ORDER BY tablename, indexname;

-- Expected Result: Should show GIN indexes on fts columns

-- ✅ 4. CHECK: Triggers exist and work
-- First, let's see if triggers are there:
SELECT
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name IN ('expense_fts_update', 'expense_item_fts_update');

-- Expected Result: Should show 2 triggers

-- ✅ 5. CHECK: Hybrid search function exists
SELECT
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines
WHERE routine_name = 'zenith_hybrid_search'
    AND routine_schema = 'public';

-- Expected Result: Should show the function

-- 🎯 6. LIVE TEST: If you have existing expenses, test FTS search
-- Replace 'your-user-id' with your actual auth.uid()
SELECT
    id,
    description,
    fts
IS NOT NULL as has_fts_data,
  embedding IS NULL as needs_embedding
FROM expense 
WHERE user_id = auth.uid
()  -- This will use your current user
LIMIT 5;

-- Expected Result: has_fts_data should be TRUE, needs_embedding should be TRUE

-- 🚀 7. ULTIMATE TEST: Try the hybrid search function
-- Replace 'test query' with something that matches your expense descriptions
SELECT *
FROM zenith_hybrid_search(
  auth.uid(),           -- your user ID
  'coffee',             -- search for expenses with "coffee"
  5                     -- limit to 5 results
);

-- Expected Result: Should return expenses matching "coffee" (if any exist) 