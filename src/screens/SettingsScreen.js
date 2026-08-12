import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Key,
  Eye,
  EyeOff,
  Bell,
  Sun,
  Moon,
  Save,
  CheckCircle,
  ShieldCheck,
} from 'lucide-react-native';
import { useVitals } from '../context/VitalsContext';

export default function SettingsScreen() {
  const { apiKey, notificationSettings, saveApiKey, updateNotificationSettings } = useVitals();

  const [inputApiKey, setInputApiKey] = useState(apiKey || '');
  const [showApiKey, setShowApiKey] = useState(false);

  const [notificationsEnabled, setNotificationsEnabled] = useState(
    notificationSettings?.enabled ?? false
  );
  const [morningTime, setMorningTime] = useState(
    notificationSettings?.morningTime || '08:00'
  );
  const [eveningTime, setEveningTime] = useState(
    notificationSettings?.eveningTime || '20:00'
  );

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setInputApiKey(apiKey || '');
  }, [apiKey]);

  useEffect(() => {
    if (notificationSettings) {
      setNotificationsEnabled(notificationSettings.enabled ?? false);
      setMorningTime(notificationSettings.morningTime || '08:00');
      setEveningTime(notificationSettings.eveningTime || '20:00');
    }
  }, [notificationSettings]);

  // Validar formato básico de hora HH:MM
  const isValidTime = (timeStr) => {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(timeStr);
  };

  const handleSaveAll = async () => {
    if (notificationsEnabled) {
      if (!isValidTime(morningTime)) {
        Alert.alert(
          'Formato de Hora Inválido',
          'Por favor ingresa la hora de la mañana en formato de 24 horas HH:MM (ejemplo: 08:00).'
        );
        return;
      }
      if (!isValidTime(eveningTime)) {
        Alert.alert(
          'Formato de Hora Inválido',
          'Por favor ingresa la hora de la noche en formato de 24 horas HH:MM (ejemplo: 20:00).'
        );
        return;
      }
    }

    setSaving(true);
    try {
      // Guardar API Key
      await saveApiKey(inputApiKey.trim());

      // Guardar Configuración de Notificaciones
      await updateNotificationSettings({
        enabled: notificationsEnabled,
        morningTime: morningTime.trim(),
        eveningTime: eveningTime.trim(),
      });

      Alert.alert(
        '¡Configuración Guardada! ⚙️',
        'Tus preferencias y alertas diarias de salud han sido actualizadas con éxito.'
      );
    } catch (error) {
      console.error('Error al guardar la configuración:', error);
      Alert.alert(
        'Error',
        'Ocurrió un problema al guardar la configuración. Por favor intenta nuevamente.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Sección API Key de Gemini */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBg, { backgroundColor: '#EFF6FF' }]}>
              <Key size={20} color="#0F52BA" />
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>API Key de Google Gemini</Text>
              <Text style={styles.cardSubtitle}>
                Necesaria para el escáner inteligente de imágenes médicas.
              </Text>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.apiKeyInput}
              placeholder="Pega aquí tu API Key de Gemini"
              placeholderTextColor="#94A3B8"
              value={inputApiKey}
              onChangeText={setInputApiKey}
              secureTextEntry={!showApiKey}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowApiKey(!showApiKey)}
            >
              {showApiKey ? (
                <EyeOff size={20} color="#64748B" />
              ) : (
                <Eye size={20} color="#64748B" />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.securityInfo}>
            <ShieldCheck size={16} color="#16A34A" />
            <Text style={styles.securityText}>
              Tu API Key se almacena localmente y de forma segura en tu dispositivo.
            </Text>
          </View>
        </View>

        {/* Sección Notificaciones y Recordatorios */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBg, { backgroundColor: '#FEF3C7' }]}>
              <Bell size={20} color="#D97706" />
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>Alertas y Recordatorios</Text>
              <Text style={styles.cardSubtitle}>
                Programa recordatorios locales diarios para medir tus constantes.
              </Text>
            </View>
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Activar Recordatorios Diarios</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#CBD5E1', true: '#93C5FD' }}
              thumbColor={notificationsEnabled ? '#0F52BA' : '#F1F5F9'}
            />
          </View>

          {notificationsEnabled && (
            <View style={styles.timesContainer}>
              {/* Recordatorio Mañana */}
              <View style={styles.timeRow}>
                <View style={styles.timeLabelRow}>
                  <Sun size={18} color="#EAB308" />
                  <Text style={styles.timeTitle}>Alerta Mañana</Text>
                </View>
                <TextInput
                  style={styles.timeInput}
                  placeholder="08:00"
                  placeholderTextColor="#94A3B8"
                  value={morningTime}
                  onChangeText={setMorningTime}
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                />
              </View>

              {/* Recordatorio Noche */}
              <View style={styles.timeRow}>
                <View style={styles.timeLabelRow}>
                  <Moon size={18} color="#6366F1" />
                  <Text style={styles.timeTitle}>Alerta Noche</Text>
                </View>
                <TextInput
                  style={styles.timeInput}
                  placeholder="20:00"
                  placeholderTextColor="#94A3B8"
                  value={eveningTime}
                  onChangeText={setEveningTime}
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                />
              </View>
            </View>
          )}
        </View>

        {/* Botón de Guardado Global */}
        <TouchableOpacity
          style={[styles.saveButton, saving && { opacity: 0.7 }]}
          onPress={handleSaveAll}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Save size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.saveButtonText}>Guardar Configuración y Alertas</Text>
            </>
          )}
        </TouchableOpacity>
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
  card: {
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  inputContainer: {
    position: 'relative',
    justifyContent: 'center',
    marginBottom: 12,
  },
  apiKeyInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    paddingRight: 44,
    fontSize: 14,
    color: '#0F172A',
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    padding: 6,
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 10,
    borderRadius: 8,
  },
  securityText: {
    fontSize: 12,
    color: '#15803D',
    marginLeft: 6,
    flex: 1,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  timesContainer: {
    marginTop: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  timeLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginLeft: 8,
  },
  timeInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    width: 80,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    color: '#0F52BA',
  },
  saveButton: {
    backgroundColor: '#0F52BA',
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
