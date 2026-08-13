import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

const API_KEY_STORAGE_KEY = '@vitalcare_api_key';
const RECORDS_STORAGE_KEY = '@vitalcare_records';
const NOTIFICATION_SETTINGS_KEY = '@vitalcare_notification_settings';
const MEDICATIONS_STORAGE_KEY = '@medications';
const MEDICATION_NOTIFICATION_IDS_KEY = '@medication_notification_ids';

/**
 * Obtiene la API Key de Gemini desde AsyncStorage
 */
export const getApiKey = async () => {
  try {
    const key = await AsyncStorage.getItem(API_KEY_STORAGE_KEY);
    return key || '';
  } catch (error) {
    console.error('Error obteniendo API Key:', error);
    return '';
  }
};

/**
 * Guarda la API Key de Gemini en AsyncStorage
 */
export const saveApiKey = async (apiKey) => {
  try {
    await AsyncStorage.setItem(API_KEY_STORAGE_KEY, apiKey || '');
    return true;
  } catch (error) {
    console.error('Error guardando API Key:', error);
    throw error;
  }
};

/**
 * Obtiene los registros de salud guardados
 */
export const getRecords = async () => {
  try {
    const recordsJson = await AsyncStorage.getItem(RECORDS_STORAGE_KEY);
    return recordsJson ? JSON.parse(recordsJson) : [];
  } catch (error) {
    console.error('Error obteniendo registros:', error);
    return [];
  }
};

/**
 * Guarda el arreglo de registros de salud en AsyncStorage
 */
export const saveRecords = async (records) => {
  try {
    await AsyncStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(records));
    return true;
  } catch (error) {
    console.error('Error guardando registros:', error);
    throw error;
  }
};

/**
 * Obtiene la configuración de notificaciones
 */
export const getNotificationSettings = async () => {
  try {
    const settingsJson = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    return settingsJson
      ? JSON.parse(settingsJson)
      : { enabled: false, morningTime: '08:00', eveningTime: '20:00' };
  } catch (error) {
    console.error('Error obteniendo configuración de notificaciones:', error);
    return { enabled: false, morningTime: '08:00', eveningTime: '20:00' };
  }
};

/**
 * Guarda la configuración de notificaciones en AsyncStorage
 */
export const saveNotificationSettings = async (settings) => {
  try {
    await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch (error) {
    console.error('Error guardando configuración de notificaciones:', error);
    throw error;
  }
};

/**
 * Guarda una imagen tomada por la cámara o picker de forma permanente en el directorio local de la app.
 * @param {string} uri URI temporal de la imagen
 * @returns {Promise<string>} URI permanente de la imagen guardada
 */
export const saveImageLocally = async (uri) => {
  if (!uri) return null;

  try {
    // Si ya es un archivo almacenado en documentDirectory, devolverlo tal cual
    if (uri.startsWith(FileSystem.documentDirectory)) {
      return uri;
    }

    const imagesDir = `${FileSystem.documentDirectory}vitalcare_images/`;

    // Asegurarse de que el directorio exista
    const dirInfo = await FileSystem.getInfoAsync(imagesDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(imagesDir, { intermediates: true });
    }

    // Extraer extensión de archivo o usar jpg por defecto
    const fileExtension = uri.split('.').pop() || 'jpg';
    const fileName = `vital_img_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExtension}`;
    const destinationUri = `${imagesDir}${fileName}`;

    await FileSystem.copyAsync({
      from: uri,
      to: destinationUri,
    });

    return destinationUri;
  } catch (error) {
    console.error('Error al guardar la imagen localmente:', error);
    // En caso de fallo en copia, retornar URI original como fallback
    return uri;
  }
};

/**
 * Obtiene los medicamentos guardados
 */
export const getMedications = async () => {
  try {
    const medsJson = await AsyncStorage.getItem(MEDICATIONS_STORAGE_KEY);
    return medsJson ? JSON.parse(medsJson) : [];
  } catch (error) {
    console.error('Error obteniendo medicamentos:', error);
    return [];
  }
};

/**
 * Guarda el arreglo completo de medicamentos
 */
export const saveMedications = async (medicationsList) => {
  try {
    await AsyncStorage.setItem(MEDICATIONS_STORAGE_KEY, JSON.stringify(medicationsList));
    return true;
  } catch (error) {
    console.error('Error guardando lista de medicamentos:', error);
    throw error;
  }
};

/**
 * Agrega o actualiza un medicamento en la lista
 */
export const saveMedication = async (medication) => {
  try {
    const currentMeds = await getMedications();
    const index = currentMeds.findIndex((m) => m.id === medication.id);
    let updatedMeds;
    if (index >= 0) {
      updatedMeds = [...currentMeds];
      updatedMeds[index] = medication;
    } else {
      updatedMeds = [medication, ...currentMeds];
    }
    await saveMedications(updatedMeds);
    return updatedMeds;
  } catch (error) {
    console.error('Error guardando medicamento:', error);
    throw error;
  }
};

/**
 * Elimina un medicamento por su ID
 */
export const deleteMedication = async (id) => {
  try {
    const currentMeds = await getMedications();
    const updatedMeds = currentMeds.filter((m) => m.id !== id);
    await saveMedications(updatedMeds);
    return updatedMeds;
  } catch (error) {
    console.error('Error eliminando medicamento:', error);
    throw error;
  }
};

/**
 * Obtiene los IDs de las notificaciones de medicamentos programadas
 */
export const getMedicationNotificationIds = async () => {
  try {
    const idsJson = await AsyncStorage.getItem(MEDICATION_NOTIFICATION_IDS_KEY);
    return idsJson ? JSON.parse(idsJson) : [];
  } catch (error) {
    console.error('Error obteniendo IDs de notificaciones de medicamentos:', error);
    return [];
  }
};

/**
 * Guarda los IDs de las notificaciones de medicamentos programadas
 */
export const saveMedicationNotificationIds = async (ids) => {
  try {
    await AsyncStorage.setItem(MEDICATION_NOTIFICATION_IDS_KEY, JSON.stringify(ids));
    return true;
  } catch (error) {
    console.error('Error guardando IDs de notificaciones de medicamentos:', error);
    throw error;
  }
};
