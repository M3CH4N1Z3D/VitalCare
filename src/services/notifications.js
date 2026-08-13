import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import {
  getMedicationNotificationIds,
  saveMedicationNotificationIds,
} from './storage';

/**
 * Verifica si la aplicación se está ejecutando dentro de Expo Go.
 */
export const isExpoGo = () => {
  try {
    return (
      Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
      Constants.executionEnvironment === 'storeClient' ||
      Constants.appOwnership === 'expo'
    );
  } catch (error) {
    return false;
  }
};

// Configurar el handler global para notificaciones de forma segura
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Inicializa/crea el canal por defecto de notificaciones en Android
 */
export const setupNotificationChannel = async () => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Recordatorios Médicos',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      enableVibrate: true,
    });
  }
};

/**
 * Solicita los permisos necesarios para emitir notificaciones locales
 * @returns {Promise<boolean>} Indicación de si los permisos fueron concedidos
 */
export const requestNotificationPermissions = async () => {
  if (isExpoGo()) {
    console.warn('Las notificaciones no están soportadas en Expo Go en SDK 53+. Usa un Development Build.');
    return false;
  }

  try {
    await setupNotificationChannel();

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch (error) {
    console.warn('Error al solicitar permisos de notificación:', error?.message || error);
    return false;
  }
};

/**
 * Función auxiliar para extraer hora y minuto de diversos formatos ("HH:MM" u objeto {hour, minute})
 */
const parseTime = (time, defaultHour = 8, defaultMinute = 0) => {
  if (typeof time === 'string') {
    const parts = time.split(':');
    if (parts.length === 2) {
      const hour = parseInt(parts[0], 10);
      const minute = parseInt(parts[1], 10);
      return {
        hour: !isNaN(hour) ? Number(hour) : Number(defaultHour),
        minute: !isNaN(minute) ? Number(minute) : Number(defaultMinute),
      };
    }
  } else if (time && typeof time === 'object') {
    const hour = parseInt(time.hour, 10);
    const minute = parseInt(time.minute, 10);
    return {
      hour: !isNaN(hour) ? Number(hour) : Number(defaultHour),
      minute: !isNaN(minute) ? Number(minute) : Number(defaultMinute),
    };
  }
  return { hour: Number(defaultHour), minute: Number(defaultMinute) };
};

/**
 * Programa alertas diarias de recordatorio (cancelando previamente las existentes)
 * @param {string|{hour: number, minute: number}} morningTime Hora de la mañana (ej: "08:00")
 * @param {string|{hour: number, minute: number}} eveningTime Hora de la noche (ej: "20:00")
 */
export const scheduleDailyAlerts = async (morningTime = '08:00', eveningTime = '20:00') => {
  if (isExpoGo()) {
    console.warn('No se pueden programar notificaciones en Expo Go. Ejecuta la app en un Development Build.');
    return false;
  }

  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.warn('Permisos de notificación no concedidos. No se programaron las alertas.');
      return false;
    }

    // Cancelar todas las notificaciones programadas anteriormente
    await Notifications.cancelAllScheduledNotificationsAsync();

    const morning = parseTime(morningTime, 8, 0);
    const evening = parseTime(eveningTime, 20, 0);

    // Programar alerta del turno mañana
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'VitalCare - Recordatorio Mañana ☀️',
        body: 'Es hora de registrar tus signos vitales del día.',
        sound: true,
      },
      trigger: {
        hour: Number(morning.hour),
        minute: Number(morning.minute),
        repeats: true,
        channelId: 'default',
      },
    });

    // Programar alerta del turno noche
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'VitalCare - Recordatorio Noche 🌙',
        body: 'No olvides registrar tus constantes vitales antes de descansar.',
        sound: true,
      },
      trigger: {
        hour: Number(evening.hour),
        minute: Number(evening.minute),
        repeats: true,
        channelId: 'default',
      },
    });

    return true;
  } catch (error) {
    console.warn('Error al programar alertas diarias de notificación:', error?.message || error);
    return false;
  }
};

/**
 * Obtiene la lista actual de notificaciones locales programadas
 * @returns {Promise<Array>}
 */
export const getScheduledAlerts = async () => {
  if (isExpoGo()) {
    console.warn('No se pueden obtener notificaciones programadas en Expo Go.');
    return [];
  }

  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.warn('Error al obtener notificaciones programadas:', error?.message || error);
    return [];
  }
};

/**
 * Actualiza las notificaciones de medicamentos programadas.
 * Cancela notificaciones anteriores de medicamentos y vuelve a programar para todos los medicamentos activos.
 * @param {Array} medicationsList Lista de medicamentos
 */
export const updateMedicationNotifications = async (medicationsList = []) => {
  if (isExpoGo()) {
    console.warn('No se pueden programar notificaciones en Expo Go. Ejecuta la app en un Development Build.');
    return false;
  }

  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.warn('Permisos de notificación no concedidos. No se programaron las alertas de medicamentos.');
      return false;
    }

    // 1. Cancelar notificaciones de medicamentos anteriores
    const previousIds = await getMedicationNotificationIds();
    if (Array.isArray(previousIds)) {
      for (const id of previousIds) {
        try {
          await Notifications.cancelScheduledNotificationAsync(id);
        } catch (err) {
          console.warn(`Error al cancelar notificación de medicamento ID ${id}:`, err);
        }
      }
    }

    const newNotificationIds = [];

    // 2. Programar notificaciones para cada medicamento
    for (const med of medicationsList) {
      if (!med) continue;

      const frecuencia = parseInt(med.frecuencia, 10);
      if (!frecuencia || isNaN(frecuencia) || frecuencia <= 0) {
        continue;
      }

      const tomas = Math.floor(24 / frecuencia);
      if (tomas <= 0) continue;

      let horaInicio = 8;
      let minutoInicio = 0;

      if (med.horaInicio !== undefined && med.horaInicio !== null && med.horaInicio !== '') {
        if (typeof med.horaInicio === 'string' && med.horaInicio.includes(':')) {
          const parts = med.horaInicio.split(':');
          horaInicio = parseInt(parts[0], 10) || 0;
          minutoInicio = parseInt(parts[1], 10) || 0;
        } else {
          horaInicio = parseInt(med.horaInicio, 10) || 0;
        }
      }

      if (med.minutoInicio !== undefined && med.minutoInicio !== null && med.minutoInicio !== '') {
        minutoInicio = parseInt(med.minutoInicio, 10) || 0;
      }

      for (let i = 0; i < tomas; i++) {
        const horaToma = Number((horaInicio + i * frecuencia) % 24);
        const minutoToma = Number(minutoInicio % 60);

        const notifId = await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Recordatorio de Medicamento',
            body: `Hora de tomarse ${med.nombre} - Dosis: ${med.dosis}`,
            sound: true,
          },
          trigger: {
            hour: Number(horaToma),
            minute: Number(minutoToma),
            repeats: true,
            channelId: 'default',
          },
        });

        if (notifId) {
          newNotificationIds.push(notifId);
        }
      }
    }

    // 3. Guardar IDs de notificaciones creadas
    await saveMedicationNotificationIds(newNotificationIds);
    return true;
  } catch (error) {
    console.warn('Error al actualizar las notificaciones de medicamentos:', error?.message || error);
    return false;
  }
};
