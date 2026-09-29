import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { useStore } from '../store/useStore';
import { parseUPISMS } from '../lib/parseUPISMS';
import { parsedSMSToTransaction } from '../lib/mappers';
import { PaymentMode } from '../types/transaction';

const MODES: { label: string; emoji: string }[] = [
  { label: 'UPI', emoji: '📲' },
  { label: 'Cash', emoji: '💵' },
  { label: 'Bank transfer', emoji: '🏦' },
  { label: 'Cheque', emoji: '🧾' },
  { label: 'Card / wallet', emoji: '💳' },
  { label: 'Other', emoji: '🔘' },
];

export default function AddTransactionSheet() {
  const { theme } = useTheme();
  const { categories, addTransaction } = useStore();
  const [visible, setVisible] = useState(false);
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('UPI');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [smsText, setSmsText] = useState('');

  const openSheet = () => setVisible(true);
  const closeSheet = () => {
    setVisible(false);
    setAmount('');
    setDescription('');
    setSmsText('');
  };

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
      'local-user'
    );
    txn.type = type;
    txn.categoryId = type === 'expense' ? categoryId : null;
    txn.paymentMode = type === 'expense' ? paymentMode : null;
    txn.description = description;

    addTransaction(txn);
    closeSheet();
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
      <View style={styles.center}>
        <Text style={[styles.heading, { color: theme.textPrimary }]}>Add</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Tap the button to add a transaction
        </Text>
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: theme.accent }]}
          onPress={openSheet}
        >
          <Text style={[styles.fabText, { color: theme.accentContrast }]}>➕</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.sheet, { backgroundColor: theme.surface }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.sheetTitle, { color: theme.textPrimary }]}>
                Add {type}
              </Text>

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
                      fontSize: 13,
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
                      fontSize: 13,
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
                          {c.emoji} {c.name}
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
                          {m.emoji} {m.label}
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

              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.primaryBtn, { backgroundColor: theme.accent }]}
                  onPress={handleSave}
                >
                  <Text style={{ color: theme.accentContrast, fontWeight: '700', fontSize: 15 }}>
                    Save {type}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.secondaryBtn, { borderColor: theme.border }]}
                  onPress={closeSheet}
                >
                  <Text style={{ color: theme.textPrimary, fontWeight: '600' }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  heading: { fontSize: 26, fontWeight: '700' },
  subtitle: { fontSize: 14 },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  fabText: { fontSize: 24 },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
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
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  fieldLabel: {
    fontSize: 13,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
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
  actions: {
    marginTop: 20,
    gap: 10,
    marginBottom: 20,
  },
  primaryBtn: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryBtn: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
});
