/**
 * AppNavigator.tsx — React Native Mobil Ilova Navigatsiyasi
 * Veb sidebar bilan bir xil tartibda:
 * 1. Kundalik Hisobot -> 2. AI Maslahatchi -> 3. Yotoqxona kuzatuvi -> 4. Oshxona -> 5. Mening Profilim
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { KitchenScreen } from '../features/parent/kitchen/KitchenScreen';

export type ParentTabRoute =
  | 'reports'
  | 'ai_chat'
  | 'dormitory'
  | 'kitchen'
  | 'profile';

export interface TabConfig {
  key: ParentTabRoute;
  label: string;
  shortLabel: string;
  icon: string;
  component: React.ComponentType;
}

// Dummy screens for non-kitchen tabs for mobile navigation demo
const PlaceholderReportsScreen: React.FC = () => (
  <View style={styles.placeholderScreen}>
    <Text style={styles.placeholderTitle}>Kundalik Hisobot</Text>
    <Text style={styles.placeholderDesc}>
      Farzandingizning kunlik holati va baholari
    </Text>
  </View>
);

const PlaceholderAiChatScreen: React.FC = () => (
  <View style={styles.placeholderScreen}>
    <Text style={styles.placeholderTitle}>AI Maslahatchi</Text>
    <Text style={styles.placeholderDesc}>
      Pedagogik va tibbiy sun'iy intellekt yordamchisi
    </Text>
  </View>
);

const PlaceholderDormitoryScreen: React.FC = () => (
  <View style={styles.placeholderScreen}>
    <Text style={styles.placeholderTitle}>Yotoqxona Kuzatuvi</Text>
    <Text style={styles.placeholderDesc}>
      Yotoqxona sektorlari jonli videokuzatuvi
    </Text>
  </View>
);

const PlaceholderProfileScreen: React.FC = () => (
  <View style={styles.placeholderScreen}>
    <Text style={styles.placeholderTitle}>Mening Profilim</Text>
    <Text style={styles.placeholderDesc}>
      Ota-ona va o'quvchi ma'lumotlari
    </Text>
  </View>
);

export const PARENT_TABS: TabConfig[] = [
  {
    key: 'reports',
    label: 'Kundalik Hisobot',
    shortLabel: 'Hisobot',
    icon: '📊',
    component: PlaceholderReportsScreen,
  },
  {
    key: 'ai_chat',
    label: 'AI Maslahatchi',
    shortLabel: 'AI',
    icon: '💬',
    component: PlaceholderAiChatScreen,
  },
  {
    key: 'dormitory',
    label: 'Yotoqxona kuzatuvi',
    shortLabel: 'Yotoqxona',
    icon: '📹',
    component: PlaceholderDormitoryScreen,
  },
  {
    key: 'kitchen',
    label: 'Oshxona holati',
    shortLabel: 'Oshxona',
    icon: '🍽️',
    component: KitchenScreen,
  },
  {
    key: 'profile',
    label: 'Mening Profilim',
    shortLabel: 'Profil',
    icon: '👤',
    component: PlaceholderProfileScreen,
  },
];

export const AppNavigator: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState<ParentTabRoute>('kitchen');

  const ActiveComponent =
    PARENT_TABS.find((t) => t.key === activeTab)?.component || KitchenScreen;

  return (
    <SafeAreaView style={styles.container}>
      {/* Active Screen View */}
      <View style={styles.screenContent}>
        <ActiveComponent />
      </View>

      {/* Bottom Tab Bar (Native Bar) */}
      <View style={styles.tabBar}>
        {PARENT_TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabItem}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={tab.label}
            >
              <View
                style={[
                  styles.iconWrapper,
                  isActive && styles.iconWrapperActive,
                ]}
              >
                <Text style={styles.tabIcon}>{tab.icon}</Text>
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  isActive ? styles.tabLabelActive : styles.tabLabelInactive,
                ]}
              >
                {tab.shortLabel}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
};

export default AppNavigator;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F8FA',
  },
  screenContent: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#D3E6F5',
    paddingVertical: 8,
    paddingHorizontal: 6,
    justifyContent: 'space-around',
    shadowColor: '#123C5C',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    minHeight: 48,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  iconWrapperActive: {
    backgroundColor: '#EAF3FB',
  },
  tabIcon: {
    fontSize: 18,
  },
  tabLabel: {
    fontSize: 10.5,
    marginTop: 1,
  },
  tabLabelActive: {
    color: '#1B6FA8',
    fontWeight: '700',
  },
  tabLabelInactive: {
    color: '#6B7280',
    fontWeight: '500',
  },
  placeholderScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F4F8FA',
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#123C5C',
    marginBottom: 8,
  },
  placeholderDesc: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});
