import { render, screen, waitFor } from '@testing-library/react';
import { BudgetProvider, useBudgets } from './BudgetContext';
import { vi } from 'vitest';

// Mock supabase
const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: null, error: null }),
};

// Mock useAuth hook
vi.mock('../services/supabase', () => ({
  supabase: mockSupabase,
}));

// Mock useAuth hook
const useAuthMock = { user: { id: 'test-user-id' } };
vi.mock('../context/AuthContext', () => ({
  useAuth: () => useAuthMock,
}));

const createWrapper = () => {
  return ({ children }: { children: React.ReactNode }) => (
    <BudgetProvider>{children}</BudgetProvider>
  );
};

describe('BudgetContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should provide budget state and functions', async () => {
    // Mock data
    const mockBudgetData = [
      {
        id: '1',
        categoryId: 'cat1',
        monthlyLimit: 500,
        currentSpend: 200,
        categoryName: 'Food',
        createdAt: '2026-09-25T00:00:00Z',
        updatedAt: '2026-09-25T00:00:00Z',
      },
    ];

    // Setup mocks
    mockSupabase.from.mockReturnThis();
    mockSupabase.select.mockResolvedValue({ data: mockBudgetData, error: null });
    mockSupabase.insert.mockResolvedValue({ data: mockBudgetData[0], error: null });
    mockSupabase.update.mockResolvedValue({ data: mockBudgetData[0], error: null });
    mockSupabase.delete.mockResolvedValue({ error: null });

    // Render component with provider
    render(
      <BudgetProvider>
        <TestComponent />
      </BudgetProvider>,
      { wrapper: createWrapper() }
    );

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Food')).toBeInTheDocument();
    });
  });
});

// Helper component to consume context
function TestComponent() {
  const { budgets, loading, fetchBudgets } = useBudgets();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {budgets.map(budget => (
        <div key={budget.id}>
          <span>{budget.categoryName}</span>
          <span>{budget.monthlyLimit}</span>
        </div>
      ))}
      <button onClick={fetchBudgets}>Refresh</button>
    </div>
  );
}