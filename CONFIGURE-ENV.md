# 🚨 IMPORTANT: Configure Environment Variables

## Backend Setup Required

Your **backend/.env** file currently has placeholder values. You need to:

### 1. Get Your Supabase Credentials

1. Go to **[Supabase Dashboard](https://supabase.com/dashboard)**
2. Select your project (or create a new one)
3. Navigate to **Settings** → **API**
4. Copy the following:
   - **Project URL** (e.g., `https://abcdefgh.supabase.co`)
   - **anon public** key
   - **service_role** key (click "Reveal" to see it)

### 2. Update backend/.env

Replace the placeholder values in `backend/.env`:

```env
# Replace these with your ACTUAL Supabase credentials:
SUPABASE_URL=https://your-actual-project-id.supabase.co
SUPABASE_SERVICE_KEY=your-actual-service-role-key
SUPABASE_ANON_KEY=your-actual-anon-key

# These can stay as is:
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your-jwt-secret-here
```

### 3. Update frontend/.env

Replace the placeholder values in `frontend/.env`:

```env
# Replace these with your ACTUAL Supabase credentials:
VITE_SUPABASE_URL=https://your-actual-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-actual-anon-key

# This can stay as is:
VITE_API_URL=http://localhost:3001
```

### 4. Set Up Database

Before starting the backend, you MUST run the database schema:

1. In Supabase Dashboard → **SQL Editor**
2. Copy the entire contents of `database/schema.sql`
3. Paste into the editor
4. Click **Run** (or press Cmd/Ctrl + Enter)
5. Verify tables were created under **Table Editor** tab

### 5. Install Missing Frontend Dependency

```bash
cd frontend
npm install lucide-react
```

### 6. Restart Servers

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

---

## ✅ Once configured:

- Backend will start successfully on `http://localhost:3001`
- Frontend will compile and run on `http://localhost:5173`
- You can register a new account and start using the app!

---

## 🆘 Need Help?

If you don't have a Supabase account yet:
1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up (free tier is perfect for this app)
4. Create a new project
5. Wait for it to initialize (~2 minutes)
6. Follow steps above to get credentials
