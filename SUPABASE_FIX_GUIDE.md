# Supabase Integration Fix Guide

## Issue Summary
API calls not working and potential table creation issues in Supabase.

## Solutions Applied

### 1. Verified Supabase Connection
✅ All 22 tables exist and are properly configured
✅ RLS policies are in place on all tables
✅ Environment variables are configured

### 2. Key Points for API Calls to Work

#### A. Authentication
- User must be logged in before accessing `/tracker`
- Authentication happens in `/app/tracker/page.tsx` via `supabase.auth.getUser()`
- User data is loaded in `habit-tracker.tsx` 

#### B. RLS Policy Requirements
All Supabase tables have RLS (Row Level Security) enabled. Ensure:

1. **Users table**: Users can only modify their own data
   - SELECT: Anyone can view users
   - INSERT: Only authenticated users can insert
   - UPDATE: Users can update their own data

2. **Habits table**: Users can only access their own habits
   - All operations filtered by `user_id = auth.uid()`

3. **Habit Completions**: Only users who own the habit can modify
4. **Sleep Tracking**: Only user's own sleep data accessible
5. **Similar pattern for all other tables**

### 3. Common Issues & Solutions

#### Issue: Habits not being added
**Causes:**
1. User not authenticated (currentUser is null)
2. RLS policy blocking insert (not the user's own habit)
3. Month format mismatch (should be "YYYY-MM")
4. Missing `user_id` in insert

**Fixes Applied:**
- Added error logging with `[v0]` prefix
- User alerts on failure
- Console error messages showing exact Supabase error

#### Issue: Habits not loading on page load
**Causes:**
1. `loadHabitsAndSleep()` called before user is loaded
2. `selectedUserId` not properly set

**Fixes Applied:**
- useEffect dependencies properly configured
- Loading states for initial data fetch
- Proper error handling with console logging

### 4. Testing the Connection

#### Step 1: Check Environment Variables
```bash
# Verify these are set in your Vercel project:
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

#### Step 2: Test API Health
```bash
curl http://localhost:3000/api/health
```
Should return:
```json
{
  "status": "ok",
  "environment": {
    "supabaseUrl": "configured",
    "supabaseKey": "configured"
  }
}
```

#### Step 3: Check Browser Console
When adding a habit:
- Look for `[v0] Habit added successfully:` (success)
- Look for `[v0] Error adding habit:` (failure with error details)

### 5. RLS Policy Verification

To verify RLS policies in Supabase Dashboard:

1. Go to Authentication > Users
2. Copy your user ID
3. Go to SQL Editor
4. Run this query:
```sql
-- Check habits for your user
SELECT * FROM habits WHERE user_id = 'your-user-id';
```

### 6. Debugging Steps

#### If habits still not adding:

**Step 1**: Open browser console (F12)
- Look for `[v0]` messages
- Note any error messages

**Step 2**: Check Supabase logs
- Supabase Dashboard > Logs
- Look for errors in the last 5 minutes

**Step 3**: Verify RLS policies
- Supabase Dashboard > Database > habits > Policies
- Ensure "Users can insert their own habits" policy exists
- Check policy code uses `(auth.uid() = user_id)`

**Step 4**: Test directly in Supabase
- Supabase Dashboard > SQL Editor
- Create test habit:
```sql
INSERT INTO habits (id, user_id, name, month)
VALUES (gen_random_uuid(), 'your-user-id', 'Test Habit', '2024-01');
```

### 7. Environment Variables Checklist

Ensure these are in your `.env.local` for local development:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

For Vercel deployment, set these in Project Settings > Environment Variables.

### 8. Common Errors & Meanings

| Error | Cause | Solution |
|-------|-------|----------|
| `new row violates row-level security policy` | RLS policy blocking insert | Check policy allows your user to insert |
| `relation "habits" does not exist` | Table not found | Verify table exists in Supabase |
| `column "user_id" does not exist` | Schema mismatch | Check table schema matches code |
| `null value in column "user_id"` | User not authenticated | User must be logged in |

### 9. Code Changes Made

1. **Added error handling to `addHabit()` function**
   - Proper error logging
   - User alerts on failure
   - Console error messages

2. **Added error handling to `loadCurrentUser()`**
   - Better auth error detection
   - Logging for debugging

3. **Added error handling to `loadHabitsAndSleep()`**
   - Warning logs for failures
   - Success logs showing count

4. **Created API health check endpoint**
   - `/api/health` route
   - Verifies environment variables

## Next Steps

1. Deploy to Vercel
2. Test with `/api/health` endpoint
3. Monitor browser console when adding habits
4. Check Supabase logs if issues persist
5. Verify RLS policies match expected user permissions

## Support

If issues persist:
1. Check browser console for `[v0]` messages
2. Check Supabase logs for database errors
3. Verify RLS policies in Supabase Dashboard
4. Ensure environment variables are set correctly
5. Test directly in Supabase SQL Editor
