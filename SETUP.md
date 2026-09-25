# 🚀 Quick Setup Guide

## Prerequisites
- Node.js v18+
- npm
- Supabase account

## Setup Steps

### 1. Fix npm Registry (if you got 403 errors)
```bash
npm config set registry https://registry.npmjs.org/
npm cache clean --force
```

### 2. Install Dependencies
```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

### 3. Create Environment Files

**Backend** (`backend/.env`):
```bash
cp backend/.env.example backend/.env
```
Then edit `backend/.env` and add your Supabase credentials:
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

**Frontend** (`frontend/.env`):
```bash
cp frontend/.env.example frontend/.env
```
Then edit `frontend/.env`:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:3001
```

### 4. Set Up Database

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project (or use existing)
3. Navigate to **SQL Editor**
4. Copy the entire contents of `database/schema.sql`
5. Paste and **Run** the SQL script
6. Verify tables were created under **Table Editor**

### 5. Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
✅ Backend should start on `http://localhost:3001`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
✅ Frontend should start on `http://localhost:5173`

### 6. Test the App

1. Open `http://localhost:5173` in your browser
2. Click **Register** to create an account
3. Fill in: Email, Password, Full Name
4. Login with your credentials
5. You should see the Dashboard!

---

## 🎯 Quick Test Checklist

After setup, test these features:

- ✅ **Register/Login** - Create account and login
- ✅ **Dashboard** - View spending overview
- ✅ **Add Expense** - Create a test expense
- ✅ **Add Income** - Create a test income
- ✅ **Categories** - View/create categories
- ✅ **Budgets** - Set a monthly budget
- ✅ **Analytics** - View charts and trends
- ✅ **Profile** - Update your profile

---

## 🐛 Troubleshooting

### Backend won't start
- Check `.env` file has correct Supabase credentials
- Verify port 3001 is not in use: `lsof -i :3001`
- Check logs for specific errors

### Frontend won't start
- Run `npm install` in frontend directory
- Check `.env` has correct values
- Verify port 5173 is available

### "Cannot connect to backend"
- Ensure backend is running on port 3001
- Check `VITE_API_URL` in frontend `.env`
- Check browser console for CORS errors

### Database/Auth errors
- Verify you ran the `database/schema.sql` script
- Check Supabase project is active
- Verify RLS policies are enabled (should be by default)

---

## 📝 Notes

- Default categories are auto-created on first user signup
- Budget `current_spend` auto-updates via database triggers
- All API routes require authentication (except /auth/*)
- UPI SMS parsing endpoint available at `/api/expenses/sms-parse`

---

Ready to use! 🎉
