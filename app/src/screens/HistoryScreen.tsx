import React, { useMemo, useState } from 'react';
import { Modal, Pressable, SectionList, FlatList, ScrollView, Text, TextInput, View, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useStore } from '../store/useStore';
import { useTheme } from '../theme/ThemeProvider';
import TransactionRow from '../components/TransactionRow';
import MotionPressable from '../components/MotionPressable';
import { feedback, useMotionDisabled } from '../lib/motion';
import { allHistoryFilters, filterHistory, groupHistory, historyYears } from '../lib/history';

type Choice = { value: string; label: string };
function Picker({ label, value, choices, onChange }: { label: string; value: string; choices: Choice[]; onChange: (value: string) => void }) {
  const { theme } = useTheme();
  const reduced = useMotionDisabled();
  const [open, setOpen] = useState(false);
  return <>
    <MotionPressable style={[styles.chip, { backgroundColor: theme.surfaceRaised, borderColor: theme.border }]} accessibilityRole="button"
      accessibilityLabel={`${label}: ${choices.find(c => c.value === value)?.label}`} onPress={() => setOpen(true)}>
      <Text style={{ color: theme.textPrimary }}>{choices.find(c => c.value === value)?.label} ▾</Text>
    </MotionPressable>
    <Modal visible={open} transparent animationType={reduced ? 'none' : 'fade'} onRequestClose={() => setOpen(false)}>
      <View style={styles.overlay}><View style={[styles.panel, { backgroundColor: theme.surface }]}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>{label}</Text>
        <FlatList data={choices} keyExtractor={c => c.value} renderItem={({ item }) => <Pressable style={styles.choice}
          accessibilityRole="button" accessibilityState={{ selected: value === item.value }} onPress={() => { if (value !== item.value) feedback.selection(); onChange(item.value); setOpen(false); }}>
          <Text style={{ color: value === item.value ? theme.accent : theme.textPrimary }}>{item.label}{value === item.value ? ' ✓' : ''}</Text>
        </Pressable>} />
        <Pressable style={styles.choice} onPress={() => setOpen(false)}><Text style={{ color: theme.textSecondary }}>Cancel</Text></Pressable>
      </View></View>
    </Modal>
  </>;
}
export default function HistoryScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'History'>) {
  const { transactions, categories, deleteTransaction } = useStore();
  const { theme } = useTheme();
  const [filters, setFilters] = useState(allHistoryFilters);
  const results = useMemo(() => filterHistory(transactions, categories, filters), [transactions, categories, filters]);
  const sections = useMemo(() => groupHistory(results), [results]);
  const monthChoices = [{ value: '', label: 'All months' }, ...Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1).padStart(2, '0'), label: new Date(2000, i, 1).toLocaleDateString('en-IN', { month: 'long' }) }))];
  return <View style={{ flex: 1, backgroundColor: theme.bg }}>
    <View style={styles.controls}>
      <View style={{ flexDirection: 'row' }}>
        <Picker label="Year" value={filters.year} choices={[{ value: '', label: 'All years' }, ...[...new Set([String(new Date().getFullYear()), ...historyYears(transactions)])].sort().reverse().map(year => ({ value: year, label: year }))]} onChange={year => setFilters(f => ({ ...f, year }))} />
        <Picker label="Month" value={filters.month} choices={monthChoices} onChange={month => setFilters(f => ({ ...f, month }))} />
      </View>
      <TextInput accessibilityLabel="Search transactions" value={filters.query} onChangeText={query => setFilters(f => ({ ...f, query }))}
        placeholder="Search source, description or reference" placeholderTextColor={theme.textTertiary}
        style={[styles.search, { color: theme.textPrimary, borderColor: theme.border, backgroundColor: theme.surfaceRaised }]} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Picker label="Category" value={filters.category} choices={[{ value: '', label: 'All categories' }, { value: 'income', label: 'Income' }, { value: 'uncategorized', label: 'Uncategorized' }, ...categories.map(c => ({ value: c.id, label: c.name }))]} onChange={category => setFilters(f => ({ ...f, category }))} />
        <Picker label="Sort" value={filters.sort} choices={[{ value: 'newest', label: 'Newest first' }, { value: 'category', label: 'By category' }]} onChange={sort => setFilters(f => ({ ...f, sort: sort as 'newest' | 'category' }))} />
      </ScrollView>
      <Text style={{ color: theme.textSecondary, marginTop: 8 }}>{results.length} transaction{results.length === 1 ? '' : 's'} · Tap to edit</Text>
    </View>
    <SectionList sections={sections} keyExtractor={t => `${t.type}:${t.id}`} stickySectionHeadersEnabled
      contentContainerStyle={{ paddingBottom: 32 }} keyboardShouldPersistTaps="handled"
      renderSectionHeader={({ section }) => <Text style={[styles.section, { color: theme.textPrimary, backgroundColor: theme.bg }]}>{section.title}</Text>}
      renderItem={({ item }) => <TransactionRow transaction={item} category={categories.find(c => c.id === item.categoryId)}
        onDelete={() => deleteTransaction(item.id)}
        onPress={() => navigation.navigate('EditTransaction', { transactionId: item.id, transactionType: item.type })} />}
      ListEmptyComponent={<View style={styles.empty}><Text style={{ color: theme.textSecondary }}>{transactions.length ? 'No transactions match these filters.' : 'No transactions yet.'}</Text>
        {transactions.length > 0 && <Pressable onPress={() => setFilters(allHistoryFilters)}><Text style={{ color: theme.accent, marginTop: 16 }}>Clear filters</Text></Pressable>}</View>} />
  </View>;
}
const styles = StyleSheet.create({ controls: { padding: 16, paddingBottom: 8 }, chip: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 99, borderWidth: 1, marginRight: 8 }, search: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 14, marginVertical: 12 }, section: { paddingHorizontal: 16, paddingVertical: 12, fontSize: 18, fontWeight: '700' }, empty: { padding: 32, alignItems: 'center' }, overlay: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#0008' }, panel: { maxHeight: '75%', borderRadius: 14, padding: 20 }, title: { fontSize: 20, fontWeight: '700', marginBottom: 12 }, choice: { paddingVertical: 14 } });
