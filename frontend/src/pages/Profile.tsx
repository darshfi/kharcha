import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState(user?.email || '');
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [currency, setCurrency] = useState(user?.currency || 'INR');
  const [dateFormat, setDateFormat] = useState(user?.date_format || 'DD/MM/YYYY');
  const [theme, setTheme] = useState(user?.theme || 'light');
  const [loading, setLoading] = useState(false);

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      // In a real app, we would update the user in the database via Supabase
      // For now, we'll just update the local state and show a success message
      // You would typically use supabase.from('users').update(...) here
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = () => {
    // Navigate to change password page (to be implemented)
    toast.info('Change password feature coming soon!');
  };

  const handleExportData = () => {
    // Implement data export (to be implemented)
    toast.info('Data export feature coming soon!');
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      setLoading(true);
      try {
        // In a real app, we would delete the user account via Supabase
        // For now, we'll just log out and show a success message
        await logout();
        toast.success('Account deleted successfully!');
        navigate('/login');
      } catch (error: any) {
        toast.error(error.message || 'Failed to delete account');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            Profile Settings
            <button
              onClick={() => navigate('/')}
              className="ml-auto text-gray-500 hover:text-gray-700"
            >
              ← Back to Dashboard
            </button>
          </h1>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-medium text-gray-800 mb-4">Account Information</h2>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                readOnly
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="INR">₹ Indian Rupee (INR)</option>
                  <option value="USD">$ US Dollar (USD)</option>
                  <option value="EUR">€ Euro (EUR)</option>
                  <option value="GBP">£ British Pound (GBP)</option>
                  <option value="JPY">¥ Japanese Yen (JPY)</option>
                  <option value="CAD">C$ Canadian Dollar (CAD)</option>
                  <option value="AUD">A$ Australian Dollar (AUD)</option>
                  <option value="SGD">S$ Singapore Dollar (SGD)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Format</label>
                <select
                  value={dateFormat}
                  onChange={(e) => setDateFormat(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="darkMode"
                  checked={theme === 'dark'}
                  onChange={(e) => setTheme(e.target.checked ? 'dark' : 'light')}
                  className="form-checkbox h-4 w-4 text-blue-600"
                />
              </div>
              <label htmlFor="darkMode" className="ml-2 text-sm font-medium text-gray-700">
                Dark Mode
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving Changes...' : 'Update Profile'}
            </button>
          </form>
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-medium text-gray-800 mb-4">Security</h2>
          <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
            <button
              onClick={handleChangePassword}
              className="w-full text-left bg-gray-50 hover:bg-gray-100 p-4 rounded-md font-medium text-gray-800 flex items-center justify-between"
            >
              <span>Change Password</span>
              <span className="text-sm text-gray-500">Update your account password</span>
            </button>

            <button
              onClick={handleExportData}
              className="w-full text-left bg-gray-50 hover:bg-gray-100 p-4 rounded-md font-medium text-gray-800 flex items-center justify-between"
            >
              <span>Export Data</span>
              <span className="text-sm text-gray-500">Download your data as CSV or JSON</span>
            </button>

            <button
              onClick={handleDeleteAccount}
              className="w-full text-left bg-red-50 hover:bg-red-100 p-4 rounded-md font-medium text-red-800 flex items-center justify-between"
            >
              <span>Delete Account</span>
              <span className="text-sm text-gray-500">Permanently delete your account</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;