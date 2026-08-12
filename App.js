import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import Constants, { ExecutionEnvironment } from 'expo-constants';

import { VitalsProvider } from './src/context/VitalsContext';
import TabNavigator from './src/navigation/TabNavigator';

export default function App() {
  useEffect(() => {
    try {
      const isExpoGo =
        Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
        Constants.executionEnvironment === 'storeClient' ||
        Constants.appOwnership === 'expo';

      if (isExpoGo) {
        console.warn(
          'VitalCare se está ejecutando en Expo Go. Las funciones de notificaciones requieren un Development Build.'
        );
      }
    } catch (error) {
      console.warn('Error al verificar el entorno de ejecución:', error);
    }
  }, []);

  return (
    <SafeAreaProvider>
      <VitalsProvider>
        <NavigationContainer>
          <StatusBar style="light" backgroundColor="#0F52BA" />
          <TabNavigator />
        </NavigationContainer>
      </VitalsProvider>
    </SafeAreaProvider>
  );
}
