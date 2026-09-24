export interface User {
  id: string;
  email: string;
  full_name?: string;
  currency?: string;
  date_format?: string;
  theme?: 'light' | 'dark';
  created_at?: string;
  updated_at?: string;
  last_login?: string;
}

export interface AuthFormData {
  email: string;
  password: string;
  fullName?: string;
}

export interface AuthResponse {
  user: User;
  session: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
  };
}