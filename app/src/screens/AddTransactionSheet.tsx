import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { useStore } from '../store/useStore';
import { useAuth } from '../auth/AuthContext';
import { parseUPISMS } from '../lib/parseUPISMS';
import { parsedSMSToTransaction } from '../lib/mappers';
import { PaymentMode } from '../types/transaction';

const MODES: { label: string; symbol: string }[] = [
  { label: 'UPI', symbol: 'U' },
  { label: 'Cash', symbol: 'C' },
  { label: 'Bank transfer', symbol: 'B' },
  { label: 'Cheque', symbol: 'Q' },
  { label: 'Card / wallet', symbol: 'D' },
  { label: 'Other', symbol: 'O' },
];

export default function AddTransactionSheet() {
  const { theme } = useTheme();
  const { categories, addTransaction } = useStore();
  const { user } = useAuth();
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('UPI');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [smsText, setSmsText] = useState('');

  const handleSave = () => {
    const amt = parseFloat(amount);
    if (!(amt > 0)) return;

    const txn = parsedSMSToTransaction(
      {
        amount: amt,
        merchant: description,
        date,
        referenceNumber: 'NOT_FOUND',
        transactionType: 'manual',
        isCredit: type === 'income',
      },
      user?.id || 'local-user'
    );
    txn.type = type;
    txn.categoryId = type === 'expense' ? categoryId : null;
    txn.paymentMode = type === 'expense' ? paymentMode : null;
    txn.description = description;

    addTransaction(txn);
    setAmount('');
    setDescription('');
    setSmsText('');
  };

  const handleParseSMS = () => {
    const parsed = parseUPISMS(smsText);
    if (parsed.amount > 0) {
      setAmount(String(parsed.amount));
      setDescription(parsed.merchant);
      setDate(parsed.date);
      setType(parsed.isCredit ? 'income' : 'expense');
    }
    setSmsText('');
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[styles.heading, { color: theme.textPrimary }]}>Add transaction</Text>

        <View style={[styles.segment, { backgroundColor: theme.surfaceRaised, borderColor: theme.border }]}>
          <TouchableOpacity
            style={[
              styles.segmentItem,
              type === 'expense' && { backgroundColor: theme.accent },
            ]}
            onPress={() => setType('expense')}
          >
            <Text
              style={{
                color: type === 'expense' ? theme.accentContrast : theme.textSecondary,
                fontWeight: '600',
                fontSize: 14,
              }}
            >
              Expense
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.segmentItem,
              type === 'income' && { backgroundColor: theme.accent },
            ]}
            onPress={() => setType('income')}
          >
            <Text
              style={{
                color: type === 'income' ? theme.accentContrast : theme.textSecondary,
                fontWeight: '600',
                fontSize: 14,
              }}
            >
              Income
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Amount (₹)</Text>
        <TextInput
          style={[styles.input, { color: theme.textPrimary, backgroundColor: theme.surfaceRaised, borderColor: theme.border }]}
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor={theme.textTertiary}
        />

        {type === 'expense' && (
          <>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {categories.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[
                    styles.chip,
                    { borderColor: categoryId === c.id ? c.color : theme.border, backgroundColor: categoryId === c.id ? `${c.color}22` : theme.surfaceRaised },
                  ]}
                  onPress={() => setCategoryId(c.id)}
                >
                  <Text style={{ color: theme.textPrimary, fontSize: 13 }}>
                    {c.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Paid via</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {MODES.map((m) => (
                <TouchableOpacity
                  key={m.label}
                  style={[
                    styles.chip,
                    { borderColor: paymentMode === m.label ? theme.accent : theme.border, backgroundColor: paymentMode === m.label ? theme.accentSoft : theme.surfaceRaised },
                  ]}
                  onPress={() => setPaymentMode(m.label as PaymentMode)}
                >
                  <Text style={{ color: theme.textPrimary, fontSize: 13 }}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
          {type === 'expense' ? 'Description' : 'Source'}
        </Text>
        <TextInput
          style={[styles.input, { color: theme.textPrimary, backgroundColor: theme.surfaceRaised, borderColor: theme.border }]}
          value={description}
          onChangeText={setDescription}
          placeholder={type === 'expense' ? 'e.g. Chai and samosa' : 'e.g. Salary'}
          placeholderTextColor={theme.textTertiary}
          maxLength={80}
        />

        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Date</Text>
        <TextInput
          style={[styles.input, { color: theme.textPrimary, backgroundColor: theme.surfaceRaised, borderColor: theme.border }]}
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={theme.textTertiary}
        />

        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Or paste UPI SMS</Text>
        <TextInput
          style={[styles.input, styles.smsInput, { color: theme.textPrimary, backgroundColor: theme.surfaceRaised, borderColor: theme.border }]}
          value={smsText}
          onChangeText={setSmsText}
          placeholder="Paste bank SMS text..."
          placeholderTextColor={theme.textTertiary}
          multiline
          numberOfLines={3}
        />
        {smsText.length > 0 && (
          <TouchableOpacity
            style={[styles.secondaryBtn, { borderColor: theme.border }]}
            onPress={handleParseSMS}
          >
            <Text style={{ color: theme.textPrimary, fontWeight: '600' }}>Parse SMS</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: theme.accent }]}
          onPress={handleSave}
        >
          <Text style={{ color: theme.accentContrast, fontWeight: '700', fontSize: 15 }}>
            Save {type}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 100 },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  segment: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    padding: 3,
    marginBottom: 16,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  fieldLabel: {
    fontSize: 14,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  smsInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  chipRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 99,
    borderWidth: 1,
    marginRight: 8,
  },
  primaryBtn: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  secondaryBtn: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    marginTop: 10,
  },
});
