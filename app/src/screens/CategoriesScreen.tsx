import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { useStore } from '../store/useStore';

export default function CategoriesScreen() {
  const { theme } = useTheme();
  const { categories, addCategory, deleteCategory, clearAll } = useStore();
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🏷️');
  const [color, setColor] = useState('#0F766E');

  const handleAdd = () => {
    if (!name.trim()) return;
    if (categories.some((c) => c.name.toLowerCase() === name.toLowerCase())) return;
    addCategory({
      id: `cat-${Date.now()}`,
      emoji: emoji || '🏷️',
      name: name.trim(),
      color,
    });
    setName('');
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={[styles.heading, { color: theme.textPrimary }]}>Categories</Text>

        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Your categories</Text>
          {categories.map((c) => (
            <View
              key={c.id}
              style={[styles.row, { borderColor: theme.border }]}
            >
              <View style={[styles.dot, { backgroundColor: `${c.color}33` }]}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: c.color }}>{c.symbol}</Text>
              </View>
              <Text style={[styles.rowName, { color: theme.textPrimary }]}>{c.name}</Text>
              {c.name !== 'Others' && (
                <TouchableOpacity onPress={() => deleteCategory(c.id)}>
                  <Text style={{ color: theme.textTertiary, fontSize: 18 }}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>New category</Text>
          <View style={styles.twoCol}>
            <View style={styles.col}>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Emoji</Text>
              <TextInput
                style={[styles.input, { color: theme.textPrimary, backgroundColor: theme.surfaceRaised, borderColor: theme.border }]}
                value={emoji}
                onChangeText={setEmoji}
                maxLength={4}
              />
            </View>
            <View style={styles.col}>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Colour</Text>
              <TextInput
                style={[styles.input, { color: theme.textPrimary, backgroundColor: theme.surfaceRaised, borderColor: theme.border }]}
                value={color}
                onChangeText={setColor}
                placeholder="#0F766E"
                placeholderTextColor={theme.textTertiary}
              />
            </View>
          </View>
          <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Name</Text>
          <TextInput
            style={[styles.input, { color: theme.textPrimary, backgroundColor: theme.surfaceRaised, borderColor: theme.border }]}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Pets"
            placeholderTextColor={theme.textTertiary}
            maxLength={30}
          />
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: theme.accent }]}
            onPress={handleAdd}
          >
            <Text style={{ color: theme.accentContrast, fontWeight: '700', fontSize: 15 }}>
              Add category
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Data</Text>
          <TouchableOpacity
            style={[styles.secondaryBtn, { borderColor: theme.border }]}
            onPress={clearAll}
          >
            <Text style={{ color: theme.negative, fontWeight: '600' }}>Delete all transactions</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 100 },
  heading: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 12,
  },
  dot: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  twoCol: {
    flexDirection: 'row',
    gap: 12,
  },
  col: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 13,
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  primaryBtn: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 14,
  },
  secondaryBtn: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    marginTop: 8,
  },
});
