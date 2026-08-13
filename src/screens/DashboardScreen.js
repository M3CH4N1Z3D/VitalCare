import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Activity,
  Heart,
  Droplet,
  Wind,
  Bell,
  PlusCircle,
  Calendar,
  ChevronRight,
} from 'lucide-react-native';
import { useVitals } from '../context/VitalsContext';
import { formatDate, getGlucoseStatus, getBloodPressureStatus } from '../utils/formatters';

const getOxygenStatus = (oxygen) => {
  if (oxygen === null || oxygen === undefined) return 'unknown';
  if (oxygen >= 95) return 'normal';
  if (oxygen >= 90) return 'warning';
  return 'danger';
};

const getPulseStatus = (pulse) => {
  if (pulse === null || pulse === undefined) return 'unknown';
  if (pulse >= 60 && pulse <= 100) return 'normal';
  return 'warning';
};

const getBadgeInfo = (status) => {
  switch (status) {
    case 'normal':
      return { label: 'Normal', bg: '#D1FAE5', color: '#065F46' };
    case 'warning':
      return { label: 'Elevado', bg: '#FEF3C7', color: '#92400E' };
    case 'danger':
      return { label: 'Alerta', bg: '#FEE2E2', color: '#991B1B' };
    default:
      return { label: 'Sin datos', bg: '#F1F5F9', color: '#64748B' };
  }
};

export default function DashboardScreen({ navigation }) {
  const { records, notificationSettings } = useVitals();
  const insets = useSafeAreaInsets();

  const latestRecord = records && records.length > 0 ? records[0] : null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.contentContainer,
        { paddingTop: Math.max(insets.top, 16) },
      ]}
    >
      {/* Header Banner */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Panel de Salud</Text>
        <Text style={styles.headerSubtitle}>
          Monitorea tus signos vitales y mantén el control de tu bienestar.
        </Text>
      </View>

      {/* Ultimo Registro Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Último Registro</Text>
        {latestRecord && (
          <Text style={styles.sectionDate}>
            {formatDate(latestRecord.timestamp)}
          </Text>
        )}
      </View>

      {!latestRecord ? (
        <View style={styles.emptyCard}>
          <Activity size={48} color="#94A3B8" />
          <Text style={styles.emptyTitle}>Sin registros aún</Text>
          <Text style={styles.emptySubtitle}>
            Aún no has guardado ningún registro de signos vitales. Toma una foto de tu equipo médico para comenzar.
          </Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => navigation.navigate('Nuevo')}
            activeOpacity={0.8}
          >
            <PlusCircle size={20} color="#FFFFFF" style={styles.btnIcon} />
            <Text style={styles.createButtonText}>Crear primer registro</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.vitalsGrid}>
          {/* Glucosa */}
          <View style={styles.vitalCard}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: '#EFF6FF' }]}>
                <Droplet size={22} color="#2563EB" />
              </View>
              {(() => {
                const status = getGlucoseStatus(latestRecord.glucose);
                const badge = getBadgeInfo(status);
                return (
                  <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
                  </View>
                );
              })()}
            </View>
            <Text style={styles.cardLabel}>Glucosa</Text>
            <View style={styles.valueRow}>
              <Text style={styles.cardValue}>
                {latestRecord.glucose !== null ? latestRecord.glucose : '--'}
              </Text>
              <Text style={styles.cardUnit}>mg/dL</Text>
            </View>
          </View>

          {/* Presión Arterial */}
          <View style={styles.vitalCard}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: '#FEF2F2' }]}>
                <Heart size={22} color="#DC2626" />
              </View>
              {(() => {
                const status = getBloodPressureStatus(latestRecord.bpSys, latestRecord.bpDia);
                const badge = getBadgeInfo(status);
                return (
                  <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
                  </View>
                );
              })()}
            </View>
            <Text style={styles.cardLabel}>Presión Arterial</Text>
            <View style={styles.valueRow}>
              <Text style={styles.cardValue}>
                {latestRecord.bpSys !== null && latestRecord.bpDia !== null
                  ? `${latestRecord.bpSys}/${latestRecord.bpDia}`
                  : latestRecord.bpSys !== null
                  ? `${latestRecord.bpSys}/--`
                  : '--'}
              </Text>
              <Text style={styles.cardUnit}>mmHg</Text>
            </View>
          </View>

          {/* Oxígeno SpO2 */}
          <View style={styles.vitalCard}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: '#F0FDF4' }]}>
                <Wind size={22} color="#16A34A" />
              </View>
              {(() => {
                const status = getOxygenStatus(latestRecord.oxygen);
                const badge = getBadgeInfo(status);
                return (
                  <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
                  </View>
                );
              })()}
            </View>
            <Text style={styles.cardLabel}>Oxígeno (SpO2)</Text>
            <View style={styles.valueRow}>
              <Text style={styles.cardValue}>
                {latestRecord.oxygen !== null ? `${latestRecord.oxygen}%` : '--'}
              </Text>
            </View>
          </View>

          {/* Pulso BPM */}
          <View style={styles.vitalCard}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: '#FFF7ED' }]}>
                <Activity size={22} color="#EA580C" />
              </View>
              {(() => {
                const status = getPulseStatus(latestRecord.pulse);
                const badge = getBadgeInfo(status);
                return (
                  <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
                  </View>
                );
              })()}
            </View>
            <Text style={styles.cardLabel}>Pulso</Text>
            <View style={styles.valueRow}>
              <Text style={styles.cardValue}>
                {latestRecord.pulse !== null ? latestRecord.pulse : '--'}
              </Text>
              <Text style={styles.cardUnit}>BPM</Text>
            </View>
          </View>
        </View>
      )}

      {/* Imagen adjunta del último registro si existe */}
      {latestRecord?.imageUri && (
        <View style={styles.imageCard}>
          <Text style={styles.imageCardTitle}>Imagen Capturada</Text>
          <Image source={{ uri: latestRecord.imageUri }} style={styles.previewImage} resizeMode="cover" />
        </View>
      )}

      {/* Tarjeta de Próximas Alertas Configuradas */}
      <View style={styles.alertsCard}>
        <View style={styles.alertsHeader}>
          <View style={styles.alertsTitleContainer}>
            <Bell size={22} color="#0F52BA" />
            <Text style={styles.alertsTitle}>Próximas Alertas Configuradas</Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('Configuración')}
            style={styles.configLink}
          >
            <Text style={styles.configLinkText}>Editar</Text>
            <ChevronRight size={16} color="#0F52BA" />
          </TouchableOpacity>
        </View>

        <View style={styles.alertTimesContainer}>
          <View style={styles.alertTimeBox}>
            <Text style={styles.timeLabel}>☀️ Mañana</Text>
            <Text style={styles.timeValue}>
              {notificationSettings?.morningTime || '08:00'}
            </Text>
          </View>

          <View style={styles.timeDivider} />

          <View style={styles.alertTimeBox}>
            <Text style={styles.timeLabel}>🌙 Noche</Text>
            <Text style={styles.timeValue}>
              {notificationSettings?.eveningTime || '20:00'}
            </Text>
          </View>
        </View>

        <View style={styles.alertStatusRow}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: notificationSettings?.enabled ? '#10B981' : '#94A3B8' },
            ]}
          />
          <Text style={styles.statusText}>
            {notificationSettings?.enabled
              ? 'Notificaciones diarias activadas'
              : 'Notificaciones desactivadas'}
          </Text>
        </View>
      </View>
    </ScrollView>
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  sectionDate: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#334155',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
    lineHeight: 20,
  },
  createButton: {
    backgroundColor: '#0F52BA',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  btnIcon: {
    marginRight: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
  vitalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  vitalCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 4,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  cardValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardUnit: {
    fontSize: 12,
    color: '#94A3B8',
    marginLeft: 4,
    fontWeight: '600',
  },
  imageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  imageCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 10,
  },
  previewImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
  },
  alertsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  alertsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  alertsTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginLeft: 8,
  },
  configLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  configLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F52BA',
  },
  alertTimesContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  alertTimeBox: {
    alignItems: 'center',
    flex: 1,
  },
  timeLabel: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F52BA',
  },
  timeDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#CBD5E1',
  },
  alertStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
});
