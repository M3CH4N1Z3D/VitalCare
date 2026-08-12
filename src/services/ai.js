/**
 * Servicio de Análisis de Dispositivos Médicos mediante Gemini API
 */

const GEMINI_PRIMARY_URL = (apiKey) =>
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

const GEMINI_FALLBACK_URL = (apiKey) =>
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

const PROMPT_INSTRUCTIONS = `
Analiza la imagen provista de un dispositivo médico de monitoreo personal (como tensiómetro digital, glucómetro u oxímetro de pulso).
Extrae con total precisión los valores numéricos visibles en la pantalla.

REGLAS ESTRICTAS:
1. Responde EXCLUSIVAMENTE con un objeto JSON válido.
2. NO incluyas ninguna explicación, ni texto de introducción, ni bloques de código markdown (\`\`\`json).
3. Si un valor no está presente o no se puede leer con claridad en la imagen, asigna el valor null.

Estructura requerida del JSON:
{
  "glucose": number | null,
  "bpSys": number | null,
  "bpDia": number | null,
  "oxygen": number | null,
  "pulse": number | null
}
`;

/**
 * Limpia y remueve etiquetas markdown de la respuesta de texto de la IA
 */
const cleanJsonResponse = (text) => {
  if (!text) return '';
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '');
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.replace(/\s*```$/, '');
  }
  return cleaned.trim();
};

/**
 * Analiza una imagen en Base64 utilizando la API de Gemini
 * @param {string} base64Image Imagen en representación base64 (con o sin sufijo data:image/...)
 * @param {string} apiKey API Key válida de Google Gemini
 * @returns {Promise<{glucose: number|null, bpSys: number|null, bpDia: number|null, oxygen: number|null, pulse: number|null}>}
 */
export const analyzeMedicalDeviceImage = async (base64Image, apiKey) => {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('API Key de Gemini no configurada. Por favor configúrala en las opciones de la aplicación.');
  }

  if (!base64Image) {
    throw new Error('No se ha proporcionado ninguna imagen para analizar.');
  }

  // Limpiar el prefijo data:image/...;base64, si existe
  const cleanBase64 = base64Image.includes(',')
    ? base64Image.split(',')[1]
    : base64Image;

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: PROMPT_INSTRUCTIONS,
          },
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64,
            },
          },
        ],
      },
    ],
  };

  let response;
  let endpoint = GEMINI_PRIMARY_URL(apiKey.trim());

  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    // Fallback a gemini-1.5-flash si se obtiene un 404 con gemini-2.5-flash
    if (response.status === 404) {
      console.warn('Modelo gemini-2.5-flash no disponible (404). Intentando con gemini-1.5-flash...');
      endpoint = GEMINI_FALLBACK_URL(apiKey.trim());
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData?.error?.message || `Error en la llamada a la API (${response.status})`;
      throw new Error(`Fallo en la comunicación con Gemini: ${errorMessage}`);
    }

    const data = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      throw new Error('La respuesta de la IA no contiene información ejecutable o reconocible.');
    }

    const jsonString = cleanJsonResponse(candidateText);
    const parsedData = JSON.parse(jsonString);

    // Estandarizar el objeto de salida con validación estricta de tipos
    return {
      glucose: typeof parsedData.glucose === 'number' ? parsedData.glucose : null,
      bpSys: typeof parsedData.bpSys === 'number' ? parsedData.bpSys : null,
      bpDia: typeof parsedData.bpDia === 'number' ? parsedData.bpDia : null,
      oxygen: typeof parsedData.oxygen === 'number' ? parsedData.oxygen : null,
      pulse: typeof parsedData.pulse === 'number' ? parsedData.pulse : null,
    };
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('La IA generó una respuesta que no cumple con el formato JSON esperado.');
    }
    throw error;
  }
};
