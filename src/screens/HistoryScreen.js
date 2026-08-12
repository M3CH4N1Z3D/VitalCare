import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Trash2,
  Droplet,
  Heart,
  Wind,
  Activity,
  Maximize2,
  X,
  ClipboardList,
  Share2,
} from 'lucide-react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useVitals } from '../context/VitalsContext';
import { formatDate } from '../utils/formatters';

export default function HistoryScreen() {
  const { records, deleteRecord } = useVitals();

  const [expandedId, setExpandedId] = useState(null);
  const [modalImageUri, setModalImageUri] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const exportAndShareHistory = async () => {
    if (!records || records.length === 0) {
      Alert.alert('Sin Datos', 'No hay registros de salud guardados para exportar.');
      return;
    }

    try {
      setIsExporting(true);

      const rowsHtml = records
        .map((item) => {
          const dateObj = item.timestamp ? new Date(item.timestamp) : new Date();
          const dateStr = dateObj.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          });
          const timeStr = dateObj.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
          });

          const bpStr =
            item.bpSys !== null && item.bpDia !== null
              ? `${item.bpSys}/${item.bpDia} mmHg`
              : item.bpSys !== null
              ? `${item.bpSys}/-- mmHg`
              : '-';

          const glucoseStr =
            item.glucose !== null && item.glucose !== undefined
              ? `${item.glucose} mg/dL`
              : '-';

          const oxygenStr =
            item.oxygen !== null && item.oxygen !== undefined
              ? `${item.oxygen}%`
              : '-';

          const pulseStr =
            item.pulse !== null && item.pulse !== undefined
              ? `${item.pulse} BPM`
              : '-';

          const notesStr = item.notes ? item.notes : '-';

          return `
            <tr>
              <td>${dateStr}</td>
              <td>${timeStr}</td>
              <td>${bpStr}</td>
              <td>${glucoseStr}</td>
              <td>${oxygenStr}</td>
              <td>${pulseStr}</td>
              <td>${notesStr}</td>
            </tr>
          `;
        })
        .join('');

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Historial de Signos Vitales</title>
            <style>
              body {
                font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                padding: 24px;
                color: #1E293B;
              }
              .header {
                text-align: center;
                margin-bottom: 24px;
                border-bottom: 2px solid #0F52BA;
                padding-bottom: 12px;
              }
              .header h1 {
                color: #0F52BA;
                margin: 0 0 6px 0;
                font-size: 24px;
              }
              .header p {
                color: #64748B;
                margin: 0;
                font-size: 13px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 16px;
                font-size: 11px;
              }
              th {
                background-color: #0F52BA;
                color: #FFFFFF;
                padding: 10px 8px;
                text-align: left;
                font-weight: bold;
              }
              td {
                padding: 8px;
                border-bottom: 1px solid #E2E8F0;
                text-align: left;
                word-wrap: break-word;
              }
              tr:nth-child(even) {
                background-color: #F8FAFC;
              }
              .footer {
                margin-top: 28px;
                text-align: center;
                font-size: 11px;
                color: #94A3B8;
                border-top: 1px solid #E2E8F0;
                padding-top: 12px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Historial de Signos Vitales</h1>
              <p>Reporte VitalCare generado el ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>Tensión (Sist/Diast)</th>
                  <th>Glucosa</th>
                  <th>SpO2</th>
                  <th>Pulso</th>
                  <th>Observaciones</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
            <div class="footer">
              <p>VitalCare - Control y Seguimiento de Signos Vitales</p>
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          UTI: '.pdf',
          mimeType: 'application/pdf',
        });
      } else {
        Alert.alert(
          'No disponible',
          'La función de compartir no está disponible en este dispositivo.'
        );
      }
    } catch (error) {
      console.error('Error al exportar/compartir historial:', error);
      Alert.alert('Error', 'Ocurrió un error al generar o compartir el archivo PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Eliminar Registro 🗑️',
      '¿Estás seguro de que deseas eliminar este registro de signos vitales? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteRecord(id);
            } catch (error) {
              console.error('Error al eliminar registro:', error);
              Alert.alert('Error', 'No se pudo eliminar el registro.');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => {
    const isExpanded = expandedId === item.id;

    return (
      <View style={styles.card}>
        {/* Cabecera resumida del registro */}
        <TouchableOpacity
          style={styles.cardHeader}
          onPress={() => toggleExpand(item.id)}
          activeOpacity={0.7}
        >
          <View style={styles.headerLeft}>
            <View style={styles.calendarIconBg}>
              <Calendar size={20} color="#0F52BA" />
            </View>
            <View>
              <Text style={styles.dateText}>{formatDate(item.timestamp)}</Text>
              <Text style={styles.summaryText}>
                {[
                  item.glucose !== null ? `Glucosa: ${item.glucose}` : null,
                  item.bpSys !== null && item.bpDia !== null
                    ? `P.A.: ${item.bpSys}/${item.bpDia}`
                    : null,
                  item.oxygen !== null ? `SpO2: ${item.oxygen}%` : null,
                  item.pulse !== null ? `Pulso: ${item.pulse}` : null,
                ]
                  .filter(Boolean)
                  .join(' | ') || 'Sin valores numéricos'}
              </Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            {isExpanded ? (
              <ChevronUp size={22} color="#64748B" />
            ) : (
              <ChevronDown size={22} color="#64748B" />
            )}
          </View>
        </TouchableOpacity>

        {/* Detalle expandible */}
        {isExpanded && (
          <View style={styles.cardDetail}>
            <View style={styles.divider} />

            {/* Imagen miniatura si existe */}
            {item.imageUri && (
              <View style={styles.imageSection}>
                <TouchableOpacity
                  style={styles.imageWrapper}
                  onPress={() => setModalImageUri(item.imageUri)}
                  activeOpacity={0.9}
                >
                  <Image source={{ uri: item.imageUri }} style={styles.thumbnailImage} resizeMode="cover" />
                  <View style={styles.zoomBadge}>
                    <Maximize2 size={14} color="#FFFFFF" />
                    <Text style={styles.zoomText}>Ver imagen</Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {/* Desglose de Valores */}
            <Text style={styles.detailSectionTitle}>Desglose de Signos Vitales</Text>
            <View style={styles.vitalsDetailGrid}>
              <View style={styles.vitalDetailItem}>
                <Droplet size={18} color="#2563EB" />
                <Text style={styles.vitalDetailLabel}>Glucosa:</Text>
                <Text style={styles.vitalDetailValue}>
                  {item.glucose !== null ? `${item.glucose} mg/dL` : 'No registrado'}
                </Text>
              </View>

              <View style={styles.vitalDetailItem}>
                <Heart size={18} color="#DC2626" />
                <Text style={styles.vitalDetailLabel}>Presión Art.:</Text>
                <Text style={styles.vitalDetailValue}>
                  {item.bpSys !== null && item.bpDia !== null
                    ? `${item.bpSys}/${item.bpDia} mmHg`
                    : item.bpSys !== null
                    ? `${item.bpSys}/-- mmHg`
                    : 'No registrada'}
                </Text>
              </View>

              <View style={styles.vitalDetailItem}>
                <Wind size={18} color="#16A34A" />
                <Text style={styles.vitalDetailLabel}>Oxígeno SpO2:</Text>
                <Text style={styles.vitalDetailValue}>
                  {item.oxygen !== null ? `${item.oxygen}%` : 'No registrado'}
                </Text>
              </View>

              <View style={styles.vitalDetailItem}>
                <Activity size={18} color="#EA580C" />
                <Text style={styles.vitalDetailLabel}>Pulso:</Text>
                <Text style={styles.vitalDetailValue}>
                  {item.pulse !== null ? `${item.pulse} BPM` : 'No registrado'}
                </Text>
              </View>
            </View>

            {/* Comentarios / Observaciones */}
            {Boolean(item.notes) && (
              <View style={styles.notesBox}>
                <Text style={styles.notesTitle}>Observaciones:</Text>
                <Text style={styles.notesText}>{item.notes}</Text>
              </View>
            )}

            {/* Acciones */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDelete(item.id)}
                activeOpacity={0.8}
              >
                <Trash2 size={16} color="#EF4444" style={{ marginRight: 6 }} />
                <Text style={styles.deleteButtonText}>Eliminar registro</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Encabezado con Botón de Exportar / Compartir */}
      <View style={styles.topHeader}>
        <Text style={styles.topHeaderTitle}>Historial de Registros</Text>
        <TouchableOpacity
          style={styles.exportHeaderButton}
          onPress={exportAndShareHistory}
          disabled={isExporting}
          activeOpacity={0.8}
        >
          {isExporting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Share2 size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.exportHeaderButtonText}>Compartir Historial</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={records}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={
          records && records.length > 0
            ? styles.listContent
            : styles.emptyListContent
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <ClipboardList size={56} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>Historial Vacío</Text>
            <Text style={styles.emptySubtitle}>
              No hay registros de salud guardados. Cuando agregues nuevos registros, aparecerán ordenados cronológicamente aquí.
            </Text>
          </View>
        }
      />

      {/* Modal para ver imagen ampliada */}
      <Modal
        visible={modalImageUri !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalImageUri(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setModalImageUri(null)}
          >
            <X size={28} color="#FFFFFF" />
          </TouchableOpacity>
          {modalImageUri && (
            <Image
              source={{ uri: modalImageUri }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  topHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  exportHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F52BA',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#0F52BA',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  exportHeaderButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  calendarIconBg: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dateText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  summaryText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  headerRight: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardDetail: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 16,
  },
  imageSection: {
    marginBottom: 16,
  },
  imageWrapper: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  thumbnailImage: {
    width: '100%',
    height: 180,
  },
  zoomBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  zoomText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  detailSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 10,
  },
  vitalsDetailGrid: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  vitalDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  vitalDetailLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginLeft: 8,
    width: 110,
  },
  vitalDetailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  notesBox: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FCD34D',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  notesTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
    marginBottom: 2,
  },
  notesText: {
    fontSize: 13,
    color: '#78350F',
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
  },
  deleteButtonText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#334155',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 48,
    right: 24,
    zIndex: 10,
    padding: 8,
  },
  fullImage: {
    width: '90%',
    height: '80%',
  },
});
