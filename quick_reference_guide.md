# 🚀 QUICK REFERENCE - Expense Tracker App

## 📦 TECH STACK AT A GLANCE

| Layer | Technology | Why? |
|-------|-----------|------|
| **Frontend** | React 18 + TypeScript + Tailwind CSS | Modern, fast, type-safe |
| **Backend** | Node.js + Express + TypeScript | Lightweight, JavaScript everywhere |
| **Database** | Supabase (PostgreSQL) | Free tier, built-in auth, real-time |
| **Charts** | Recharts | Free, lightweight, React-friendly |
| **UI Components** | shadcn/ui + Tailwind | Modern design system |
| **State** | Zustand/Context API | Lightweight state management |
| **Hosting** | Vercel (Frontend) + Railway (Backend) | Free tier, easy CI/CD |

---

## 🔑 KEY FEATURES

### ✅ Must-Have
1. **Auto UPI Import** - Parse SMS, extract transactions
2. **Manual Entry** - Add cash expenses with category
3. **Weekly Charts** - Line/bar charts for trend
4. **Monthly Analytics** - Total, by category, daily average
5. **Custom Categories** - User can create own categories
6. **Dark/Light Mode** - Theme toggle with persistence
7. **Secure Auth** - JWT + Password hashing

### 🎯 Nice-to-Have (Phase 2)
- Budget alerts
- Recurring expenses
- Receipt image upload
- Export to CSV/PDF
- Spending insights (by hour, top merchants)

---

## 🗂️ DATABASE TABLES (Simple Version)

```
users              → id, email, password_hash, currency, theme
expense_categories → id, user_id, name, icon, color
expenses           → id, user_id, category_id, amount, date, description
budgets            → id, user_id, category_id, monthly_limit
```

---

## 💻 SETUP IN 5 MINUTES

```bash
# 1. Create Supabase account (FREE)
# https://supabase.com → Create Project

# 2. Clone template
git clone https://github.com/yourusername/expense-tracker
cd expense-tracker

# 3. Install & setup
npm install
cp .env.example .env.local
# Add Supabase keys to .env.local

# 4. Run locally
npm run dev
# http://localhost:5173

# 5. Deploy
# Frontend: Push to GitHub → Vercel auto-deploys
# Backend: Push to GitHub → Railway auto-deploys
```

---

## 🎨 COLOR PALETTE

**Light Mode**
```
Primary: #2563EB (Blue)
Secondary: #10B981 (Green)
Accent: #F59E0B (Amber)
Background: #FFFFFF
Text: #1F2937 (Dark Gray)
```

**Dark Mode**
```
Primary: #60A5FA (Light Blue)
Secondary: #34D399 (Light Green)
Accent: #FBBF24 (Light Amber)
Background: #0F172A (Very Dark)
Text: #F1F5F9 (White)
```

---

## 📱 CORE UI SCREENS

```
1. Login/Register      → Simple form
2. Dashboard           → Daily avg + Weekly chart + Recent transactions
3. Add Expense         → Modal with form (amount, category, date, description)
4. Analytics           → Multiple charts (weekly, monthly, by category)
5. Categories          → List of categories + Add/Edit/Delete
6. Profile Settings    → Theme, currency, password, export data
```

---

## 🔐 SECURITY CHECKLIST

✅ Hash passwords with bcrypt  
✅ JWT tokens in HttpOnly cookies  
✅ Rate limit login (5 attempts → 15 min lockout)  
✅ Validate all inputs (backend)  
✅ HTTPS only in production  
✅ Never log sensitive data  
✅ Row-level security on database  
✅ Sanitize user inputs (prevent XSS)  

---

## 🛣️ API ENDPOINTS (Main Routes)

```
Authentication:
  POST /api/auth/register
  POST /api/auth/login
  POST /api/auth/logout

Expenses:
  GET  /api/expenses              (list all)
  POST /api/expenses              (create)
  PUT  /api/expenses/:id          (update)
  DELETE /api/expenses/:id        (delete)
  POST /api/expenses/sms-parse    (parse SMS)

Categories:
  GET  /api/categories
  POST /api/categories
  PUT  /api/categories/:id
  DELETE /api/categories/:id

Analytics:
  GET /api/analytics/dashboard
  GET /api/analytics/daily
  GET /api/analytics/weekly
  GET /api/analytics/monthly
```

---

## 📊 EXPENSE CATEGORIES (Predefined)

```
🍔 Food           | 🚗 Ride/Transport  | 🏥 Health      | 🛍️ Shopping
🏠 Rent/Utilities | 📱 Subscriptions   | 💇 Personal    | 🎮 Entertainment
✈️ Travel        | 🧹 Household       | 📚 Education   | 🎁 Gifts
💼 Work          | 🚬 Others
```

---

## 🆓 FREE TIER LIMITS

| Service | Free Limit | Sufficient? |
|---------|-----------|-------------|
| Supabase DB | 500 MB | ✅ Yes (for 1 user) |
| Supabase Bandwidth | 2 GB/month | ✅ Yes |
| Vercel Hosting | Unlimited | ✅ Yes |
| Railway Backend | $5/month free credits | ✅ Yes |
| GitHub Actions | 2000 min/month | ✅ Yes |

---

## 🧪 TESTING ENDPOINTS (Postman Collection)

```json
{
  "register": {
    "url": "http://localhost:3001/api/auth/register",
    "method": "POST",
    "body": {
      "email": "test@example.com",
      "password": "Test@1234",
      "fullName": "John Doe"
    }
  },
  
  "addExpense": {
    "url": "http://localhost:3001/api/expenses",
    "method": "POST",
    "headers": {"Authorization": "Bearer <token>"},
    "body": {
      "amount": 500,
      "categoryId": "uuid",
      "description": "Lunch",
      "expenseDate": "2026-09-25"
    }
  }
}
```

---

## ⚠️ COMMON PITFALLS & SOLUTIONS

| Problem | Solution |
|---------|----------|
| SMS not accessible in browser | Implement manual import (copy-paste) |
| CORS errors | Add backend to CORS whitelist |
| Duplicate SMS entries | Check transaction ID before saving |
| Poor chart performance | Limit data points (paginate) |
| Slow database queries | Add indexes on frequent filters |
| Users lose theme preference | Store in localStorage + DB |

---

## 📈 SCALING LATER

When you want to scale beyond free tier:
- Supabase: Upgrade to paid plan ($25/month)
- Railway: Upgrade to paid plan ($7+/month per service)
- Vercel: Stays free for hobbyists
- Database: Scale PostgreSQL on Supabase easily

---

## 🎯 BUILD PRIORITY (In Order)

```
Week 1: Auth + Dashboard UI
Week 2: Expense CRUD + Local storage
Week 3: Supabase integration + SMS parsing
Week 4: Charts + Analytics
Week 5: Categories + Dark mode
Week 6: Polish + Testing
Week 7: Deploy + Launch
```

---

## 📚 KEY DOCUMENTATION LINKS

- **Supabase Setup:** https://supabase.com/docs/guides/getting-started
- **React Hooks:** https://react.dev/reference/react
- **Tailwind:** https://tailwindcss.com/docs
- **Recharts:** https://recharts.org/examples
- **Express API:** https://expressjs.com/en/api.html
- **JWT:** https://jwt.io

---

## 💡 PRO TIPS

✨ **Start small:** Build MVP (basic expense tracking) first  
✨ **Test early:** Test login + add expense before building charts  
✨ **Use TypeScript:** Catches bugs before runtime  
✨ **Mobile first:** Design for phone, then scale up  
✨ **Backup early:** Export data regularly during development  
✨ **Commit often:** Small, meaningful git commits  

---

## 🚨 BEFORE GOING LIVE

- [ ] Test all authentication flows
- [ ] Verify SMS parsing with real examples
- [ ] Test on real mobile devices
- [ ] Security audit (penetration testing)
- [ ] Performance testing (load test)
- [ ] Backup database
- [ ] Setup error monitoring (Sentry)
- [ ] Privacy policy & T&C ready
- [ ] HTTPS enabled
- [ ] Rate limiting active

---

## ✉️ FINAL COMMAND TO PASTE IN CLAUDE CODE

When ready to build, paste this in Claude Code:

```
"I want to build a monthly expense tracker web app. 
Use this detailed specification: [INSERT FULL PROMPT FROM expense_tracker_claude_code_prompt.md]

Build it step by step, starting with authentication and basic CRUD operations 
before moving to analytics features. Use React + TypeScript for frontend, 
Express.js for backend, and Supabase for database. 
Make it secure, responsive, and user-friendly with dark/light mode support."
```

---

**You're all set! Start building! 🚀**
