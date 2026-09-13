import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  Switch,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { COLORS, SPACING, RADIUS, SHADOWS, MOOD_LABELS, MOOD_COLORS, FONTS } from '../../constants';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { JournalEntry, MoodLevel } from '../../types';

export function JournalScreen() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [shareWithTherapist, setShareWithTherapist] = useState(false);
  const [moodAtWriting, setMoodAtWriting] = useState<MoodLevel | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setEntries(data || []);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar las entradas');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEntry = async () => {
    if (!newContent.trim() || !user) return;

    setSaving(true);
    try {
      const { error } = await supabase.from('journal_entries').insert({
        user_id: user.id,
        title: newTitle.trim() || null,
        content: newContent.trim(),
        is_shared_with_therapist: shareWithTherapist,
        mood_at_writing: moodAtWriting,
      });
      if (error) throw error;
      setShowModal(false);
      setNewTitle('');
      setNewContent('');
      setShareWithTherapist(false);
      setMoodAtWriting(null);
      loadEntries();
    } catch {
      Alert.alert('Error', 'No se pudo guardar la entrada');
    } finally {
      setSaving(false);
    }
  };

  const renderEntry = ({ item }: { item: JournalEntry }) => (
    <Card style={styles.entryCard}>
      <View style={styles.entryHeader}>
        <View style={styles.entryInfo}>
          {item.title && <Text style={styles.entryTitle}>{item.title}</Text>}
          <Text style={styles.entryDate}>
            {new Date(item.created_at).toLocaleDateString('es-ES', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
        <View style={styles.entryMeta}>
          {item.mood_at_writing && (
            <View style={[styles.moodDot, { backgroundColor: MOOD_COLORS[item.mood_at_writing] }]} />
          )}
          {item.is_shared_with_therapist && (
            <View style={styles.sharedBadge}>
              <Text style={styles.sharedText}>Compartido</Text>
            </View>
          )}
        </View>
      </View>
      <Text style={styles.entryContent} numberOfLines={4}>
        {item.content}
      </Text>
    </Card>
  );

  if (loading) {
    return <LoadingSpinner fullScreen message="Cargando diario..." />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={entries}
        renderItem={renderEntry}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <Button
            title="Nueva entrada"
            onPress={() => setShowModal(true)}
            variant="primary"
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>—</Text>
            <Text style={styles.emptyTitle}>Tu diario está vacío</Text>
            <Text style={styles.emptyDesc}>
              Escribe tus pensamientos, sentimientos y reflexiones. Puedes compartirlos con tu
              psicólogo si lo deseas.
            </Text>
          </View>
        }
      />

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nueva entrada</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={styles.closeBtn}>Cerrar</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Título (opcional)"
              value={newTitle}
              onChangeText={setNewTitle}
              placeholderTextColor={COLORS.textLight}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="¿Qué sientes hoy? Escribe libremente..."
              value={newContent}
              onChangeText={setNewContent}
              multiline
              placeholderTextColor={COLORS.textLight}
            />

            <Text style={styles.sectionLabel}>¿Cómo te sientes al escribir?</Text>
            <View style={styles.moodRow}>
              {([1, 2, 3, 4, 5] as MoodLevel[]).map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.moodOption,
                    moodAtWriting === level && styles.moodOptionSelected,
                  ]}
                  onPress={() => setMoodAtWriting(level)}
                >
                  <View style={[styles.moodCircle, { backgroundColor: MOOD_COLORS[level] }]} />
                  <Text style={styles.moodLabel}>{MOOD_LABELS[level]}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.shareRow}>
              <Text style={styles.shareLabel}>Compartir con mi psicólogo</Text>
              <Switch
                value={shareWithTherapist}
                onValueChange={setShareWithTherapist}
                trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
                thumbColor={shareWithTherapist ? COLORS.primary : COLORS.textLight}
              />
            </View>
            {shareWithTherapist && (
              <Text style={styles.shareInfo}>
                Tu psicólogo podrá leer esta entrada para entender mejor cómo te sientes.
              </Text>
            )}

            <Button
              title="Guardar entrada"
              onPress={handleSaveEntry}
              loading={saving}
              disabled={!newContent.trim()}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: SPACING.md, paddingBottom: SPACING.xxl, gap: SPACING.sm },
  entryCard: {},
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  entryInfo: { flex: 1 },
  entryTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  entryDate: {
    fontSize: FONTS.sizes.sm - 1,
    color: COLORS.textLight,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  entryMeta: { alignItems: 'flex-end', gap: 4 },
  moodDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  sharedBadge: {
    backgroundColor: COLORS.info + '20',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  sharedText: { fontSize: FONTS.sizes.xs, color: COLORS.info, fontWeight: '600' },
  entryContent: {
    fontSize: FONTS.sizes.sm + 1,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  empty: {
    alignItems: 'center',
    padding: SPACING.xxl,
  },
  emptyIcon: { fontSize: 36, color: COLORS.textLight, marginBottom: SPACING.md },
  emptyTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  emptyDesc: {
    fontSize: FONTS.sizes.sm + 1,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalTitle: { fontSize: FONTS.sizes.xl, fontWeight: '700', color: COLORS.text },
  closeBtn: { fontSize: FONTS.sizes.sm + 1, color: COLORS.primary, fontWeight: '600' },
  input: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: FONTS.sizes.md,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  textArea: {
    height: 150,
    textAlignVertical: 'top',
  },
  sectionLabel: {
    fontSize: FONTS.sizes.sm + 1,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  moodRow: {
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
  moodCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginBottom: 2,
  },
  moodLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary },
  shareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  shareLabel: {
    fontSize: FONTS.sizes.sm + 1,
    color: COLORS.text,
    flex: 1,
  },
  shareInfo: {
    fontSize: FONTS.sizes.sm - 1,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    fontStyle: 'italic',
  },
});
