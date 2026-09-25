# 💰 Expense Tracker

A full-stack expense tracking application built with React, TypeScript, Express, and Supabase.

## ✨ Features

- 📊 **Dashboard** - View spending overview, trends, and recent transactions
- 💸 **Expense Tracking** - Add, edit, and delete expenses with categories
- 💰 **Income Management** - Track income from multiple sources
- 📱 **UPI SMS Parsing** - Automatically extract transaction details from UPI SMS
- 📈 **Analytics** - Visualize spending patterns with interactive charts
- 🎯 **Budget Management** - Set monthly budgets per category with alerts
- 🏷️ **Categories** - Customizable expense categories with icons and colors
- 🔐 **Authentication** - Secure user authentication with Supabase
- 🎨 **Theme Support** - Light/Dark mode toggle
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **React Router** - Routing
- **Zustand** - State management
- **date-fns** - Date manipulation
- **Axios** - HTTP client

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **TypeScript** - Type safety
- **Supabase** - Database & Authentication
- **CORS** - Cross-origin support
- **dotenv** - Environment variables

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd expense
```

### 2. Set Up Supabase

1. Go to [Supabase](https://supabase.com) and create a new project
2. Once created, go to **SQL Editor** in the Supabase dashboard
3. Copy and paste the contents of `database/schema.sql`
4. Run the SQL script to create all tables, triggers, and policies
5. Note your project URL and API keys from **Settings > API**

### 3. Configure Environment Variables

#### Backend Configuration

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` and fill in your Supabase credentials:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=your-supabase-service-role-key
SUPABASE_ANON_KEY=your-supabase-anon-key
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

#### Frontend Configuration

```bash
cd ../frontend
cp .env.example .env
```

Edit `frontend/.env`:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_API_URL=http://localhost:3001
```

### 4. Install Dependencies

#### Install Backend Dependencies

```bash
cd backend
npm install
```

#### Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### 5. Run the Application

#### Start Backend Server

```bash
cd backend
npm run dev
```

Backend will run on `http://localhost:3001`

#### Start Frontend Development Server

```bash
cd frontend
npm run dev
```

Frontend will run on `http://localhost:5173`

### 6. Create Your First Account

1. Open `http://localhost:5173` in your browser
2. Click **Register** to create a new account
3. Fill in your email, password, and full name
4. Check your email for verification link (if email verification is enabled)
5. Login with your credentials

## 📁 Project Structure

```
expense/
├── backend/                 # Express backend
│   ├── src/
│   │   ├── middleware/     # Auth middleware
│   │   ├── routes/         # API routes
│   │   ├── services/       # Supabase client
│   │   └── server.ts       # Entry point
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── context/       # React contexts
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── types/         # TypeScript types
│   │   ├── utils/         # Utility functions
│   │   ├── App.tsx        # Main app component
│   │   └── main.tsx       # Entry point
│   ├── package.json
│   ├── tailwind.config.cjs
│   └── vite.config.ts
│
└── database/
    └── schema.sql          # Database schema
```

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Expenses
- `GET /api/expenses` - Get all expenses
- `POST /api/expenses` - Create expense
- `GET /api/expenses/:id` - Get single expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense
- `POST /api/expenses/sms-parse` - Parse UPI SMS

### Incomes
- `GET /api/incomes` - Get all incomes
- `POST /api/incomes` - Create income
- `GET /api/incomes/:id` - Get single income
- `PUT /api/incomes/:id` - Update income
- `DELETE /api/incomes/:id` - Delete income

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category
- `GET /api/categories/:id` - Get single category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category
- `POST /api/categories/:id/archive` - Archive category

### Budgets
- `GET /api/budgets` - Get all budgets
- `POST /api/budgets` - Create budget
- `GET /api/budgets/:id` - Get single budget
- `PUT /api/budgets/:id` - Update budget
- `DELETE /api/budgets/:id` - Delete budget
- `GET /api/budgets/alerts` - Get budget alerts

### Analytics
- `GET /api/analytics/dashboard` - Get dashboard data
- `GET /api/analytics/spending-by-hour` - Get hourly spending
- `GET /api/analytics/top-merchants` - Get top merchants
- `GET /api/analytics/recurring` - Detect recurring expenses

## 🧪 Testing

### Run Frontend Tests

```bash
cd frontend
npm test
```

### Run Backend Tests

```bash
cd backend
npm test
```

## 🏗️ Building for Production

### Build Frontend

```bash
cd frontend
npm run build
```

### Build Backend

```bash
cd backend
npm run build
npm start
```

## 🐛 Troubleshooting

### Backend won't start
- Ensure all environment variables are set correctly in `backend/.env`
- Check that Supabase credentials are valid
- Verify port 3001 is not already in use

### Frontend won't start
- Run `npm install` in the frontend directory
- Ensure environment variables are set in `frontend/.env`
- Check that port 5173 is available

### Database errors
- Ensure you've run the `database/schema.sql` script in Supabase
- Verify RLS policies are enabled
- Check that your Supabase service role key has proper permissions

### Authentication issues
- Clear browser cache and cookies
- Verify Supabase URL and anon key in frontend `.env`
- Check Supabase Auth settings in dashboard

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues and questions, please open an issue on the repository.

---

Built with ❤️ using React, TypeScript, and Supabase
