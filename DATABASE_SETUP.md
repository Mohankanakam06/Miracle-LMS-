# Quick Database Setup Guide

## ✅ Your Database Schema is Ready!

The tables are already created. Now you just need to add the triggers and security policies.

## 🚀 One-Time Setup (2 minutes)

### Option 1: Supabase SQL Editor (Recommended)

1. **Open Supabase SQL Editor**
   - Go to: https://supabase.com/dashboard/project/lknlunsnuxyyegklhqsh/sql
   
2. **Copy the SQL**
   - Open file: `supabase/migrations/20260202000000_setup_triggers_and_rls.sql`
   - Copy ALL the content (Ctrl+A, Ctrl+C)
   
3. **Run it**
   - Paste into SQL Editor
   - Click "Run" or press Ctrl+Enter
   
4. **Done!**
   - You should see success messages
   - Ignore any "already exists" warnings

### Option 2: Command Line (If you prefer)

```bash
# Install Supabase CLI if you haven't
npm install -g supabase

# Link to your project (one-time)
npx supabase link --project-ref lknlunsnuxyyegklhqsh

# Push the migration
npx supabase db push --include-all
```

## 🎯 What This Does

✅ Creates trigger to auto-create user profiles on signup  
✅ Creates triggers to auto-update timestamps  
✅ Adds Row Level Security policies for data protection  
✅ Sets up proper permissions for students, teachers, and admins  

## 🧪 Test It Works

After running the SQL:

1. **Try to sign up** - A new user should get a profile automatically
2. **Try to login** - Should work without errors
3. **Check the dashboard** - Should load your data

## ❓ If You Get Errors

**"already exists" errors** → Ignore them, it means it's already set up!  
**"permission denied" errors** → Make sure you're using the correct Supabase credentials  
**Other errors** → Let me know and I'll help fix them

## 🎉 After Setup

Your LMS will be fully functional with:
- ✅ User authentication
- ✅ Role-based access control
- ✅ All features working
- ✅ Data security enabled

Just run the SQL once and you're done!
