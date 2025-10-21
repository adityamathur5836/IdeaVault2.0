# Environment Setup Guide

This document provides comprehensive instructions for setting up the IdeaVault 2.0 environment variables and configuration.

## Overview

IdeaVault 2.0 requires several external services to function properly:
- **Clerk** for authentication
- **Supabase** for database operations (dual database setup)
- **Google Gemini** for AI-powered features
- **Application** configuration for URLs and settings

## Required Environment Variables

### 1. Clerk Authentication

```bash
# Clerk Configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
CLERK_SECRET_KEY=sk_test_your_secret_key_here
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

**Setup Instructions:**
1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Create a new application or select existing one
3. Copy the publishable key and secret key from the API Keys section
4. Configure redirect URLs in the Clerk dashboard to match your application URLs

### 2. Supabase Configuration (Dual Database Setup)

```bash
# Supabase A - Read-only ideas database (140k+ business ideas)
NEXT_PUBLIC_SUPABASE_A_URL=https://your-project-a.supabase.co
NEXT_PUBLIC_SUPABASE_A_ANON_KEY=your_anon_key_for_database_a

# Supabase B - User data database (user ideas, reports, milestones)
NEXT_PUBLIC_SUPABASE_B_URL=https://your-project-b.supabase.co
NEXT_PUBLIC_SUPABASE_B_ANON_KEY=your_anon_key_for_database_b
SUPABASE_B_SERVICE_ROLE_KEY=your_service_role_key_for_database_b
```

**Setup Instructions:**

#### Supabase A (Ideas Database):
1. Create a new Supabase project for the ideas database
2. Import the ideas dataset (product_hunt_products table)
3. Enable pgvector extension for vector similarity search
4. Copy the project URL and anon key

#### Supabase B (User Database):
1. Create a second Supabase project for user data
2. Set up the following tables:
   - `user_ideas` - User's saved and generated ideas
   - `idea_reports` - Generated business reports
   - `milestones` - User progress tracking
3. Copy the project URL, anon key, and service role key

### 3. Google Gemini AI Configuration

```bash
# Google Gemini API
GOOGLE_GEMINI_API_KEY=AIzaSyYour_Gemini_API_Key_Here
```

**Setup Instructions:**
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Create a new API key
3. Enable the Gemini API for your project
4. Copy the API key

### 4. Application Configuration

```bash
# Application Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Environment File Setup

### Development (.env.local)

Create a `.env.local` file in your project root:

```bash
# Copy this template and fill in your actual values

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_key_here
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Supabase A - Ideas Database
NEXT_PUBLIC_SUPABASE_A_URL=https://your-project-a.supabase.co
NEXT_PUBLIC_SUPABASE_A_ANON_KEY=your_anon_key_a

# Supabase B - User Database
NEXT_PUBLIC_SUPABASE_B_URL=https://your-project-b.supabase.co
NEXT_PUBLIC_SUPABASE_B_ANON_KEY=your_anon_key_b
SUPABASE_B_SERVICE_ROLE_KEY=your_service_role_key_b

# Google Gemini AI
GOOGLE_GEMINI_API_KEY=AIzaSyYour_API_Key

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Production Environment

For production deployment, set these environment variables in your hosting platform:

- **Vercel**: Project Settings → Environment Variables
- **Netlify**: Site Settings → Environment Variables
- **Railway**: Project → Variables
- **Docker**: Use environment files or docker-compose.yml

## Security Best Practices

### 1. Environment Variable Security

- **Never commit** `.env.local` or `.env` files to version control
- **Use different keys** for development and production
- **Rotate keys regularly** especially for production
- **Limit API key permissions** to only what's needed

### 2. Supabase Security

- **Enable Row Level Security (RLS)** on all tables
- **Use service role key only on server-side** operations
- **Configure proper CORS settings** for your domain
- **Regular backup** of your databases

### 3. Clerk Security

- **Configure allowed domains** in Clerk dashboard
- **Enable MFA** for admin accounts
- **Set up proper redirect URLs** to prevent open redirects
- **Monitor authentication logs** for suspicious activity

## Validation and Troubleshooting

### Environment Validation

The application includes built-in environment validation:

1. **Automatic validation** on application startup
2. **Configuration banner** displays missing variables
3. **Graceful error handling** for missing configurations
4. **Development console logging** for debugging

### Common Issues

#### 1. "Database Configuration Required" Error
- Check Supabase URLs and keys are correct
- Verify Supabase projects are active
- Ensure pgvector extension is enabled for ideas database

#### 2. "Authentication Error"
- Verify Clerk keys are correct
- Check redirect URLs match your application
- Ensure Clerk application is active

#### 3. "AI Service Error"
- Verify Google Gemini API key is valid
- Check API quotas and billing
- Ensure Gemini API is enabled for your project

### Testing Configuration

Run the application in development mode to test configuration:

```bash
npm run dev
```

Check the browser console and configuration banner for any issues.

## Support

If you encounter issues with environment setup:

1. Check the configuration banner in the application
2. Review browser console for detailed error messages
3. Verify all services are properly configured
4. Contact support with specific error messages

## Migration Notes

When updating from previous versions:

1. **Backup existing environment variables**
2. **Update variable names** if changed
3. **Test thoroughly** in development before production
4. **Update deployment configurations** as needed
