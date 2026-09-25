import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { IncomeProvider } from './context/IncomeContext';
import { ExpenseProvider } from './context/ExpenseContext';
import { CategoryProvider } from './context/CategoryContext';
import { BudgetProvider } from './context/BudgetContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
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
        <CategoryProvider>
          <ExpenseProvider>
            <IncomeProvider>
              <BudgetProvider>
                <Router>
                  <div className="min-h-screen bg-gray-50">
                    <Routes>
                      {/* Public Routes */}
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />

                      {/* Protected Routes with Layout */}
                      <Route
                        path="/"
                        element={
                          <ProtectedRoute>
                            <Layout>
                              <Dashboard />
                            </Layout>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/add-expense"
                        element={
                          <ProtectedRoute>
                            <Layout>
                              <AddExpense />
                            </Layout>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/add-income"
                        element={
                          <ProtectedRoute>
                            <Layout>
                              <AddIncome />
                            </Layout>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/categories"
                        element={
                          <ProtectedRoute>
                            <Layout>
                              <Categories />
                            </Layout>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/analytics"
                        element={
                          <ProtectedRoute>
                            <Layout>
                              <Analytics />
                            </Layout>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/budgets"
                        element={
                          <ProtectedRoute>
                            <Layout>
                              <Budgets />
                            </Layout>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/profile"
                        element={
                          <ProtectedRoute>
                            <Layout>
                              <Profile />
                            </Layout>
                          </ProtectedRoute>
                        }
                      />

                      {/* Catch all - redirect to dashboard */}
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                    <ToastContainer position="top-right" autoClose={3000} />
                  </div>
                </Router>
              </BudgetProvider>
            </IncomeProvider>
          </ExpenseProvider>
        </CategoryProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
