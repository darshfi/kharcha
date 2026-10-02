import React, { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useStore } from '../store/useStore';
import { useTheme } from '../theme/ThemeProvider';
import DateField from '../components/DateField';
import { PaymentMode } from '../types/transaction';
import { TransactionEdit } from '../services/transactions';
import { isValidDate } from '../lib/dates';
import MotionPressable from '../components/MotionPressable';
import { feedback } from '../lib/motion';

const modes: PaymentMode[] = ['UPI', 'Cash', 'Bank transfer', 'Cheque', 'Card / wallet', 'Other'];
export default function EditTransactionScreen({ route, navigation }: NativeStackScreenProps<RootStackParamList, 'EditTransaction'>) {
  const { transactionId, transactionType } = route.params;
  const { transactions, categories, userId, updateTransaction } = useStore();
  const txn = transactions.find(t => t.id === transactionId && t.type === transactionType && t.userId === userId);
  const owner = useRef(userId).current;
  const original = useRef(txn).current;
  const { theme } = useTheme();
  const [amount, setAmount] = useState(String(txn?.amount ?? ''));
  const [description, setDescription] = useState(txn?.description ?? '');
  const [categoryId, setCategoryId] = useState<string | null>(txn?.categoryId ?? null);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(txn?.paymentMode ?? 'Other');
  const [date, setDate] = useState(txn?.date ?? '');
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  const [error, setError] = useState('');
  const save = async () => {
    if (busy.current || !txn || !original || owner !== userId) return;
    setError('');
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) { setError('Enter an amount greater than zero.'); return; }
    if (!isValidDate(date)) { setError('Choose a valid date.'); return; }
    if (txn.type === 'income' && !description.trim()) { setError('Enter the income source.'); return; }
    const patch: TransactionEdit = {};
    if (value !== original.amount) patch.amount = value;
    if (description.trim() !== original.description) patch.description = description.trim();
    if (date !== original.date) patch.date = date;
    if (paymentMode !== (original.paymentMode ?? 'Other')) patch.paymentMode = paymentMode;
    if (txn.type === 'expense' && categoryId !== original.categoryId) {
      if (categoryId !== null && !categories.some(c => c.id === categoryId)) { setError('Choose an available category.'); return; }
      patch.categoryId = categoryId;
    }
    busy.current = true; setSaving(true);
    try { await updateTransaction(txn.id, txn.type, patch); if (useStore.getState().userId === owner) { feedback.success(); navigation.goBack(); } }
    catch (e: any) { feedback.error(); setError(e?.message ?? 'Could not save changes. Please try again.'); }
    finally { busy.current = false; setSaving(false); }
  };
  if (!txn || owner !== userId) return <View style={{ flex: 1, padding: 24, backgroundColor: theme.bg }}><Text style={{ color: theme.textSecondary }}>This transaction is no longer available.</Text></View>;
  const inputStyle = [styles.input, { color: theme.textPrimary, backgroundColor: theme.surfaceRaised, borderColor: theme.border }];
  return <ScrollView contentContainerStyle={styles.content} style={{ backgroundColor: theme.bg }} keyboardShouldPersistTaps="handled">
    <Text style={{ color: theme.textSecondary }}>{txn.type === 'income' ? 'Income' : 'Expense'}</Text>
    <Text style={[styles.label, { color: theme.textSecondary }]}>Amount (₹)</Text>
    <TextInput accessibilityLabel="Amount" style={inputStyle} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" editable={!saving} />
    <Text style={[styles.label, { color: theme.textSecondary }]}>{txn.type === 'income' ? 'Source' : 'Description'}</Text>
    <TextInput accessibilityLabel={txn.type === 'income' ? 'Source' : 'Description'} style={inputStyle} value={description} onChangeText={setDescription} editable={!saving} />
    {txn.type === 'expense' && <>
      <Text style={[styles.label, { color: theme.textSecondary }]}>Category</Text>
      {!categories.some(c => c.id === categoryId) && categoryId !== null && <Text style={{ color: theme.textSecondary, marginBottom: 8 }}>The original category was removed. Choose another category or leave it unchanged.</Text>}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {[{ id: null, name: 'Uncategorized', color: theme.accent }, ...categories].map(c => <MotionPressable selectionFeedback={categoryId !== c.id} key={c.id ?? 'none'} disabled={saving} onPress={() => setCategoryId(c.id)} style={[styles.chip, { borderColor: categoryId === c.id ? c.color : theme.border, backgroundColor: categoryId === c.id ? `${c.color}22` : theme.surfaceRaised }]}><Text style={{ color: theme.textPrimary }}>{c.name}</Text></MotionPressable>)}
      </ScrollView>
    </>}
    <Text style={[styles.label, { color: theme.textSecondary }]}>{txn.type === 'income' ? 'Received via' : 'Paid via'}</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>{modes.map(mode => <MotionPressable selectionFeedback={paymentMode !== mode} key={mode} disabled={saving} onPress={() => setPaymentMode(mode)} style={[styles.chip, { borderColor: paymentMode === mode ? theme.accent : theme.border, backgroundColor: paymentMode === mode ? theme.accentSoft : theme.surfaceRaised }]}><Text style={{ color: theme.textPrimary }}>{mode}</Text></MotionPressable>)}</ScrollView>
    <Text style={[styles.label, { color: theme.textSecondary }]}>Date</Text>
    <DateField value={date} onChange={setDate} disabled={saving} />
    {txn.upiRefNumber && <Text style={{ color: theme.textSecondary, marginTop: 16 }}>Reference: {txn.upiRefNumber}</Text>}
    {!!error && <Text accessibilityRole="alert" style={{ color: theme.negative, marginTop: 16 }}>{error}</Text>}
    <MotionPressable accessibilityRole="button" disabled={saving} style={[styles.button, { backgroundColor: theme.accent }]} onPress={save}><Text style={{ color: theme.accentContrast, fontWeight: '700', fontSize: 15 }}>{saving ? 'Saving...' : 'Save changes'}</Text></MotionPressable>
  </ScrollView>;
}
const styles = StyleSheet.create({ content: { padding: 16, paddingBottom: 40 }, label: { fontSize: 14, marginTop: 20, marginBottom: 8 }, input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 16 }, chip: { paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderRadius: 99, marginRight: 8 }, button: { borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 24 } });
