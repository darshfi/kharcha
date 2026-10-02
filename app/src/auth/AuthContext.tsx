import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { loadTransactions } from '../services/transactions';
import { loadCategories } from '../services/categories';
import { useStore } from '../store/useStore';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  dataLoading: boolean;
  dataError: string | null;
  retryLoad: () => void;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const user = session?.user ?? null;

  useEffect(() => {
    let active = true;
    let receivedEvent = false;
    const applySession = (next: Session | null) => {
      if (!active) return;
      if (useStore.getState().userId !== (next?.user.id ?? null)) {
        setDataLoading(Boolean(next?.user));
        setDataError(null);
      }
      useStore.getState().setUserId(next?.user.id ?? null);
      setSession(next);
      setLoading(false);
    };
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, next) => {
      receivedEvent = true;
      applySession(next);
    });
    supabase.auth.getSession().then(({ data, error }) => {
      if (receivedEvent || !active) return;
      if (error) console.error('Could not restore session:', error.message);
      applySession(data.session);
    }).catch(() => { if (!receivedEvent) applySession(null); });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  const userId = user?.id;
  useEffect(() => {
    let active = true;
    setDataError(null);
    if (!userId) { setDataLoading(false); return; }
    setDataLoading(true);
    Promise.all([loadTransactions(userId), loadCategories(userId)]).then(([transactions, categories]) => {
      if (!active || useStore.getState().userId !== userId) return;
      useStore.getState().setTransactions(transactions);
      useStore.getState().setCategories(categories);
    }).catch(() => {
      if (active && useStore.getState().userId === userId) setDataError('Could not load your data. Check your connection and try again.');
    }).finally(() => { if (active && useStore.getState().userId === userId) setDataLoading(false); });
    return () => { active = false; };
  }, [userId, reload]);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error?.message || null };
  };
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message || null };
  };
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };
  return (
    <AuthContext.Provider value={{ user, session, loading, dataLoading, dataError,
      retryLoad: () => setReload(value => value + 1), signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
