import React, { useState } from 'react';
import { useBudgets } from '../context/BudgetContext';
import { useCategories } from '../context/CategoryContext';
import { formatCurrency } from '../utils/formatters';

const Budgets: React.FC = () => {
  const { budgets, loading, fetchBudgets, addBudget, updateBudget, deleteBudget, getBudgetAlerts } = useBudgets();
  const { categories } = useCategories();
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<any>(null);
  const [formData, setFormData] = useState({
    categoryId: '',
    monthlyLimit: ''
  });
  const [alerts, setAlerts] = useState<Array<any>>([]);
  const [alertsLoading, setAlertsLoading] = useState(false);

  const openModal = (budget?: any) => {
    if (budget) {
      setEditMode(true);
      setSelectedBudget(budget);
      setFormData({
        categoryId: budget.categoryId,
        monthlyLimit: budget.monthlyLimit.toString()
      });
    } else {
      setEditMode(false);
      setSelectedBudget(null);
      setFormData({
        categoryId: '',
        monthlyLimit: ''
      });
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setFormData({
      categoryId: '',
      monthlyLimit: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editMode && selectedBudget) {
        await updateBudget(selectedBudget.id, {
          categoryId: formData.categoryId,
          monthlyLimit: parseFloat(formData.monthlyLimit)
        });
      } else {
        await addBudget({
          categoryId: formData.categoryId,
          monthlyLimit: parseFloat(formData.monthlyLimit)
        });
      }
      closeModal();
      await fetchBudgets();
    } catch (error) {
      console.error('Error saving budget:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this budget?')) {
      try {
        await deleteBudget(id);
        await fetchBudgets();
      } catch (error) {
        console.error('Error deleting budget:', error);
      }
    }
  };

  const loadAlerts = async () => {
    setAlertsLoading(true);
    try {
      const alertsData = await getBudgetAlerts();
      setAlerts(alertsData);
    } catch (error) {
      console.error('Error loading budget alerts:', error);
    } finally {
      setAlertsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchBudgets();
    loadAlerts();
  }, [fetchBudgets, loadAlerts]);

  if (loading) {
    return <div className="text-center py-12">Loading budgets...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Budget Alerts Section */}
      {alerts.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Budget Alerts</h3>
          <p className="text-red-700">
            You have {alerts.length} budget(s) that have exceeded 80% of their limit:
          </p>
          <ul className="mt-2 space-y-1 text-sm">
            {alerts.map(alert => (
              <li key={alert.id} className="flex justify-between">
                <span>{alert.categoryName}: {formatCurrency(alert.currentSpend)} / {formatCurrency(alert.monthlyLimit)}</span>
                <span className="text-red-600 font-medium">{alert.percentage}%</span>
              </li>
            ))}
          </ul>
          <button
            onClick={loadAlerts}
            className="mt-3 inline-block text-red-600 hover:text-red-800"
          >
            Refresh Alerts
          </button>
        </div>
      )}

      {/* Budget Form Modal */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center ${modalOpen ? 'block' : 'hidden'}`}
        aria-hidden={!modalOpen ? 'true' : 'false'}
        role="dialog"
        aria-modal="true"
      >
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={closeModal} />
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
          <div className="flex justify-between items-start">
            <h2 className="text-xl font-bold">{editMode ? 'Edit Budget' : 'Add New Budget'}</h2>
            <button
              onClick={closeModal}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Limit</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.monthlyLimit}
                onChange={(e) => setFormData({...formData, monthlyLimit: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter amount"
                required
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {editMode ? 'Update Budget' : 'Add Budget'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Budgets List */}
      <div>
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Budget Management</h2>
          <button
            onClick={() => openModal()}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Add Budget
          </button>
        </div>

        {budgets.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No budgets created yet. Click "Add Budget" to get started.
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {budgets.map(budget => (
              <div
                key={budget.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-800">{budget.categoryName}</h3>
                    <p className="text-sm text-gray-500">Monthly limit</p>
                  </div>
                  <div className="text-right space-x-2">
                    <span className="block text-lg font-bold">{formatCurrency(budget.monthlyLimit)}</span>
                    <span className="text-sm text-gray-500">/{formatCurrency(budget.currentSpend)}</span>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className={`bg-blue-600 h-2.5 rounded-full`}
                      style={{ width: Math.min((budget.currentSpend / budget.monthlyLimit) * 100, 100) + '%' }}
                    ></div>
                  </div>
                  <p className="mt-1 text-xs text-gray-600 text-right">
                    {Math.min((budget.currentSpend / budget.monthlyLimit) * 100, 100).toFixed(1)}% used
                  </p>
                </div>

                <div className="mt-4 flex justify-end space-x-2">
                  <button
                    onClick={() => openModal(budget)}
                    className="px-3 py-1 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(budget.id)}
                    className="px-3 py-1 bg-red-500 text-white text-sm rounded-md hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Budgets;