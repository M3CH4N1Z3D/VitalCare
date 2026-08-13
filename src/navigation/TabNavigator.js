import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HeartPulse, PlusCircle, ClipboardList, Settings } from 'lucide-react-native';

import DashboardScreen from '../screens/DashboardScreen';
import NewRecordScreen from '../screens/NewRecordScreen';
import HistoryScreen from '../screens/HistoryScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: {
          backgroundColor: '#0F52BA',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
        },
        tabBarActiveTintColor: '#0F52BA',
        tabBarInactiveTintColor: '#64748B',
        tabBarAllowFontScaling: true,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E2E8F0',
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom + 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          paddingBottom: 2,
        },
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'Inicio') {
            return <HeartPulse color={color} size={size} />;
          } else if (route.name === 'Nuevo') {
            return <PlusCircle color={color} size={size} />;
          } else if (route.name === 'Historial') {
            return <ClipboardList color={color} size={size} />;
          } else if (route.name === 'Configuración') {
            return <Settings color={color} size={size} />;
          }
          return null;
        },
      })}
    >
      <Tab.Screen
        name="Inicio"
        component={DashboardScreen}
        options={{ title: 'Inicio - VitalCare' }}
      />
      <Tab.Screen
        name="Nuevo"
        component={NewRecordScreen}
        options={{ title: 'Nuevo Registro' }}
      />
      <Tab.Screen
        name="Historial"
        component={HistoryScreen}
        options={{ title: 'Historial de Registros' }}
      />
      <Tab.Screen
        name="Configuración"
        component={SettingsScreen}
        options={{ title: 'Configuración' }}
      />
    </Tab.Navigator>
  );
}
