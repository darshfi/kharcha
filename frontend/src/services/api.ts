import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Create axios instance with base configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add authorization token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, clear storage and redirect to login
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Types
export interface Expense {
  id: string;
  amount: number;
  category_id: string;
  description: string;
  date: string;
  created_at?: string;
  updated_at?: string;
}

export interface Income {
  id: string;
  amount: number;
  source: string;
  description: string;
  date: string;
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'expense' | 'income';
  color?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Budget {
  id: string;
  category_id: string;
  amount: number;
  period: 'monthly' | 'yearly';
  start_date: string;
  end_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateExpenseDto {
  amount: number;
  category_id: string;
  description: string;
  date: string;
}

export interface UpdateExpenseDto {
  amount?: number;
  category_id?: string;
  description?: string;
  date?: string;
}

export interface CreateIncomeDto {
  amount: number;
  source: string;
  description: string;
  date: string;
}

export interface UpdateIncomeDto {
  amount?: number;
  source?: string;
  description?: string;
  date?: string;
}

export interface CreateCategoryDto {
  name: string;
  type: 'expense' | 'income';
  color?: string;
}

export interface UpdateCategoryDto {
  name?: string;
  type?: 'expense' | 'income';
  color?: string;
}

export interface CreateBudgetDto {
  category_id: string;
  amount: number;
  period: 'monthly' | 'yearly';
  start_date: string;
  end_date?: string;
}

export interface UpdateBudgetDto {
  category_id?: string;
  amount?: number;
  period?: 'monthly' | 'yearly';
  start_date?: string;
  end_date?: string;
}

// Expense API endpoints
export const expenseApi = {
  getAll: async (params?: { start_date?: string; end_date?: string; category_id?: string }) => {
    const response = await apiClient.get<Expense[]>('/expenses', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<Expense>(`/expenses/${id}`);
    return response.data;
  },

  create: async (data: CreateExpenseDto) => {
    const response = await apiClient.post<Expense>('/expenses', data);
    return response.data;
  },

  update: async (id: string, data: UpdateExpenseDto) => {
    const response = await apiClient.put<Expense>(`/expenses/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete(`/expenses/${id}`);
    return response.data;
  },
};

// Income API endpoints
export const incomeApi = {
  getAll: async (params?: { start_date?: string; end_date?: string }) => {
    const response = await apiClient.get<Income[]>('/incomes', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<Income>(`/incomes/${id}`);
    return response.data;
  },

  create: async (data: CreateIncomeDto) => {
    const response = await apiClient.post<Income>('/incomes', data);
    return response.data;
  },

  update: async (id: string, data: UpdateIncomeDto) => {
    const response = await apiClient.put<Income>(`/incomes/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete(`/incomes/${id}`);
    return response.data;
  },
};

// Category API endpoints
export const categoryApi = {
  getAll: async (params?: { type?: 'expense' | 'income' }) => {
    const response = await apiClient.get<Category[]>('/categories', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<Category>(`/categories/${id}`);
    return response.data;
  },

  create: async (data: CreateCategoryDto) => {
    const response = await apiClient.post<Category>('/categories', data);
    return response.data;
  },

  update: async (id: string, data: UpdateCategoryDto) => {
    const response = await apiClient.put<Category>(`/categories/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete(`/categories/${id}`);
    return response.data;
  },
};

// Budget API endpoints
export const budgetApi = {
  getAll: async (params?: { category_id?: string; period?: 'monthly' | 'yearly' }) => {
    const response = await apiClient.get<Budget[]>('/budgets', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<Budget>(`/budgets/${id}`);
    return response.data;
  },

  create: async (data: CreateBudgetDto) => {
    const response = await apiClient.post<Budget>('/budgets', data);
    return response.data;
  },

  update: async (id: string, data: UpdateBudgetDto) => {
    const response = await apiClient.put<Budget>(`/budgets/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete(`/budgets/${id}`);
    return response.data;
  },
};

// Auth API endpoints (if needed)
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await apiClient.post<{ token: string; user: any }>('/auth/login', {
      email,
      password,
    });
    if (response.data.token) {
      localStorage.setItem('authToken', response.data.token);
    }
    return response.data;
  },

  register: async (email: string, password: string, name?: string) => {
    const response = await apiClient.post<{ token: string; user: any }>('/auth/register', {
      email,
      password,
      name,
    });
    if (response.data.token) {
      localStorage.setItem('authToken', response.data.token);
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('authToken');
  },

  getCurrentUser: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },
};

export default apiClient;
