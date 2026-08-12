import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getApiKey as fetchApiKey,
  saveApiKey as persistApiKey,
  getRecords as fetchRecords,
  saveRecords as persistRecords,
  getNotificationSettings as fetchNotificationSettings,
  saveNotificationSettings as persistNotificationSettings,
  saveImageLocally,
} from '../services/storage';
import { scheduleDailyAlerts } from '../services/notifications';

export const VitalsContext = createContext(null);

export const VitalsProvider = ({ children }) => {
  const [records, setRecords] = useState([]);
  const [apiKey, setApiKey] = useState('');
  const [notificationSettings, setNotificationSettings] = useState({
    enabled: false,
    morningTime: '08:00',
    eveningTime: '20:00',
  });
  const [loading, setLoading] = useState(true);

  /**
   * Recarga todos los datos persistidos en AsyncStorage hacia el estado global
   */
  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const [storedApiKey, storedRecords, storedNotificationSettings] = await Promise.all([
        fetchApiKey(),
        fetchRecords(),
        fetchNotificationSettings(),
      ]);

      setApiKey(storedApiKey);
      setRecords(storedRecords);
      setNotificationSettings(storedNotificationSettings);
    } catch (error) {
      console.error('Error al recargar datos de VitalCare:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  /**
   * Guarda o actualiza la API Key de Gemini
   */
  const saveApiKey = async (newKey) => {
    try {
      await persistApiKey(newKey);
      setApiKey(newKey);
      return true;
    } catch (error) {
      console.error('Error al guardar API Key en Context:', error);
      throw error;
    }
  };

  /**
   * Agrega un nuevo registro de salud, guardando la imagen localmente si está presente
   */
  const addRecord = async (recordData) => {
    try {
      let permanentImageUri = null;
      if (recordData.imageUri) {
        permanentImageUri = await saveImageLocally(recordData.imageUri);
      }

      const newRecord = {
        id: recordData.id || Date.now().toString(),
        timestamp: recordData.timestamp || new Date().toISOString(),
        imageUri: permanentImageUri,
        glucose: recordData.glucose ?? null,
        bpSys: recordData.bpSys ?? null,
        bpDia: recordData.bpDia ?? null,
        oxygen: recordData.oxygen ?? null,
        pulse: recordData.pulse ?? null,
        notes: recordData.notes || '',
      };

      const updatedRecords = [newRecord, ...records];
      await persistRecords(updatedRecords);
      setRecords(updatedRecords);
      return newRecord;
    } catch (error) {
      console.error('Error al agregar registro:', error);
      throw error;
    }
  };

  /**
   * Elimina un registro por su ID
   */
  const deleteRecord = async (id) => {
    try {
      const updatedRecords = records.filter((rec) => rec.id !== id);
      await persistRecords(updatedRecords);
      setRecords(updatedRecords);
      return true;
    } catch (error) {
      console.error('Error al eliminar registro:', error);
      throw error;
    }
  };

  /**
   * Actualiza la configuración de notificaciones y re-programa las alertas si están activas
   */
  const updateNotificationSettings = async (newSettings) => {
    try {
      const mergedSettings = { ...notificationSettings, ...newSettings };
      await persistNotificationSettings(mergedSettings);
      setNotificationSettings(mergedSettings);

      if (mergedSettings.enabled) {
        await scheduleDailyAlerts(mergedSettings.morningTime, mergedSettings.eveningTime);
      }
      return true;
    } catch (error) {
      console.error('Error al actualizar configuración de notificaciones:', error);
      throw error;
    }
  };

  const value = {
    records,
    apiKey,
    notificationSettings,
    loading,
    addRecord,
    deleteRecord,
    saveApiKey,
    updateNotificationSettings,
    refreshData,
  };

  return <VitalsContext.Provider value={value}>{children}</VitalsContext.Provider>;
};

/**
 * Hook personalizado para utilizar el Context de VitalCare
 */
export const useVitals = () => {
  const context = useContext(VitalsContext);
  if (!context) {
    throw new Error('useVitals debe ser utilizado dentro de un VitalsProvider');
  }
  return context;
};
