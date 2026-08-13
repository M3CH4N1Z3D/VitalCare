import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Image as ImageIcon, Trash2, Save, Sparkles, AlertTriangle } from 'lucide-react-native';
import { useVitals } from '../context/VitalsContext';
import { analyzeMedicalDeviceImage } from '../services/ai';

export default function NewRecordScreen({ navigation }) {
  const { apiKey, addRecord } = useVitals();
  const insets = useSafeAreaInsets();

  const [selectedImage, setSelectedImage] = useState(null); // { uri, base64 }
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Campos del formulario
  const [glucose, setGlucose] = useState('');
  const [bpSys, setBpSys] = useState('');
  const [bpDia, setBpDia] = useState('');
  const [oxygen, setOxygen] = useState('');
  const [pulse, setPulse] = useState('');
  const [notes, setNotes] = useState('');

  // Verificar y pedir API Key si no está configurada
  const checkApiKeyAndPrompt = () => {
    if (!apiKey || !apiKey.trim()) {
      Alert.alert(
        'API Key no configurada 🔑',
        'Para utilizar el análisis de imágenes con Inteligencia Artificial, debes configurar tu API Key de Gemini en Configuración.',
        [
          { text: 'Ir a Configuración', onPress: () => navigation.navigate('Configuración') },
          { text: 'Entendido', style: 'cancel' },
        ]
      );
      return false;
    }
    return true;
  };

  // Función para procesar y analizar la imagen
  const processImage = async (pickerResult) => {
    if (pickerResult.canceled || !pickerResult.assets || pickerResult.assets.length === 0) {
      return;
    }

    const asset = pickerResult.assets[0];
    setSelectedImage(asset);

    if (!checkApiKeyAndPrompt()) {
      return;
    }

    if (!asset.base64) {
      Alert.alert('Error', 'No se pudo extraer el contenido en Base64 de la imagen seleccionada.');
      return;
    }

    setAnalyzing(true);
    try {
      const result = await analyzeMedicalDeviceImage(asset.base64, apiKey);

      // Autocompletar el formulario con los resultados devueltos
      if (result.glucose !== null && result.glucose !== undefined) {
        setGlucose(String(result.glucose));
      }
      if (result.bpSys !== null && result.bpSys !== undefined) {
        setBpSys(String(result.bpSys));
      }
      if (result.bpDia !== null && result.bpDia !== undefined) {
        setBpDia(String(result.bpDia));
      }
      if (result.oxygen !== null && result.oxygen !== undefined) {
        setOxygen(String(result.oxygen));
      }
      if (result.pulse !== null && result.pulse !== undefined) {
        setPulse(String(result.pulse));
      }

      Alert.alert('¡Análisis Exitoso! ✨', 'Los signos vitales reconocidos por IA se han cargado en el formulario.');
    } catch (error) {
      console.error('Error al analizar la imagen:', error);
      Alert.alert(
        'Error de Análisis IA',
        error.message || 'Ocurrió un error al intentar interpretar el equipo médico. Puedes ingresar los datos manualmente.'
      );
    } finally {
      setAnalyzing(false);
    }
  };

  // Capturar foto con la cámara
  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso Denegado', 'Se requiere acceso a la cámara para capturar la imagen de tu equipo médico.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      await processImage(result);
    } catch (error) {
      console.error('Error al abrir la cámara:', error);
      Alert.alert('Error', 'Ocurrió un fallo al abrir la cámara.');
    }
  };

  // Seleccionar desde la galería
  const pickFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso Denegado', 'Se requiere acceso a la galería para seleccionar imágenes.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      await processImage(result);
    } catch (error) {
      console.error('Error al abrir la galería:', error);
      Alert.alert('Error', 'Ocurrió un fallo al abrir la galería.');
    }
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
  };

  const resetForm = () => {
    setSelectedImage(null);
    setGlucose('');
    setBpSys('');
    setBpDia('');
    setOxygen('');
    setPulse('');
    setNotes('');
  };

  // Guardar registro completo
  const handleSaveRecord = async () => {
    // Validar que al menos un valor o nota esté presente
    if (!glucose && !bpSys && !bpDia && !oxygen && !pulse && !notes && !selectedImage) {
      Alert.alert('Formulario Vacío', 'Por favor ingresa al menos un signo vital o toma una fotografía.');
      return;
    }

    setSaving(true);
    try {
      const newRecord = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        imageUri: selectedImage ? selectedImage.uri : null,
        glucose: glucose !== '' && !isNaN(Number(glucose)) ? Number(glucose) : null,
        bpSys: bpSys !== '' && !isNaN(Number(bpSys)) ? Number(bpSys) : null,
        bpDia: bpDia !== '' && !isNaN(Number(bpDia)) ? Number(bpDia) : null,
        oxygen: oxygen !== '' && !isNaN(Number(oxygen)) ? Number(oxygen) : null,
        pulse: pulse !== '' && !isNaN(Number(pulse)) ? Number(pulse) : null,
        notes: notes.trim(),
      };

      await addRecord(newRecord);
      resetForm();

      Alert.alert('¡Registro Guardado! 🎉', 'Tus constantes vitales han sido registradas correctamente.', [
        {
          text: 'Ver en Inicio',
          onPress: () => navigation.navigate('Inicio'),
        },
      ]);
    } catch (error) {
      console.error('Error al guardar el registro:', error);
      Alert.alert('Error', 'No se pudo guardar el registro en el almacenamiento local.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.contentContainer,
          {
            paddingTop: Math.max(insets.top, 16),
            paddingBottom: Math.max(insets.bottom + 20, 32),
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Banner de aviso API Key si no está cargada */}
        {(!apiKey || !apiKey.trim()) && (
          <TouchableOpacity
            style={styles.apiKeyWarningBanner}
            onPress={() => navigation.navigate('Configuración')}
            activeOpacity={0.8}
          >
            <AlertTriangle size={20} color="#D97706" />
            <Text style={styles.apiKeyWarningText}>
              Configura tu API Key de Gemini para activar la lectura automática con IA.
            </Text>
          </TouchableOpacity>
        )}

        {/* Sección Captura de Foto */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Captura con Escáner IA</Text>
          <Text style={styles.sectionSubtitle}>
            Toma una foto o selecciona una imagen de la pantalla de tu tensiómetro, glucómetro u oxímetro.
          </Text>

          {!selectedImage ? (
            <View style={styles.pickerButtonsRow}>
              <TouchableOpacity
                style={[styles.pickerButton, styles.cameraButton]}
                onPress={takePhoto}
                disabled={analyzing}
                activeOpacity={0.8}
              >
                <Camera size={24} color="#FFFFFF" />
                <Text style={styles.pickerButtonText}>Tomar Foto</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.pickerButton, styles.galleryButton]}
                onPress={pickFromGallery}
                disabled={analyzing}
                activeOpacity={0.8}
              >
                <ImageIcon size={24} color="#0F52BA" />
                <Text style={[styles.pickerButtonText, { color: '#0F52BA' }]}>
                  Galería
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: selectedImage.uri }} style={styles.previewImage} resizeMode="cover" />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={removeSelectedImage}
                disabled={analyzing}
              >
                <Trash2 size={18} color="#FFFFFF" />
                <Text style={styles.removeImageText}>Cambiar foto</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Estado de Carga / Análisis IA */}
          {analyzing && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0F52BA" />
              <View style={styles.loadingTextRow}>
                <Sparkles size={18} color="#0F52BA" style={{ marginRight: 6 }} />
                <Text style={styles.loadingText}>Analizando equipo médico con IA...</Text>
              </View>
            </View>
          )}
        </View>

        {/* Formulario Editable de Signos Vitales */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Datos del Registro</Text>
          <Text style={styles.sectionSubtitle}>
            Revisa o ajusta los valores leídos antes de guardar.
          </Text>

          {/* Glucosa */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Glucosa en Sangre (mg/dL)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: 95"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={glucose}
              onChangeText={setGlucose}
            />
          </View>

          {/* Presión Arterial */}
          <View style={styles.rowInputs}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>P. Sistólica (mmHg)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: 120"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={bpSys}
                onChangeText={setBpSys}
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>P. Diastólica (mmHg)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: 80"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={bpDia}
                onChangeText={setBpDia}
              />
            </View>
          </View>

          {/* Oxígeno y Pulso */}
          <View style={styles.rowInputs}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Oxígeno SpO2 (%)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: 98"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={oxygen}
                onChangeText={setOxygen}
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Pulso (BPM)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: 72"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={pulse}
                onChangeText={setPulse}
              />
            </View>
          </View>

          {/* Observaciones / Comentarios */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Observaciones o Comentarios</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Ej: Tomado en ayunas, después de hacer ejercicio, etc."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              value={notes}
              onChangeText={setNotes}
            />
          </View>

          {/* Botón Guardar */}
          <TouchableOpacity
            style={[styles.saveButton, saving && { opacity: 0.7 }]}
            onPress={handleSaveRecord}
            disabled={saving || analyzing}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Save size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.saveButtonText}>Guardar Registro</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  apiKeyWarningBanner: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  apiKeyWarningText: {
    fontSize: 13,
    color: '#92400E',
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
  },
  pickerButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pickerButton: {
    flex: 1,
    flexDirection: 'row',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  cameraButton: {
    backgroundColor: '#0F52BA',
  },
  galleryButton: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  pickerButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
    marginLeft: 8,
  },
  imagePreviewContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    bottom: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  removeImageText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  loadingContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    alignItems: 'center',
  },
  loadingTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  loadingText: {
    color: '#0369A1',
    fontWeight: '600',
    fontSize: 14,
  },
  inputGroup: {
    marginBottom: 14,
  },
  rowInputs: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#0F172A',
  },
  textArea: {
    minHeight: 80,
  },
  saveButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
