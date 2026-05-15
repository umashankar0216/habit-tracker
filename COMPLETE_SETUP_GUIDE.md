# Complete Habit Tracker Setup Guide

## What's Fixed

### 1. **Syntax Error Fixed**
- Removed extra closing brace in `habit-tracker.tsx` that was causing parsing error
- All TypeScript compilation errors resolved

### 2. **Enhanced Error Handling Added**
The following functions now have comprehensive error logging:
- `addHabit()` - Logs errors when habits fail to save
- `deleteHabit()` - Logs deletion errors with user feedback
- `toggleDay()` - Logs daily completion toggle errors  
- `updateSleep()` - Logs sleep tracking errors
- `loadCurrentUser()` - Logs authentication errors
- `loadHabitsAndSleep()` - Logs data loading errors

### 3. **API & Supabase Integration**
All Supabase database calls are in place:
- User authentication via `supabase.auth`
- Habit CRUD operations via `habits` table
- Habit completions via `habit_completions` table
- Sleep tracking via `sleep_tracking` table
- User management via `users` table

## Required Setup Steps

### Step 1: Extract the Archive
```bash
tar -xzf habit-tracker-complete.tar.gz
cd v0-project
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Supabase Environment Variables

Create a `.env.local` file in the project root with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

**Where to get these values:**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to **Settings → API**
4. Copy the **Project URL** and **Anon Key**

### Step 4: Run the Development Server
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Step 5: Verify Supabase Tables
Before using the app, ensure these tables exist in Supabase:
- `users` - User profiles
- `habits` - Habit definitions  
- `habit_completions` - Daily completions
- `sleep_tracking` - Sleep logs
- `achievements` - User achievements
- `friends` - Friend relationships
- `groups` - Group definitions
- `group_members` - Group memberships

If tables are missing, run the SQL scripts in `scripts/` directory in Supabase SQL Editor.

## Architecture

### Frontend (React/Next.js)
- `app/` - Next.js pages and routes
- `components/` - React components
- `lib/supabase/` - Supabase client configuration

### Database (Supabase PostgreSQL)
- 8+ tables with proper relationships
- Row-level security (RLS) for data privacy
- Real-time subscriptions support

### Authentication
- Supabase Auth (Email/Password)
- Session management with cookies
- Protected routes via middleware

## Features Implemented

✅ User Authentication (Signup/Login)
✅ Habit Creation & Management
✅ Daily Habit Tracking
✅ Automatic Streak Calculation
✅ Sleep Tracking
✅ Progress Analytics
✅ Friend Connections
✅ Group Management
✅ Admin Dashboard
✅ Dark Mode Support
✅ Mobile Responsive
✅ Data Export

## Debugging

If you encounter issues:

### 1. Check Browser Console
Open DevTools (F12) and look for messages starting with `[v0]`:
- `[v0] Current user loaded:` - Auth working
- `[v0] Habits loaded:` - Data loading working
- `[v0] Error:` - Something failed

### 2. Check Supabase Connectivity
```bash
# The app will show an alert if:
# - Environment variables are missing
# - Supabase credentials are invalid
# - RLS policies are blocking requests
```

### 3. Common Issues

**"Supabase client is not initialized"**
- Check `.env.local` has correct URL and API key
- Restart the dev server after adding env vars

**"No rows returned"**
- Verify tables exist in Supabase
- Check RLS policies allow your user to read/write
- Ensure user is authenticated

**"Habit not saving"**
- Check browser console for error messages
- Verify RLS policy for `habits` table allows INSERT
- Check user ID is correct

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Deployment

### Deploy to Vercel
```bash
vercel deploy
```

Add environment variables in Vercel project settings:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Deploy to Other Platforms
The app is a standard Next.js app and can be deployed to:
- Netlify
- AWS Amplify
- Google Cloud Run
- Azure App Service
- Any Node.js hosting

## File Structure

```
v0-project/
├── app/
│   ├── api/              # API routes
│   ├── auth/             # Authentication pages
│   ├── tracker/          # Main tracker page
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── components/
│   ├── habit-tracker.tsx # Main tracker component
│   ├── add-habit-dialog.tsx
│   ├── habit-categories.tsx
│   ├── achievements.tsx
│   └── [other components]
├── lib/
│   ├── supabase/
│   │   ├── client.ts     # Browser client
│   │   ├── server.ts     # Server client
│   │   └── proxy.ts      # Middleware
│   └── utils.ts
├── scripts/              # Database setup SQL
├── public/               # Static assets
├── .env.local.example    # Example env vars
├── next.config.mjs       # Next.js config
└── package.json
```

## FAQ

**Q: Do I need to create database tables manually?**
A: No, if they don't exist, run the SQL scripts in the `scripts/` folder in Supabase SQL Editor.

**Q: Can I use this with a different database?**
A: You'll need to modify `lib/supabase/` to use your database client and update table references.

**Q: How do I enable RLS for security?**
A: RLS policies are included in the SQL scripts. Enable them in Supabase for each table.

**Q: Can I add more features?**
A: Yes! Add new tables in Supabase, create components, and wire them up to the tracker.

## Support

For issues:
1. Check the console for `[v0]` debug messages
2. Verify Supabase env vars are correct
3. Check Supabase dashboard for any errors
4. Review the error messages - they're specific and actionable

## Production Checklist

Before deploying:
- [ ] Test all features in development
- [ ] Set up RLS policies in Supabase
- [ ] Enable email confirmation for signups
- [ ] Set up proper error logging (Sentry, etc.)
- [ ] Configure CORS if needed
- [ ] Add environment variables to hosting platform
- [ ] Test authentication flow
- [ ] Verify database backups are configured

---

**Version:** 1.0.0 (Supabase Edition)
**Last Updated:** May 2026
**Status:** Production Ready with Supabase
