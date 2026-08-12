/**
 * Utilidades de formato para la aplicación VitalCare
 */

/**
 * Formatea una fecha ISO a string legible en español
 * @param {string} isoString Fecha en formato ISO
 * @returns {string} Fecha y hora formateada
 */
export const formatDate = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Evalúa si un valor glucémico está dentro de rangos normales
 * @param {number|null} glucose Valor de glucosa en mg/dL
 * @returns {'normal' | 'warning' | 'danger' | 'unknown'}
 */
export const getGlucoseStatus = (glucose) => {
  if (glucose === null || glucose === undefined) return 'unknown';
  if (glucose < 70) return 'danger'; // Hipoglucemia
  if (glucose <= 140) return 'normal';
  if (glucose <= 180) return 'warning';
  return 'danger'; // Hiperglucemia
};

/**
 * Evalúa si un valor de presión arterial sistólica/diastólica está en rango
 * @param {number|null} sys Sistólica
 * @param {number|null} dia Diastólica
 * @returns {'normal' | 'warning' | 'danger' | 'unknown'}
 */
export const getBloodPressureStatus = (sys, dia) => {
  if (sys === null || dia === null) return 'unknown';
  if (sys < 120 && dia < 80) return 'normal';
  if ((sys >= 120 && sys <= 129) && dia < 80) return 'warning';
  if ((sys >= 130 && sys <= 139) || (dia >= 80 && dia <= 89)) return 'warning';
  if (sys >= 140 || dia >= 90) return 'danger';
  return 'normal';
};
