// src/components/BibliotecaAdmin/PreviewTemplateModal.js
import React from 'react';
import {
  Modal, View, Text, TouchableOpacity,
  ScrollView, ActivityIndicator, StyleSheet,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

function PreviewRoutine({ template, theme }) {
  if (!template?.data) return null;
  try {
    const parsedData = typeof template.data === 'string' ? JSON.parse(template.data) : template.data;
    const days = Object.keys(parsedData);

    return days.map(day => (
      <View key={day} style={{ marginBottom: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 }}>
          <MaterialCommunityIcons name="dumbbell" size={16} color={theme.accent} />
          <Text style={{ fontSize: 16, fontWeight: '900', color: theme.accent }}>TREINO {day}</Text>
        </View>

        {(!parsedData[day] || parsedData[day].length === 0) ? (
          <Text style={{ color: theme.textSecondary, fontSize: 12, fontStyle: 'italic', marginLeft: 24 }}>
            Nenhum exercício cadastrado.
          </Text>
        ) : (
          parsedData[day].map((exercise, idx) => {
            const exName = exercise.name || exercise.title || exercise.exerciseName || 'Exercício sem nome';
            const isCardio = (exercise.category || '').toUpperCase() === 'CARDIO';

            let renderBlocks = [];
            if (exercise.blocks?.length > 0) {
              renderBlocks = exercise.blocks;
            } else if (exercise.series) {
              const [sets, reps] = exercise.series.split('/');
              renderBlocks = [{ sets: sets || '-', reps: reps || '-', technique: exercise.technique !== 'NORMAL' ? exercise.technique : '' }];
            } else if (exercise.sets && exercise.reps) {
              renderBlocks = [{ sets: exercise.sets, reps: exercise.reps, technique: exercise.technique || '' }];
            } else {
              renderBlocks = [{ sets: '-', reps: '-', technique: '' }];
            }

            return (
              <View key={idx} style={{
                backgroundColor: theme.surface, padding: 12, borderRadius: 8,
                marginBottom: 6, borderWidth: 1, borderColor: theme.border, marginLeft: 10,
              }}>
                <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 13, marginBottom: 6 }} numberOfLines={2}>
                  {exName}
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {renderBlocks.map((blk, bIdx) => (
                    <View key={bIdx} style={{
                      backgroundColor: theme.bg, paddingHorizontal: 8, paddingVertical: 4,
                      borderRadius: 6, borderWidth: 1, borderColor: theme.border,
                      flexDirection: 'row', alignItems: 'center', gap: 4,
                    }}>
                      <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: '900' }}>
                        {isCardio ? `${blk.sets}min / ${blk.reps}kcal` : `${blk.sets} x ${blk.reps}`}
                      </Text>
                      {blk.technique ? (
                        <Text style={{ color: theme.accent, fontSize: 9, fontWeight: 'bold', marginLeft: 4 }}>
                          ({blk.technique})
                        </Text>
                      ) : null}
                    </View>
                  ))}
                </View>
              </View>
            );
          })
        )}
      </View>
    ));
  } catch {
    return <Text style={{ color: '#FF3B30' }}>Erro ao ler a estrutura do treino.</Text>;
  }
}

export default function PreviewTemplateModal({
  visible,
  onClose,
  template,
  isCloning,
  onClone,
}) {
  const { theme } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={[styles.content, { backgroundColor: theme.surface, borderColor: theme.border }]}>

          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
                {template?.name}
              </Text>
              <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: 'bold', marginTop: 4 }}>
                {template?.goal} • {template?.level}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={{ padding: 5 }}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ padding: 20, flex: 1 }} showsVerticalScrollIndicator={false}>
            <PreviewRoutine template={template} theme={theme} />
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: theme.border, backgroundColor: theme.bg }]}>
            <TouchableOpacity
              style={[styles.cloneBtn, { backgroundColor: '#4DE38F' }]}
              onPress={onClone}
              disabled={isCloning}
            >
              {isCloning ? (
                <ActivityIndicator color="#000" />
              ) : (
                <>
                  <MaterialCommunityIcons name="content-copy" size={20} color="#000" />
                  <Text style={styles.cloneBtnText}>IMPORTAR PARA MINHA BIBLIOTECA</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: 20 },
  content: {
    borderRadius: 24, borderWidth: 1,
    width: '100%', maxWidth: 480, alignSelf: 'center',
    height: '80%', padding: 0, overflow: 'hidden',
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1,
  },
  title: { fontWeight: '900', fontSize: 18, letterSpacing: 0.5 },
  footer: { padding: 20, borderTopWidth: 1 },
  cloneBtn: {
    padding: 20, borderRadius: 15, alignItems: 'center',
    flexDirection: 'row', justifyContent: 'center', gap: 10,
  },
  cloneBtnText: { fontWeight: '900', fontSize: 14, letterSpacing: 1, color: '#000' },
});