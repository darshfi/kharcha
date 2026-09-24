import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useExpenses } from '../context/ExpenseContext';
import { useIncomes } from '../context/IncomeContext';
import { useCategories } from '../context/CategoryContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format } from 'date-fns';

const Analytics: React.FC = () => {
  const { user } = useAuth();
  const { expenses } = useExpenses();
  const { incomes } = useIncomes();
  const { categories } = useCategories();
  const [selectedPeriod, setSelectedPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const now = new Date();
        let startDate: Date;

        switch (selectedPeriod) {
          case 'weekly':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
            break;
          case 'monthly':
            startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1); // Last 12 months
            break;
          case 'yearly':
            startDate = new Date(now.getFullYear() - 1, 0, 1); // Last 2 years
            break;
          default:
            startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
        }

        const filteredExpenses = expenses.filter(exp => {
          const expDate = new Date(exp.date);
          return expDate >= startDate && expDate <= now;
        });

        const filteredIncomes = incomes.filter(inc => {
          const incDate = new Date(inc.date);
          return incDate >= startDate && incDate <= now;
        });

        // Monthly trend data (last 12 months)
        const monthlyData: Array<{ month: string; income: number; expense: number }> = [];
        for (let i = 11; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthKey = format(date, 'yyyy-MM');
          const monthLabel = format(date, 'MMM yyyy');

          const monthExpenses = filteredExpenses
            .filter(exp => {
              const expDate = new Date(exp.date);
              return expDate.getFullYear() === date.getFullYear() &&
                     expDate.getMonth() === date.getMonth();
            })
            .reduce((sum, exp) => sum + exp.amount, 0);

          const monthIncomes = filteredIncomes
            .filter(inc => {
              const incDate = new Date(inc.date);
              return incDate.getFullYear() === date.getFullYear() &&
                     incDate.getMonth() === date.getMonth();
            })
            .reduce((sum, inc) => sum + inc.amount, 0);

          monthlyData.push({
            month: monthLabel,
            income: monthIncomes,
            expense: monthExpenses
          });
        }

        // Category breakdown for current month
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const currentMonthExpenses = filteredExpenses.filter(exp => {
          const expDate = new Date(exp.date);
          return expDate >= currentMonthStart && expDate <= currentMonthEnd;
        });

        const categoryBreakdown: Array<{ name: string; amount: number; icon: string; color: string }> = [];
        categories.forEach(category => {
          const categoryTotal = currentMonthExpenses
            .filter(exp => exp.categoryId === category.id)
            .reduce((sum, exp) => sum + exp.amount, 0);

          if (categoryTotal > 0) {
            categoryBreakdown.push({
              name: category.name,
              amount: categoryTotal,
              icon: category.icon,
              color: category.color
            });
          }
        });

        // Spending by time of day
        const hourlyData: Array<{ hour: string; amount: number }> = [];
        for (let hour = 0; hour < 24; hour++) {
          const hourExpenses = filteredExpenses
            .filter(exp => {
              if (!exp.time) return false;
              const [expHour] = exp.time.split(':').map(Number);
              return expHour === hour;
            })
            .reduce((sum, exp) => sum + exp.amount, 0);

          hourlyData.push({
            hour: `${hour.toString().padStart(2, '0')}:00`,
            amount: hourExpenses
          });
        }

        // Top merchants
        const merchantBreakdown: Array<{ merchant: string; amount: number; count: number }> = [];
        const merchantMap: Record<string, { amount: number; count: number }> = {};

        filteredExpenses.forEach(exp => {
          if (exp.merchantName) {
            if (!merchantMap[exp.merchantName]) {
              merchantMap[exp.merchantName] = { amount: 0, count: 0 };
            }
            merchantMap[exp.merchantName].amount += exp.amount;
            merchantMap[exp.merchantName].count += 1;
          }
        });

        Object.entries(merchantMap).forEach(([merchant, data]) => {
          merchantBreakdown.push({
            merchant,
            amount: data.amount,
            count: data.count
          });
        });

        merchantBreakdown.sort((a, b) => b.amount - a.amount);

        setAnalyticsData({
          monthlyData,
          categoryBreakdown,
          hourlyData,
          merchantBreakdown: merchantBreakdown.slice(0, 10), // Top 10
          totalIncome: filteredIncomes.reduce((sum, inc) => sum + inc.amount, 0),
          totalExpense: filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0)
        });
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [user, expenses, incomes, categories, selectedPeriod]);

  if (loading || !analyticsData) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  const { monthlyData, categoryBreakdown, hourlyData, merchantBreakdown, totalIncome, totalExpense } = analyticsData;
  const netSavings = totalIncome - totalExpense;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            Analytics
            <button
              onClick={() => navigate('/')}
              className="ml-auto text-gray-500 hover:text-gray-700"
            >
              ← Back to Dashboard
            </button>
          </h1>
        </div>

        {/* Period Selector */}
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">View Data For:</span>
              <div className="flex space-x-3">
                <button
                  onClick={() => setSelectedPeriod('weekly')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${selectedPeriod === 'weekly' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  Weekly
                </button>
                <button
                  onClick={() => setSelectedPeriod('monthly')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${selectedPeriod === 'monthly' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setSelectedPeriod('yearly')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${selectedPeriod === 'yearly' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  Yearly
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-sm font-medium text-gray-500">Total Income</h3>
            <p className="text-2xl font-bold text-green-600 mt-2">
              {formatCurrency(totalIncome)}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-sm font-medium text-gray-500">Total Expense</h3>
            <p className="text-2xl font-bold text-red-600 mt-2">
              {formatCurrency(totalExpense)}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-sm font-medium text-gray-500">Net Savings</h3>
            <p className={`text-2xl font-bold mt-2 ${netSavings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(Math.abs(netSavings))}
            </p>
            <p className="text-sm mt-1">
              {netSavings >= 0 ? 'Saved' : 'Overspent'}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-sm font-medium text-gray-500">Savings Rate</h3>
            <p className="text-2xl font-bold mt-2">
              {(totalIncome > 0 ? (netSavings / totalIncome * 100) : 0).toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Monthly Trend Chart */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Income vs Expense Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(value) => formatCurrency(value)} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend verticalAlign="top" height={36} />
                <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Category Breakdown Pie Chart */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Expense Distribution by Category</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryBreakdown}
                  dataKey="amount"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  labelLine={false}
                  label={({ name, value, percent }) => (
                    <text
                      x={0}
                      y={0}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={12>
                      >
                        {name}: {formatCurrency(value)}
                    </text>
                  )}
                >
                  {categoryBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hourly Spending Pattern */}
        <div className="bg-white rounded-lg shadow-md p-4 mt-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Spending by Time of Day</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
              <YAxis tickFormatter={(value) => formatCurrency(value)} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend verticalAlign="top" height={36} />
              {hourlyData.map((entry, index) => (
                <Bar
                  key={`hour-${index}`}
                  dataKey="amount"
                  fill={`hsl(${(index * 15) % 360}, 70%, 50%)`}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Merchants */}
        <div className="bg-white rounded-lg shadow-md p-4 mt-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Top Merchants</h3>
          {merchantBreakdown.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No merchant data available
            </p>
          ) : (
            <div className="space-y-3">
              {merchantBreakdown.map((merchant, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{merchant.merchant}</p>
                      <p className="text-sm text-gray-500">
                        {merchant.count} transaction{merchant.count !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-800">
                      {formatCurrency(merchant.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;