import React, { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../theme/ThemeProvider';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { isValidDate, localDate } from '../lib/dates';

export default function DateField({ value, onChange, disabled = false }: { value: string; onChange: (date: string) => void; disabled?: boolean }) {
  const { theme, isDark } = useTheme();
  const reducedMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(new Date());
  const date = isValidDate(value) ? new Date(Number(value.slice(0, 4)), Number(value.slice(5, 7)) - 1, Number(value.slice(8, 10))) : new Date();
  const picker = <DateTimePicker value={Platform.OS === 'ios' ? draft : date} mode="date"
    display={Platform.OS === 'ios' ? 'inline' : 'calendar'} themeVariant={isDark ? 'dark' : 'light'}
    onChange={(event, selected) => {
      if (Platform.OS !== 'ios') { setOpen(false); if (event.type === 'set' && selected) onChange(localDate(selected)); }
      else if (selected) setDraft(selected);
    }} />;
  return <>
    <Pressable disabled={disabled} accessibilityRole="button" accessibilityLabel={`Choose date, ${value}`}
      onPress={() => { setDraft(date); setOpen(true); }}
      style={[styles.field, { backgroundColor: theme.surfaceRaised, borderColor: theme.border }]}>
      <Text style={{ color: theme.textPrimary, fontSize: 16 }}>{date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
      <Text style={{ color: theme.accent }}>Calendar</Text>
    </Pressable>
    {open && Platform.OS !== 'ios' && picker}
    <Modal visible={open && Platform.OS === 'ios'} transparent animationType={reducedMotion ? 'none' : 'slide'} onRequestClose={() => setOpen(false)}>
      <View style={styles.overlay}><View style={[styles.panel, { backgroundColor: theme.surface }]}>
        {picker}
        <View style={styles.actions}>
          <Pressable onPress={() => setOpen(false)}><Text style={{ color: theme.textSecondary }}>Cancel</Text></Pressable>
          <Pressable onPress={() => { onChange(localDate(draft)); setOpen(false); }}><Text style={{ color: theme.accent, fontWeight: '700' }}>Done</Text></Pressable>
        </View>
      </View></View>
    </Modal>
  </>;
}
const styles = StyleSheet.create({ field: { borderWidth: 1, borderRadius: 10, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#0008' }, panel: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 }, actions: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 16 } });
