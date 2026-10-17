# 🏨 Hotel Shyadri - Setup & Deployment Guide

This repository contains the complete **Hotel Shyadri Guest Portal, In-Room Dining & Room Service System** with:
- 🍛 **Food & Drinks In-Room Ordering** (Cart, quantities, veg/non-veg filter)
- 🧴 **Toiletries & Amenities Requests** (Towels, dental kit, soap, water, extra pillows)
- 🛎️ **Custom Staff Requests** (Housekeeping, front desk, maintenance)
- 📲 **Simultaneous WhatsApp & SMS Dispatch** to staff number
- 📍 **Live Order Track Page** (Only room number & order price displayed publicly for privacy)
- 👨‍🍳 **Kitchen Dashboard** (Filtered food & drink queue)
- 🏨 **Hotel Staff Dashboard** (All requests & guest management)
- ⚠️ **Mandatory Staff Alert**: *"Check customer is present in the room before accepting the order"*
- ⚡ **Supabase Realtime Cloud Sync** (Instant updates across devices)
- 🚀 **100% Free Hosting on Vercel**

---

## ⚡ Step 1: Free Supabase Cloud Database Setup (2 Minutes)

Supabase provides a generous free PostgreSQL database with real-time subscriptions.

1. Go to [supabase.com](https://supabase.com) and sign up / log in (free).
2. Click **"New project"**, choose an organization, name it `hotel-shyadri`, and set a database password.
3. In your Supabase project dashboard, click **"SQL Editor"** on the left menu.
4. Click **"New query"**, then copy and paste the entire contents of [`supabase_schema.sql`](file:///c:/Users/JOY/OneDrive/Desktop/shyadri%20hotel/supabase_schema.sql) into the editor.
5. Click **"Run"** (green button).
   - This creates the `hotel_orders` table.
   - Enables Realtime replication.
   - Configures Row Level Security (RLS) policies for guest inserts and staff updates.
6. Now go to **Project Settings** (gear icon) ➡️ **API**.
7. Copy:
   - **Project URL** (e.g. `https://your-id.supabase.co`)
   - **Project API Keys** ➡️ `anon` `public` key.
8. Open your Hotel Shyadri app, click **Admin** (top right) ➡️ enter password `admin123` ➡️ click the **⚡ Supabase** tab, paste the URL and Key, and click **Save Cloud Settings**!

---

## 🚀 Step 2: Host on Vercel for 100% Free

Vercel provides free, high-speed global static hosting with custom domain support and SSL certificates.

### Option A: Via GitHub (Recommended)
1. Push this folder to a GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Hotel Shyadri full portal with ordering, track page, dashboards, and Supabase"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```
2. Go to [vercel.com](https://vercel.com) and sign in.
3. Click **"Add New..."** ➡️ **"Project"**.
4. Import your GitHub repository.
5. Framework Preset: **Other** (Static Site).
6. Click **Deploy**. In under 15 seconds, your site will be live at `https://your-project.vercel.app`!

### Option B: Using Vercel CLI (No Git needed)
Open PowerShell in this folder and run:
```powershell
npx vercel
```
Follow the prompts (log in, choose your account, accept default options). Vercel will deploy and output your live production URL!

---

## 📱 Features Walkthrough

### 1. In-Room Food, Drink & Toiletries Ordering
- Guests browse the categorized menu, filter by "Veg only", or search.
- Tap **+ Add** to add dishes with custom quantity steppers.
- Under the **Toiletries** tab, guests can request complimentary items (towels, soap, shampoo, dental kit, extra pillows, mineral water).
- Custom request box lets guests ask for anything (e.g. room cleaning, iron, extra key).

### 2. Required Checkout Details & Simultaneous WhatsApp/SMS
- When placing an order, guests must enter:
  - 🚪 **Room Number**
  - 👤 **Guest Name**
  - 📞 **Phone Number** (Optional)
  - 📝 **Extra Note / Special Cooking Instructions**
- Placing the order:
  1. Sends the order to Supabase cloud & local store.
  2. Simultaneously opens **WhatsApp** directly to the staff number with a formatted order breakdown.
  3. Provides an instant **SMS** button fallback.

### 3. Live Track Page (Strict Privacy Rules)
- Accessible by tapping **📍 Track** on the bottom navigation dock.
- **My Room**: Shows the guest's detailed order history and status timeline.
- **Live Hotel Order Board**: Publicly visible to all guests, but strictly respects privacy by showing **ONLY**:
  - 🚪 **Room Number**
  - 💰 **Order Price** (or Complimentary)
  - 🏷️ **Status Badge** (Received ⏳, In Preparation 👨‍🍳, Out for Delivery 🛎️, Delivered ✅)
  - ⏱️ **Time ago**

### 4. Kitchen & Hotel Staff Dashboards
- Tap **👨‍🍳 Kitchen** or **🏨 Staff** in the top bar.
- Kitchen dashboard focuses on food orders with chef notes.
- Hotel dashboard manages all requests (food, toiletries, housekeeping, custom).
- **Security Alert Prompt**: Whenever staff clicks **Accept Order / Request**, an alert modal appears:
  > ⚠️ **Verification Required**
  > **"Check customer is present in the room before accepting the order"**
  > *"कृपया खात्री करा की पाहुणे खोलीत हजर आहेत."*

### 5. Staff WhatsApp & Phone Configuration
- Click **Admin** (password: `admin123`).
- Go to **Info & WhatsApp** tab to update:
  - Staff WhatsApp number (e.g. `+919876543210`)
  - Reception phone number
  - WiFi credentials
  - House rules & Google review link
