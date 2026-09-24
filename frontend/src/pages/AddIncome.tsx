import React, { useState } from 'react';
import { useIncomes } from '../context/IncomeContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { MODES } from '../../expense-tracker-2.html'; // We'll create this constant properly

const AddIncome: React.FC = () => {
  const { user } = useAuth();
  const { addIncome } = useIncomes();
  const navigate = useNavigate();

  const [amount, setAmount] = useState('');
  const [source, setSource] = useState('');
  const [paymentMode, setPaymentMode] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [referenceNumber, setReferenceNumber] = useState('');
  const [loading, setLoading] = useState(false);

  // Payment modes constant (same as in the HTML prototype)
  const paymentModes = [
    ['UPI', '📲'],
    ['Cash', '💵'],
    ['Bank transfer', '🏦'],
    ['Cheque', '🧾'],
    ['Card / wallet', '💳'],
    ['Other', '🔘']
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      await addIncome({
        amount: parseFloat(amount),
        source,
        paymentMode,
        date,
        referenceNumber: referenceNumber || undefined
      });

      toast.success('Income added successfully!');
      // Reset form
      setAmount('');
      setSource('');
      setPaymentMode('');
      setDate(format(new Date(), 'yyyy-MM-dd'));
      setReferenceNumber('');

      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Failed to add income');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            Add Income
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Received Via</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select payment mode</option>
                  {paymentModes.map(mode => (
                    <option key={mode[0]} value={mode[0]}>
                      {mode[1]} {mode[0]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
              <input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="e.g. Salary, Freelance, Cash gift"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Reference Number (optional)</label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-md font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Adding Income...' : 'Add Income'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddIncome;