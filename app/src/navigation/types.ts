import type { NavigatorScreenParams } from '@react-navigation/native';
export type TabParamList = { Home: undefined; Add: undefined; Insights: undefined; Categories: undefined; Settings: undefined };
export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  History: undefined;
  EditTransaction: { transactionId: string; transactionType: 'income' | 'expense' };
};
