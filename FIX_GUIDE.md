# Habit Tracker - Fix Guide

## Problem Identified
Habits were not being added because errors in the Supabase calls were being silently ignored, with no feedback to the user.

## Changes Made to `/components/habit-tracker.tsx`

### 1. Enhanced Error Handling in `addHabit()` Function
**Added:**
- Try-catch block to catch exceptions
- Error logging with `console.error()`
- User alert when habit addition fails
- Success logging when habit is added

**Before:**
```typescript
const addHabit = async (name: string) => {
  if (!currentUser) return
  // ... would fail silently if error occurred
}
```

**After:**
```typescript
const addHabit = async (name: string) => {
  if (!currentUser) {
    console.log("[v0] No current user, cannot add habit")
    return
  }
  try {
    // ... with error handling and user feedback
    if (error) {
      console.error("[v0] Error adding habit:", error)
      alert("Failed to add habit. Check if Supabase is connected.")
      return
    }
  } catch (err) {
    console.error("[v0] Exception adding habit:", err)
    alert("Error adding habit. Check console for details.")
  }
}
```

### 2. Enhanced Error Handling in `loadCurrentUser()` Function
**Added:**
- Error variable checking from auth response
- Console logging for auth errors
- Better error messages if user details cannot be loaded
- Debug logs to track user loading progress

### 3. Enhanced Error Handling in `loadHabitsAndSleep()` Function  
**Added:**
- Try-catch block around entire function
- Warning logs for data load failures
- Debug logs showing how many habits were loaded
- Explicit error handling for sleep data loading

## How to Debug Issues

### 1. Open Browser Console (F12)
Look for messages starting with `[v0]` which indicate:
- User authentication status
- Habit loading progress
- Error messages when adding habits
- Supabase connection issues

### 2. Common Issues & Solutions

**Issue: "No current user, cannot add habit"**
- Cause: Not logged in or authentication failed
- Solution: Check that you're properly authenticated

**Issue: "Failed to add habit. Check if Supabase is connected."**
- Cause: Supabase connection issues or insufficient permissions
- Solution: 
  1. Verify Supabase project is set up
  2. Check environment variables (.env.local)
  3. Verify Row Level Security (RLS) policies are correct
  4. Check that user exists in `users` table

**Issue: "Error adding habit. Check console for details."**
- Cause: Unexpected error in database operation
- Solution: Check browser console for full error details

## Testing the Fix

1. **Open browser console** (F12 → Console tab)
2. **Try to add a habit**
3. **Check for logged messages:**
   - Should see `[v0] Current user loaded: your@email.com`
   - Should see `[v0] Habits loaded: X` 
   - When adding: `[v0] Habit added successfully:`

## Environment Setup Required

For the app to work properly, ensure:

1. **Supabase Configuration:**
   - Set `NEXT_PUBLIC_SUPABASE_URL` in `.env.local`
   - Set `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`

2. **Database Tables Created:**
   - `users` - User profiles
   - `habits` - Habit definitions
   - `habit_completions` - Daily tracking
   - `sleep_tracking` - Sleep logs (optional)

3. **Row Level Security (RLS):**
   - Users can only see their own habits
   - Users can only modify their own data

## Next Steps for Full Functionality

If habits still aren't being added after these fixes:

1. Check Supabase dashboard for errors
2. Verify user is authenticated via Supabase Auth
3. Check that RLS policies allow inserts
4. Verify user ID matches between auth and users table
5. Check browser console logs for detailed error messages

## Files Modified
- `/components/habit-tracker.tsx` - Added comprehensive error handling and logging
