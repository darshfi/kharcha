import React, { useState } from 'react';
import { useExpenses } from '../context/ExpenseContext';
import { useCategories } from '../context/CategoryContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const AddExpense: React.FC = () => {
  const { user } = useAuth();
  const { addExpense } = useExpenses();
  const { categories } = useCategories();
  const navigate = useNavigate();

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [time, setTime] = useState('');
  const [transactionType, setTransactionType] = useState<'manual' | 'upi'>('manual');
  const [upiRefNumber, setUpiRefNumber] = useState('');
  const [merchantName, setMerchantName] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [balanceAfter, setBalanceAfter] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      await addExpense({
        amount: parseFloat(amount),
        description,
        categoryId,
        date,
        time: time || undefined,
        transactionType,
        upiRefNumber: upiRefNumber || undefined,
        merchantName: merchantName || undefined,
        receiptUrl: receiptUrl || undefined,
        balanceAfter: balanceAfter ? parseFloat(balanceAfter) : undefined,
        isRecurring,
        recurringFrequency: isRecurring ? recurringFrequency : undefined
      });

      toast.success('Expense added successfully!');
      // Reset form
      setAmount('');
      setDescription('');
      setCategoryId('');
      setDate(format(new Date(), 'yyyy-MM-dd'));
      setTime('');
      setTransactionType('manual');
      setUpiRefNumber('');
      setMerchantName('');
      setReceiptUrl('');
      setBalanceAfter('');
      setIsRecurring(false);
      setRecurringFrequency('');

      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Failed to add expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            Add Expense
            <button
              onClick={() => navigate('/')}
              className="ml-auto text-gray-500 hover:text-gray-700"
            >
              ← Back to Dashboard
            </button>
          </h1>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time (optional)</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type</label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="manual"
                    checked={transactionType === 'manual'}
                    onChange={(e) => setTransactionType(e.target.value as 'manual' | 'upi')}
                    className="form-radio h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2">Manual Entry</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="upi"
                    checked={transactionType === 'upi'}
                    onChange={(e) => setTransactionType(e.target.value as 'manual' | 'upi')}
                    className="form-radio h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2">UPI Transaction</span>
                </label>
              </div>
            </div>

            {transactionType === 'upi' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">UPI Reference Number</label>
                    <input
                      type="text"
                      value={upiRefNumber}
                      onChange={(e) => setUpiRefNumber(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Merchant Name</label>
                    <input
                      type="text"
                      value={merchantName}
                      onChange={(e) => setMerchantName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Balance After Transaction (optional)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={balanceAfter}
                    onChange={(e) => setBalanceAfter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </>
            )}

            <div className="mt-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isRecurring"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="form-checkbox h-4 w-4 text-blue-600"
                />
                <label htmlFor="isRecurring" className="ml-2 text-sm font-medium text-gray-700">
                  This is a recurring expense
                </label>
              </div>

              {isRecurring && (
                <div className="mt-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Recurring Frequency</label>
                  <select
                    value={recurringFrequency}
                    onChange={(e) => setRecurringFrequency(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select frequency</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Adding Expense...' : 'Add Expense'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddExpense;