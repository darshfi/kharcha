import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import HomeScreen from '../screens/HomeScreen';
import InsightsScreen from '../screens/InsightsScreen';
import CategoriesScreen from '../screens/CategoriesScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AddTransactionSheet from '../screens/AddTransactionSheet';

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList, TabParamList } from './types';
import { useReducedMotion } from '../hooks/useReducedMotion';
import HistoryScreen from '../screens/HistoryScreen';
import EditTransactionScreen from '../screens/EditTransactionScreen';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function TabIcon({ label, focused, color }: { label: string; focused: boolean; color: string }) {
  const symbols: Record<string, string> = {
    Home: 'H',
    Add: '+',
    Insights: 'I',
    Categories: 'C',
    Settings: 'S',
  };
  return (
    <View
      style={{
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: focused ? color + '22' : 'transparent',
      }}
    >
      <Text
        style={{
          fontSize: 14,
          fontWeight: '700',
          color: color,
          opacity: focused ? 1 : 0.6,
        }}
      >
        {symbols[label]}
      </Text>
    </View>
  );
}

function Tabs() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color }) => (
          <TabIcon label={route.name} focused={focused} color={color} />
        ),
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textTertiary,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          borderTopWidth: 1,
          height: 60 + insets.bottom,
          paddingBottom: 8 + insets.bottom,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Add" component={AddTransactionSheet} />
      <Tab.Screen name="Insights" component={InsightsScreen} />
      <Tab.Screen name="Categories" component={CategoriesScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const reducedMotion = useReducedMotion();
  const { theme } = useTheme();
  return <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: theme.bg }, headerTintColor: theme.textPrimary, contentStyle: { backgroundColor: theme.bg }, animation: reducedMotion ? 'none' : 'slide_from_right' }}>
    <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
    <Stack.Screen name="History" component={HistoryScreen} options={{ title: 'Transaction history' }} />
    <Stack.Screen name="EditTransaction" component={EditTransactionScreen} options={{ title: 'Edit transaction' }} />
  </Stack.Navigator>;
}
