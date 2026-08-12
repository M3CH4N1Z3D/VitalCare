import * as Notifications from 'expo-notifications';
import Constants, { ExecutionEnvironment } from 'expo-constants';

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
try {
  if (isExpoGo()) {
    console.warn('Expo Go detectado: Las notificaciones locales requieren un Development Build en Expo SDK 53+.');
  } else {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  }
} catch (error) {
  console.warn('Error al configurar el handler de notificaciones:', error?.message || error);
}

/**
 * Solicita los permisos necesarios para emitir notificaciones locales
 * @returns {Promise<boolean>} Indización de si los permisos fueron concedidos
 */
export const requestNotificationPermissions = async () => {
  if (isExpoGo()) {
    console.warn('Las notificaciones no están soportadas en Expo Go en SDK 53+. Usa un Development Build.');
    return false;
  }

  try {
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
        hour: !isNaN(hour) ? hour : defaultHour,
        minute: !isNaN(minute) ? minute : defaultMinute,
      };
    }
  } else if (time && typeof time === 'object') {
    return {
      hour: typeof time.hour === 'number' ? time.hour : defaultHour,
      minute: typeof time.minute === 'number' ? time.minute : defaultMinute,
    };
  }
  return { hour: defaultHour, minute: defaultMinute };
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

    const triggerType = Notifications.SchedulableTriggerInputTypes?.DAILY || 'daily';

    // Programar alerta del turno mañana
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'VitalCare - Recordatorio Mañana ☀️',
        body: 'Es hora de registrar tus signos vitales del día.',
        sound: true,
      },
      trigger: {
        type: triggerType,
        hour: morning.hour,
        minute: morning.minute,
        repeats: true,
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
        type: triggerType,
        hour: evening.hour,
        minute: evening.minute,
        repeats: true,
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
