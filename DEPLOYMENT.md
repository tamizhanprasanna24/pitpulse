# Complete Production Deployment Guide - Pit Pulse

This guide provides step-by-step instructions to deploy **Pit Pulse** with a real **Supabase Database**, **Vercel Frontend**, **Render Backend** (if applicable), and **GitHub Repository**.

---

## 1. Push Project to GitHub

### Step 1.1: Initialize Git and Commit Changes
Open Terminal / PowerShell in your project directory `c:\Projects\project`:

```bash
git init
git add .
git commit -m "Initial commit - Pit Pulse Healthcare Platform with PWA & Auth"
git branch -M main
```

### Step 1.2: Create Repository on GitHub
1. Go to [GitHub.com](https://github.com) and sign in.
2. Click **+** (top right) -> **New repository**.
3. Name your repository: `pit-pulse` (or `smart-healthcare-app`).
4. Set visibility to **Public** or **Private**.
5. Click **Create repository** (do NOT initialize with README).

### Step 1.3: Link and Push Code
Copy the repository URL from GitHub and run:

```bash
git remote add origin https://github.com/YOUR_USERNAME/pit-pulse.git
git push -u origin main
```

---

## 2. Set Up Real Supabase Database

### Step 2.1: Create Supabase Project
1. Go to [Supabase.com](https://supabase.com) and log in.
2. Click **New Project**.
3. Select your organization, enter Project Name: `pit-pulse-db`, set a Database Password, and choose a Region close to your users.
4. Click **Create new project**.

### Step 2.2: Apply Database Schemas & Migrations
1. In your Supabase Dashboard, click on **SQL Editor** in the left navigation sidebar.
2. Click **New Query**.
3. Open [`supabase/migrations/20260803085234_create_pitpulse_schema.sql`](file:///c:/Projects/project/supabase/migrations/20260803085234_create_pitpulse_schema.sql) in your code editor, copy the entire SQL content, paste it into the Supabase SQL Editor, and click **Run**.
4. Click **New Query** again.
5. Open [`supabase/migrations/20260806041536_add_prescriptions_and_surveys_tables.sql`](file:///c:/Projects/project/supabase/migrations/20260806041536_add_prescriptions_and_surveys_tables.sql), copy the content, paste it into the SQL Editor, and click **Run**.

### Step 2.3: Get Supabase API Credentials
1. In your Supabase Dashboard, go to **Project Settings** (gear icon at the bottom left) -> **API**.
2. Copy the following two credentials:
   - **Project URL**: `https://xxxxxxxxxxxx.supabase.co`
   - **anon / public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

## 3. Deploy Frontend on Vercel

### Step 3.1: Connect GitHub to Vercel
1. Go to [Vercel.com](https://vercel.com) and log in using your GitHub account.
2. Click **Add New...** -> **Project**.
3. Import the `pit-pulse` repository from your GitHub list.

### Step 3.2: Configure Environment Variables
1. Under **Environment Variables**, add the following keys using your credentials from Supabase:

| Environment Variable Key | Value |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://YOUR_PROJECT_ID.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `YOUR_SUPABASE_ANON_KEY` |

2. Framework Preset: **Next.js** (auto-detected).
3. Root Directory: `./`

### Step 3.3: Deploy
1. Click **Deploy**.
2. Wait 1-2 minutes for Vercel to build and publish your Next.js frontend & PWA.
3. Vercel will provide your live URL (e.g. `https://pit-pulse.vercel.app`).

---

## 4. Deploy Backend on Render (Optional Node.js / Express Backend)

*Note: Next.js App Router includes built-in serverless API endpoints deployed directly on Vercel. However, if you add a standalone Node.js Express server to `backend/` or `server/`:*

### Step 4.1: Create Render Web Service
1. Go to [Render.com](https://render.com) and sign in.
2. Click **New +** -> **Web Service**.
3. Select **Build and deploy from a Git repository** and connect your GitHub account.
4. Choose your `pit-pulse` repository.

### Step 4.2: Configure Render Build Settings
- **Name**: `pitpulse-api`
- **Environment**: `Node`
- **Region**: Choose closest to your database.
- **Branch**: `main`
- **Build Command**: `npm install`
- **Start Command**: `npm start` (or `node server.js`)

### Step 4.3: Environment Variables on Render
Add environment variables under **Environment**:
- `NEXT_PUBLIC_SUPABASE_URL` = `https://YOUR_PROJECT_ID.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY` = `YOUR_SUPABASE_SERVICE_ROLE_KEY`
- `PORT` = `10000`

Click **Create Web Service**.

---

## 5. Enable Production Email & OTP on Supabase

1. In Supabase Dashboard, go to **Authentication** -> **Providers** -> **Email**.
2. Enable **Confirm email** and **Secure email change**.
3. To send real emails to users, go to **Authentication** -> **SMTP Settings**, enable **Custom SMTP**, and enter credentials from SendGrid, Resend, or Mailgun.
