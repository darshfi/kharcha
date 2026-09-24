import React, { useState } from 'react';
import { useCategories } from '../context/CategoryContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const Categories: React.FC = () => {
  const { user } = useAuth();
  const { categories, loading: categoriesLoading, addCategory, deleteCategory, archiveCategory } = useCategories();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🏷️');
  const [color, setColor] = useState('#0F766E');
  const [isCustom, setIsCustom] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      await addCategory({
        name,
        icon,
        color,
        isCustom
      });

      toast.success('Category added successfully!');
      // Reset form
      setName('');
      setIcon('🏷️');
      setColor('#0F766E');
      setIsCustom(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to add category');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await deleteCategory(id);
        toast.success('Category deleted successfully!');
      } catch (error: any) {
        toast.error(error.message || 'Failed to delete category');
      }
    }
  };

  const handleArchive = async (id: string) => {
    if (window.confirm('Are you sure you want to archive this category?')) {
      try {
        await archiveCategory(id);
        toast.success('Category archived successfully!');
      } catch (error: any) {
        toast.error(error.message || 'Failed to archive category');
      }
    }
  };

  if (categoriesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            Manage Categories
            <button
              onClick={() => navigate('/')}
              className="ml-auto text-gray-500 hover:text-gray-700"
            >
              ← Back to Dashboard
            </button>
          </h1>
        </div>

        {/* Add Category Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-800 mb-4">Add New Category</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength="30"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center space-x-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Icon (Emoji)</label>
                  <input
                    type="text"
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    maxLength="4"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center">
                  <span className="text-2xl">{icon}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full px-4 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <input
                    type="checkbox"
                    checked={isCustom}
                    onChange={(e) => setIsCustom(e.target.checked)}
                    className="form-checkbox h-4 w-4 text-blue-600"
                  />
                  Custom Category
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Adding Category...' : 'Add Category'}
            </button>
          </form>
        </div>

        {/* Categories List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-medium text-gray-800 mb-4">
            Your Categories
            {categories.length > 0 && (
              <span className="text-sm text-gray-500 ml-2">
                ({categories.length} categories)
              </span>
            )}
          </h2>

          {categories.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No categories yet. Add your first category above!
            </p>
          ) : (
            <div className="space-y-3">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 flex items-center justify-center rounded-lg` style={{ backgroundColor: category.color + '33' }}>
                      <span className="text-xl">{category.icon}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{category.name}</p>
                      {category.isCustom && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                          Custom
                        </span>
                      )}
                      {category.isArchived && (
                        <span className="ml-2 text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded">
                          Archived
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!category.isArchived && (
                      <button
                        onClick={() => handleArchive(category.id)}
                        className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded hover:bg-yellow-200"
                        disabled={loading}
                      >
                        Archive
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded hover:bg-red-200"
                      disabled={loading}
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
    </div>
  );
};

export default Categories;