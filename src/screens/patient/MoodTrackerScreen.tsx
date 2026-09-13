import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { COLORS, SPACING, RADIUS, SHADOWS, MOOD_LABELS, MOOD_COLORS, FONTS } from '../../constants';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { MoodLevel, MoodEntry } from '../../types';
import { moodTrackerService } from '../../services/moodTracker';

export function MoodTrackerScreen() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCheckin, setShowCheckin] = useState(false);
  const [selectedMood, setSelectedMood] = useState<MoodLevel | null>(null);
  const [moodNote, setMoodNote] = useState('');
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadEntries();
  }, [period]);

  const loadEntries = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = period === 'week'
        ? await moodTrackerService.getWeekSummary(user.id)
        : await moodTrackerService.getMonthSummary(user.id);
      setEntries(data);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMood = async () => {
    if (!selectedMood || !user) return;

    setSaving(true);
    try {
      await moodTrackerService.createEntry({
        user_id: user.id,
        mood: selectedMood,
        note: moodNote || undefined,
      });
      setShowCheckin(false);
      setSelectedMood(null);
      setMoodNote('');
      loadEntries();
    } catch {
      Alert.alert('Error', 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  const averageMood = moodTrackerService.getAverageMood(entries);
  const distribution = moodTrackerService.getMoodDistribution(entries);
  const totalEntries = entries.length;

  const calculateStreak = (): number => {
    if (entries.length === 0) return 0;
    let streak = 1;
    const sorted = [...entries].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    for (let i = 1; i < sorted.length; i++) {
      const curr = new Date(sorted[i - 1].created_at);
      const prev = new Date(sorted[i].created_at);
      const diffDays = Math.round(
        (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diffDays <= 1) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Cargando datos..." />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Check-in Button */}
      {!showCheckin ? (
        <Card style={styles.checkinPrompt}>
          <TouchableOpacity onPress={() => setShowCheckin(true)}>
            <View style={styles.checkinRow}>
              <View style={[styles.checkinCircle, { backgroundColor: COLORS.primaryLight }]} />
              <View style={styles.checkinText}>
                <Text style={styles.checkinTitle}>¿Cómo te sientes hoy?</Text>
                <Text style={styles.checkinDesc}>Toca para hacer tu check-in diario</Text>
              </View>
              <Text style={styles.arrow}>→</Text>
            </View>
          </TouchableOpacity>
        </Card>
      ) : (
        <Card style={styles.moodPicker}>
          <Text style={styles.moodPickerTitle}>¿Cómo te sientes ahora?</Text>
          <View style={styles.moodGrid}>
            {([1, 2, 3, 4, 5] as MoodLevel[]).map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.moodOption,
                  selectedMood === level && styles.moodOptionSelected,
                ]}
                onPress={() => setSelectedMood(level)}
              >
                <View style={[
                  styles.moodColorCircle,
                  { backgroundColor: MOOD_COLORS[level] },
                  selectedMood === level && styles.moodColorCircleSelected,
                ]} />
                <Text style={[
                  styles.moodLabel,
                  selectedMood === level && styles.moodLabelSelected,
                ]}>
                  {MOOD_LABELS[level]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={styles.noteInput}
            placeholder="¿Qué influyó en tu estado de ánimo? (opcional)"
            value={moodNote}
            onChangeText={setMoodNote}
            multiline
            placeholderTextColor={COLORS.textLight}
          />
          <View style={styles.moodActions}>
            <Button
              title="Guardar"
              onPress={handleSaveMood}
              loading={saving}
              disabled={!selectedMood}
            />
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => {
                setShowCheckin(false);
                setSelectedMood(null);
                setMoodNote('');
              }}
            >
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </Card>
      )}

      {/* Stats */}
      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{averageMood}</Text>
          <Text style={styles.statLabel}>Promedio</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{calculateStreak()}</Text>
          <Text style={styles.statLabel}>Días seguidos</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{totalEntries}</Text>
          <Text style={styles.statLabel}>Registros</Text>
        </Card>
      </View>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        <TouchableOpacity
          style={[styles.periodBtn, period === 'week' && styles.periodBtnActive]}
          onPress={() => setPeriod('week')}
        >
          <Text style={[styles.periodBtnText, period === 'week' && styles.periodBtnTextActive]}>
            Esta semana
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.periodBtn, period === 'month' && styles.periodBtnActive]}
          onPress={() => setPeriod('month')}
        >
          <Text style={[styles.periodBtnText, period === 'month' && styles.periodBtnTextActive]}>
            Este mes
          </Text>
        </TouchableOpacity>
      </View>

      {/* Timeline */}
      {entries.length > 0 ? (
        <View style={styles.timeline}>
          <Text style={styles.sectionTitle}>Tu historial</Text>
          {entries.map((entry) => (
            <Card key={entry.id} style={styles.timelineItem}>
              <View style={styles.timelineRow}>
                <View style={[styles.timelineDot, { backgroundColor: MOOD_COLORS[entry.mood] }]} />
                <View style={styles.timelineInfo}>
                  <Text style={styles.timelineMood}>{MOOD_LABELS[entry.mood]}</Text>
                  <Text style={styles.timelineDate}>
                    {new Date(entry.created_at).toLocaleDateString('es-ES', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                  {entry.note && (
                    <Text style={styles.timelineNote}>{entry.note}</Text>
                  )}
                </View>
              </View>
            </Card>
          ))}
        </View>
      ) : (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>—</Text>
          <Text style={styles.emptyText}>
            Aún no hay registros. Haz tu primer check-in emocional.
          </Text>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  checkinPrompt: { marginBottom: SPACING.md },
  checkinRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkinCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: SPACING.md,
  },
  checkinText: { flex: 1 },
  checkinTitle: { fontSize: FONTS.sizes.md, fontWeight: '600', color: COLORS.text },
  checkinDesc: { fontSize: FONTS.sizes.sm - 1, color: COLORS.textSecondary, marginTop: 2 },
  arrow: { fontSize: 18, color: COLORS.textLight },
  moodPicker: { marginBottom: SPACING.md },
  moodPickerTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  moodGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.md,
  },
  moodOption: {
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  moodOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#F0F5F2',
  },
  moodColorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginBottom: 4,
  },
  moodColorCircleSelected: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  moodLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginTop: 4 },
  moodLabelSelected: { color: COLORS.primary, fontWeight: '600' },
  noteInput: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: FONTS.sizes.sm + 1,
    color: COLORS.text,
    minHeight: 60,
    textAlignVertical: 'top',
    marginBottom: SPACING.md,
  },
  moodActions: { gap: SPACING.sm },
  cancelBtn: { alignItems: 'center', padding: SPACING.sm },
  cancelText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm + 1 },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '800',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 3,
    marginBottom: SPACING.md,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  periodBtnActive: { backgroundColor: COLORS.primary },
  periodBtnText: {
    fontSize: FONTS.sizes.sm + 1,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  periodBtnTextActive: { color: COLORS.textOnPrimary },
  timeline: { marginBottom: SPACING.lg },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  timelineItem: { marginBottom: SPACING.xs },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start' },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: SPACING.md,
    marginTop: 4,
  },
  timelineInfo: { flex: 1 },
  timelineMood: {
    fontSize: FONTS.sizes.sm + 1,
    fontWeight: '600',
    color: COLORS.text,
  },
  timelineDate: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textLight,
    textTransform: 'capitalize',
  },
  timelineNote: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  emptyCard: { alignItems: 'center', padding: SPACING.xl },
  emptyIcon: { fontSize: 36, color: COLORS.textLight, marginBottom: SPACING.md },
  emptyText: {
    fontSize: FONTS.sizes.sm + 1,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
