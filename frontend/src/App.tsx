import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { IncomeProvider } from './context/IncomeContext';
import { ExpenseProvider } from './context/ExpenseContext';
import { CategoryProvider } from './context/CategoryContext';
import { BudgetProvider } from './context/BudgetContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AddExpense from './pages/AddExpense';
import AddIncome from './pages/AddIncome';
import Categories from './pages/Categories';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';
import Budgets from './pages/Budgets';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <IncomeProvider>
          <ExpenseProvider>
            <CategoryProvider>
              <BudgetProvider>
                <Router>
                  <div className="min-h-screen bg-gray-50">
                    <Routes>
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                      <Route
                        path="/"
                        element={
                          <Dashboard />
                        }
                      >
                        <Route index element={<Dashboard />} />
                        <Route path="add-expense" element={<AddExpense />} />
                        <Route path="add-income" element={<AddIncome />} />
                        <Route path="categories" element={<Categories />} />
                        <Route path="analytics" element={<Analytics />} />
                        <Route path="budgets" element={<Budgets />} />
                        <Route path="profile" element={<Profile />} />
                      </Route>
                    </Routes>
                  </div>
                </Router>
              </BudgetProvider>
            </CategoryProvider>
          </ExpenseProvider>
        </IncomeProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;