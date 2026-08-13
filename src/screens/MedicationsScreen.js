import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pill, Plus, Trash2, Clock, X, AlertCircle } from 'lucide-react-native';
import {
  getMedications,
  saveMedication,
  deleteMedication,
} from '../services/storage';
import { updateMedicationNotifications } from '../services/notifications';

export default function MedicationsScreen() {
  const insets = useSafeAreaInsets();

  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  // Campos del formulario modal
  const [nombre, setNombre] = useState('');
  const [dosis, setDosis] = useState('');
  const [horaInicio, setHoraInicio] = useState('08');
  const [minutoInicio, setMinutoInicio] = useState('00');
  const [frecuencia, setFrecuencia] = useState('8');

  // Cargar lista de medicamentos al iniciar
  const loadMedications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMedications();
      setMedications(data || []);
    } catch (error) {
      console.error('Error al cargar medicamentos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMedications();
  }, [loadMedications]);

  // Abrir Modal
  const handleOpenModal = () => {
    setNombre('');
    setDosis('');
    setHoraInicio('08');
    setMinutoInicio('00');
    setFrecuencia('8');
    setModalVisible(true);
  };

  // Cerrar Modal
  const handleCloseModal = () => {
    setModalVisible(false);
  };

  // Guardar nuevo medicamento
  const handleSaveMedication = async () => {
    if (!nombre.trim()) {
      Alert.alert('Campo requerido', 'Por favor ingresa el nombre del medicamento.');
      return;
    }

    if (!dosis.trim()) {
      Alert.alert('Campo requerido', 'Por favor ingresa la dosis (ej. 1 pastilla, 5ml).');
      return;
    }

    const freqNum = parseInt(frecuencia, 10);
    if (isNaN(freqNum) || freqNum <= 0) {
      Alert.alert('Frecuencia inválida', 'La frecuencia debe ser un número mayor a 0 horas (ej. 8, 12, 24).');
      return;
    }

    const horaNum = parseInt(horaInicio, 10);
    if (isNaN(horaNum) || horaNum < 0 || horaNum > 23) {
      Alert.alert('Hora inválida', 'La hora debe ser un número entre 00 y 23.');
      return;
    }

    const minutoNum = parseInt(minutoInicio, 10);
    if (isNaN(minutoNum) || minutoNum < 0 || minutoNum > 59) {
      Alert.alert('Minuto inválido', 'El minuto debe ser un número entre 00 y 59.');
      return;
    }

    setSaving(true);
    try {
      const formattedHora = `${String(horaNum).padStart(2, '0')}:${String(minutoNum).padStart(2, '0')}`;

      const newMed = {
        id: Date.now().toString(),
        nombre: nombre.trim(),
        dosis: dosis.trim(),
        horaInicio: formattedHora,
        minutoInicio: minutoNum,
        frecuencia: freqNum,
      };

      const updatedList = await saveMedication(newMed);
      setMedications(updatedList);

      // Reprogramar notificaciones locales
      await updateMedicationNotifications(updatedList);

      setModalVisible(false);
      Alert.alert('¡Medicamento Guardado! 💊', 'El medicamento ha sido registrado y las notificaciones han sido programadas.');
    } catch (error) {
      console.error('Error al guardar medicamento:', error);
      Alert.alert('Error', 'No se pudo guardar el medicamento.');
    } finally {
      setSaving(false);
    }
  };

  // Eliminar medicamento
  const handleDeleteMedication = (med) => {
    Alert.alert(
      'Eliminar Medicamento',
      `¿Estás seguro de que deseas eliminar "${med.nombre}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedList = await deleteMedication(med.id);
              setMedications(updatedList);
              await updateMedicationNotifications(updatedList);
            } catch (error) {
              console.error('Error al eliminar medicamento:', error);
              Alert.alert('Error', 'No se pudo eliminar el medicamento.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 16),
            paddingBottom: Math.max(insets.bottom + 90, 100),
          },
        ]}
      >
        {/* Banner Encabezado */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Módulo de Medicamentos</Text>
          <Text style={styles.headerSubtitle}>
            Gestiona tus tratamientos y recibe recordatorios para tus tomas diarias.
          </Text>
        </View>

        {/* Carga o Lista */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#0F52BA" />
            <Text style={styles.loadingText}>Cargando medicamentos...</Text>
          </View>
        ) : medications.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconContainer}>
              <Pill size={44} color="#94A3B8" />
            </View>
            <Text style={styles.emptyTitle}>Sin medicamentos guardados</Text>
            <Text style={styles.emptySubtitle}>
              Añade tus medicamentos prescritos para llevar un control estricto y recibir recordatorios automáticos.
            </Text>
            <TouchableOpacity
              style={styles.addInlineButton}
              onPress={handleOpenModal}
              activeOpacity={0.8}
            >
              <Plus size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.addInlineButtonText}>Añadir Medicamento</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {medications.map((item) => (
              <View key={item.id} style={styles.medCard}>
                <View style={styles.cardHeaderRow}>
                  <View style={styles.medIconBox}>
                    <Pill size={22} color="#0F52BA" />
                  </View>
                  <View style={styles.medInfoMain}>
                    <Text style={styles.medName}>{item.nombre}</Text>
                    <Text style={styles.medDosis}>Dosis: {item.dosis}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteMedication(item)}
                    activeOpacity={0.7}
                  >
                    <Trash2 size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>

                <View style={styles.cardDetailsRow}>
                  <View style={styles.detailBadge}>
                    <Clock size={15} color="#475569" style={{ marginRight: 6 }} />
                    <Text style={styles.detailText}>
                      Cada {item.frecuencia} {item.frecuencia === 1 ? 'hora' : 'horas'}
                    </Text>
                  </View>

                  <View style={styles.detailBadge}>
                    <Text style={styles.detailLabel}>Inicio: </Text>
                    <Text style={styles.detailValue}>
                      {item.horaInicio || '08:00'}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Botón Flotante (FAB) */}
      <TouchableOpacity
        style={[
          styles.fab,
          { bottom: Math.max(insets.bottom + 20, 24) },
        ]}
        onPress={handleOpenModal}
        activeOpacity={0.85}
      >
        <Plus size={24} color="#FFFFFF" />
        <Text style={styles.fabText}>Añadir Medicamento</Text>
      </TouchableOpacity>

      {/* Modal Formulario */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Pill size={22} color="#0F52BA" style={{ marginRight: 8 }} />
                <Text style={styles.modalTitle}>Nuevo Medicamento</Text>
              </View>
              <TouchableOpacity onPress={handleCloseModal} style={styles.closeButton}>
                <X size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              {/* Nombre */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nombre del Medicamento *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: Paracetamol, Losartán"
                  placeholderTextColor="#94A3B8"
                  value={nombre}
                  onChangeText={setNombre}
                />
              </View>

              {/* Dosis */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Dosis *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: 1 pastilla, 5ml, 500mg"
                  placeholderTextColor="#94A3B8"
                  value={dosis}
                  onChangeText={setDosis}
                />
              </View>

              {/* Hora de primera toma */}
              <Text style={styles.label}>Hora de Primera Toma *</Text>
              <View style={styles.timeInputsRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.subLabel}>Hora (00 - 23)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="08"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    maxLength={2}
                    value={horaInicio}
                    onChangeText={setHoraInicio}
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.subLabel}>Minuto (00 - 59)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="00"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    maxLength={2}
                    value={minutoInicio}
                    onChangeText={setMinutoInicio}
                  />
                </View>
              </View>

              {/* Frecuencia */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Frecuencia en Horas *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: 8, 12, 24"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={frecuencia}
                  onChangeText={setFrecuencia}
                />
                <Text style={styles.helperText}>
                  Ejemplo: Si es 8 horas, recibirás recordatorios cada 8 horas partiendo de la hora inicial.
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCloseModal}
                disabled={saving}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveButton, saving && { opacity: 0.7 }]}
                onPress={handleSaveMedication}
                disabled={saving}
                activeOpacity={0.8}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>Guardar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  loadingBox: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    color: '#64748B',
    fontSize: 14,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginTop: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  emptyIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#334155',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
    lineHeight: 20,
  },
  addInlineButton: {
    backgroundColor: '#0F52BA',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  addInlineButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
  listContainer: {
    marginTop: 4,
  },
  medCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  medIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  medInfoMain: {
    flex: 1,
  },
  medName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  medDosis: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
  },
  cardDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
  },
  detailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  detailLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F52BA',
  },
  fab: {
    position: 'absolute',
    right: 20,
    backgroundColor: '#0F52BA',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 30,
    elevation: 6,
    shadowColor: '#0F52BA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  subLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  timeInputsRow: {
    flexDirection: 'row',
    marginBottom: 8,
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
  helperText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 6,
    lineHeight: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#64748B',
    fontSize: 15,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#0F52BA',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 100,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
