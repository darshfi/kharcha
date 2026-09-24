import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useExpenses } from '../context/ExpenseContext';
import { useIncomes } from '../context/IncomeContext';
import { useCategories } from '../context/CategoryContext';
import { formatCurrency, formatDate, calculatePercentage } from '../utils/formatters';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { expenses, loading: expensesLoading } = useExpenses();
  const { incomes, loading: incomesLoading } = useIncomes();
  const { categories } = useCategories();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        // Get current month data
        const now = new Date();
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const currentMonthExpenses = expenses.filter(exp => {
          const expDate = new Date(exp.date);
          return expDate >= currentMonthStart && expDate <= currentMonthEnd;
        });

        const currentMonthIncomes = incomes.filter(inc => {
          const incDate = new Date(inc.date);
          return incDate >= currentMonthStart && incDate <= currentMonthEnd;
        });

        // Calculate daily average
        const daysElapsed = now.getDate();
        const totalExpenses = currentMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        const dailyAverage = daysElapsed > 0 ? totalExpenses / daysElapsed : 0;

        // Calculate last month for comparison
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

        const lastMonthExpenses = expenses.filter(exp => {
          const expDate = new Date(exp.date);
          return expDate >= lastMonthStart && expDate <= lastMonthEnd;
        });

        const lastMonthTotal = lastMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        const lastMonthDays = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
        const lastMonthDailyAverage = lastMonthDays > 0 ? lastMonthTotal / lastMonthDays : 0;

        const dailyAvgChange = lastMonthDailyAverage > 0
          ? ((dailyAverage - lastMonthDailyAverage) / lastMonthDailyAverage) * 100
          : 0;

        // Category breakdown
        const categoryExpenses: Record<string, number> = {};
        currentMonthExpenses.forEach(exp => {
          const category = categories.find(cat => cat.id === exp.categoryId);
          const catName = category ? category.name : 'Others';
          categoryExpenses[catName] = (categoryExpenses[catName] || 0) + exp.amount;
        });

        const categoryData = Object.entries(categoryExpenses)
          .map(([name, amount]) => ({ name, amount }))
          .sort((a, b) => b.amount - a.amount);

        // Weekly data (last 7 days)
        const weeklyData: { day: string; amount: number }[] = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateString = format(date, 'yyyy-MM-dd');
          const dayTotal = expenses
            .filter(exp => exp.date === dateString)
            .reduce((sum, exp) => sum + exp.amount, 0);
          weeklyData.push({
            day: format(date, 'EEE'),
            amount: dayTotal
          });
        }

        // Income by payment mode (current month)
        const incomeByMode: Record<string, number> = {};
        currentMonthIncomes.forEach(inc => {
          incomeByMode[inc.paymentMode] = (incomeByMode[inc.paymentMode] || 0) + inc.amount;
        });

        const incomeModeData = Object.entries(incomeByMode)
          .map(([mode, amount]) => ({ mode, amount }))
          .sort((a, b) => b.amount - a.amount);

        setDashboardData({
          totalExpenses,
          totalIncomes: currentMonthIncomes.reduce((sum, inc) => sum + inc.amount, 0),
          dailyAverage,
          dailyAvgChange,
          categoryData,
          weeklyData,
          incomeModeData,
          netSavings: currentMonthIncomes.reduce((sum, inc) => sum + inc.amount, 0) - totalExpenses
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, expenses, incomes, categories]);

  if (loading || !dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  const { totalExpenses, totalIncomes, dailyAverage, dailyAvgChange, categoryData, weeklyData, incomeModeData, netSavings } = dashboardData;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            Dashboard
            {user && (
              <span className="ml-2 text-sm text-gray-500">
                Welcome back, {user.email.split('@')[0]}!
              </span>
            )}
          </h1>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          {/* Daily Average */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-sm font-medium text-gray-500">Daily Average This Month</h3>
            <p className="text-2xl font-bold text-gray-800 mt-2">
              {formatCurrency(dailyAverage)}
            </p>
            <p className={`text-sm mt-1 ${dailyAvgChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {dailyAvgChange >= 0 ? '▲' : '▼'} {Math.abs(dailyAvgChange).toFixed(1)}% vs last month
            </p>
          </div>

          {/* Total Spent */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-sm font-medium text-gray-500">Total Spent This Month</h3>
            <p className="text-2xl font-bold text-gray-800 mt-2">
              {formatCurrency(totalExpenses)}
            </p>
          </div>

          {/* Total Income */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-sm font-medium text-gray-500">Total Income This Month</h3>
            <p className="text-2xl font-bold text-gray-800 mt-2">
              {formatCurrency(totalIncomes)}
            </p>
          </div>

          {/* Net Savings */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-sm font-medium text-gray-500">Net Savings</h3>
            <p className={`text-2xl font-bold mt-2 ${netSavings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(Math.abs(netSavings))}
            </p>
            <p className="text-sm mt-1">
              {netSavings >= 0 ? 'Saved' : 'Overspent'}
            </p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid gap-6 md:grid-cols-2 mb-6">
          {/* Weekly Trend Chart */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Weekly Spending Trend</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(value) => formatCurrency(value)} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend verticalAlign="top" height={36} />
                <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Category Breakdown */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Spending by Category</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={categoryData.slice(0, 5)}> {/* Top 5 categories */}
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(value) => formatCurrency(value)} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend verticalAlign="top" height={36} />
                {categoryData.slice(0, 5).map((_, index) => (
                  <Bar
                    key={`bar-${index}`}
                    dataKey="amount"
                    fill={`hsl(${(index * 40) % 360}, 70%, 50%)`}
                    radius={[4, 4, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Income by Payment Mode */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Income by Payment Mode</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={incomeModeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mode" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(value) => formatCurrency(value)} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend verticalAlign="top" height={36} />
              {incomeModeData.map((_, index) => (
                <Bar
                  key={`income-bar-${index}`}
                  dataKey="amount"
                  fill={`hsl(${(index * 50 + 100) % 360}, 70%, 50%)`}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Transactions */}
        <div className="mt-6">
          <h2 className="text-lg font-medium text-gray-800 mb-4 flex justify-between items-center">
            Recent Transactions
            <button
              onClick={() => {/* Navigate to full transactions list */}}
              className="text-sm text-blue-600 hover:underline"
            >
              View All
            </button>
          </h2>
          <div className="space-y-3">
            {/* Merge and sort recent expenses and incomes */}
            {[...expenses.map(exp => ({ ...exp, type: 'expense' as const })),
              ...incomes.map(inc => ({ ...inc, type: 'income' as const }))]
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 5)
              .map((item, index) => (
                <div
                  key={`${item.type}-${index}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 flex items-center justify-center rounded-full ${item.type === 'expense' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                      {item.type === 'expense' ? '−' : '+'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">
                        {item.type === 'expense' ?
                          (categories.find(cat => cat.id === item.categoryId)?.name || 'Unknown') :
                          item.source || 'Income'
                        }
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(item.date)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-${item.type === 'expense' ? 'red-600' : 'green-600'}`}>
                      {item.type === 'expense' ?
                        `-${formatCurrency(item.amount)}` :
                        `+${formatCurrency(item.amount)}`
                      }
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;