// src/screens/GerenciarTemplates.js
import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  ActivityIndicator, StatusBar, Platform, ScrollView,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

import { useTheme } from '../contexts/ThemeContext';
import useGerenciarTemplates from '../hooks/useGerenciarTemplates';

import TemplateCard        from '../components/GerenciarTemplates/TemplateCard';
import CollectionModal     from '../components/GerenciarTemplates/CollectionModal';
import TemplateModal       from '../components/GerenciarTemplates/TemplateModal';
import MoveTemplateModal   from '../components/GerenciarTemplates/MoveTemplateModal';
import PreviewTemplateModal from '../components/GerenciarTemplates/PreviewTemplateModal';

export default function GerenciarTemplates({ navigation }) {
  const { theme } = useTheme();
  const s = useGerenciarTemplates(navigation);

  const isWeb = Platform.OS === 'web';
  const RootComponent = isWeb ? View : SafeAreaView;

  return (
    <RootComponent style={isWeb
      ? { height: '100vh', width: '100%', backgroundColor: theme.isDark ? '#0a0a0a' : '#E5E5EA' }
      : { flex: 1, backgroundColor: theme.bg }
    }>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} />

      <View style={{
        flex: 1, width: '100%', maxWidth: isWeb ? 480 : '100%', alignSelf: 'center',
        backgroundColor: theme.bg,
        ...(isWeb ? { borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border } : {}),
      }}>

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={s.handleBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>

          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
              {s.selectedCollection ? s.selectedCollection.name.toUpperCase() : 'BIBLIOTECA VIP'}
            </Text>
            {s.selectedCollection && (
              <Text style={{ color: s.selectedCollection.color, fontSize: 10, fontWeight: 'bold' }}>
                COLEÇÃO DE TREINOS
              </Text>
            )}
          </View>

          {(!s.selectedCollection && s.libFilter === 'MEUS') || (s.selectedCollection && s.isOwner(s.selectedCollection)) ? (
            <TouchableOpacity
              onPress={() => s.selectedCollection ? s.setModalTempVisible(true) : s.openCreateCollectionModal()}
              style={styles.addIcon}
            >
              <Ionicons
                name={s.selectedCollection ? 'add-circle' : 'folder-open'}
                size={28}
                color={s.selectedCollection ? s.selectedCollection.color : theme.accent}
              />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 38 }} />
          )}
        </View>

        {/* ── Library filter tabs ──────────────────────────────────────────── */}
        {!s.selectedCollection && (
          <View style={styles.filterTabsRow}>
            <TouchableOpacity
              style={[styles.filterTab, s.libFilter === 'MEUS'
                ? { backgroundColor: theme.accent, borderColor: theme.accent }
                : { backgroundColor: theme.surface, borderColor: theme.border }
              ]}
              onPress={() => s.setLibFilter('MEUS')}
            >
              <Text style={[styles.filterTabText, { color: s.libFilter === 'MEUS' ? '#000' : theme.textSecondary }]}>
                MINHA BIBLIOTECA
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterTab, s.libFilter === 'EQUIPE'
                ? { backgroundColor: '#AF52DE', borderColor: '#AF52DE' }
                : { backgroundColor: theme.surface, borderColor: theme.border }
              ]}
              onPress={() => s.setLibFilter('EQUIPE')}
            >
              <Text style={[styles.filterTabText, { color: s.libFilter === 'EQUIPE' ? '#FFF' : theme.textSecondary }]}>
                EQUIPE
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Dropdowns de filtro (dentro de pastas) ──────────────────────── */}
        {s.selectedCollection && !s.loading && (
          <View style={{ paddingHorizontal: 20, paddingTop: 15, paddingBottom: 5, flexDirection: 'row', gap: 12, zIndex: 10 }}>

            {/* Goal dropdown */}
            <View style={{ flex: 1 }}>
              <Text style={styles.dropLabel}>OBJETIVO ALVO</Text>
              <TouchableOpacity
                style={[styles.dropBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={() => { s.setShowGoalDrop(!s.showGoalDrop); s.setShowLevelDrop(false); }}
                activeOpacity={0.8}
              >
                <Text style={{ color: theme.text, fontSize: 12, fontWeight: 'bold' }}>{s.filterGoal}</Text>
                <MaterialCommunityIcons name={s.showGoalDrop ? 'chevron-up' : 'chevron-down'} size={18} color={theme.textSecondary} />
              </TouchableOpacity>
              {s.showGoalDrop && (
                <View style={[styles.dropList, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  {['TODOS', 'Hipertrofia', 'Emagrecimento', 'Força'].map(g => (
                    <TouchableOpacity
                      key={g}
                      style={[styles.dropOption, { borderBottomColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}
                      onPress={() => { s.setFilterGoal(g); s.setShowGoalDrop(false); }}
                    >
                      <Text style={{ color: s.filterGoal === g ? theme.accent : theme.text, fontWeight: s.filterGoal === g ? 'bold' : 'normal', fontSize: 12 }}>{g}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Level dropdown */}
            <View style={{ flex: 1 }}>
              <Text style={styles.dropLabel}>NÍVEL DO ATLETA</Text>
              <TouchableOpacity
                style={[styles.dropBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={() => { s.setShowLevelDrop(!s.showLevelDrop); s.setShowGoalDrop(false); }}
                activeOpacity={0.8}
              >
                <Text style={{ color: theme.text, fontSize: 12, fontWeight: 'bold' }}>{s.filterLevel}</Text>
                <MaterialCommunityIcons name={s.showLevelDrop ? 'chevron-up' : 'chevron-down'} size={18} color={theme.textSecondary} />
              </TouchableOpacity>
              {s.showLevelDrop && (
                <View style={[styles.dropList, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  {['TODOS', 'Iniciante', 'Intermediário', 'Avançado'].map(l => (
                    <TouchableOpacity
                      key={l}
                      style={[styles.dropOption, { borderBottomColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}
                      onPress={() => { s.setFilterLevel(l); s.setShowLevelDrop(false); }}
                    >
                      <Text style={{ color: s.filterLevel === l ? theme.accent : theme.text, fontWeight: s.filterLevel === l ? 'bold' : 'normal', fontSize: 12 }}>{l}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {/* ── Main content ─────────────────────────────────────────────────── */}
        {s.loading ? (
          <ActivityIndicator color={theme.accent} style={{ marginTop: 50 }} />
        ) : (
          <ScrollView
            contentContainerStyle={{ padding: 20, paddingBottom: 100, flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Collection action bar */}
            {s.selectedCollection && s.isOwner(s.selectedCollection) && (
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 25 }}>
                <TouchableOpacity
                  style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 12 }}
                  onPress={s.openEditCollectionModal}
                >
                  <MaterialCommunityIcons name="pencil" size={18} color={theme.text} />
                  <Text style={{ color: theme.text, fontWeight: 'bold', marginLeft: 8, fontSize: 12 }}>EDITAR PASTA</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, backgroundColor: 'rgba(255,59,48,0.1)', borderRadius: 12 }}
                  onPress={() => s.handleDeleteCollection(s.selectedCollection.id)}
                >
                  <MaterialCommunityIcons name="trash-can-outline" size={18} color="#FF3B30" />
                  <Text style={{ color: '#FF3B30', fontWeight: 'bold', marginLeft: 8, fontSize: 12 }}>APAGAR</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Protected folder notice */}
            {s.selectedCollection && !s.isOwner(s.selectedCollection) && (
              <View style={{ backgroundColor: theme.surface, padding: 15, borderRadius: 12, borderWidth: 1, borderColor: theme.border, marginBottom: 25, alignItems: 'center', flexDirection: 'row', gap: 10 }}>
                <MaterialCommunityIcons name="shield-lock" size={24} color={theme.textSecondary} />
                <Text style={{ color: theme.textSecondary, flex: 1, fontSize: 12, fontWeight: 'bold' }}>
                  Pasta Protegida. Você só pode visualizar e importar os treinos contidos nela.
                </Text>
              </View>
            )}

            {/* Collections grid */}
            {!s.selectedCollection && (
              <>
                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>PROGRAMAS E PASTAS</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 30 }}>
                  {s.filteredCollections.length === 0 ? (
                    <Text style={styles.emptyText}>Nenhuma coleção encontrada nesta aba.</Text>
                  ) : (
                    s.filteredCollections.map(col => (
                      <TouchableOpacity
                        key={col.id}
                        style={[styles.collectionCard, { backgroundColor: col.color + '15', borderColor: col.color }]}
                        onPress={() => s.setSelectedCollection(col)}
                      >
                        <MaterialCommunityIcons name="folder-star" size={32} color={col.color} style={{ marginBottom: 10 }} />
                        <Text style={[styles.collectionTitle, { color: col.color }]} numberOfLines={2}>{col.name}</Text>
                        <Text style={[styles.collectionCount, { color: col.color, opacity: 0.8 }]}>
                          {col._count?.templates || 0} treinos
                        </Text>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>TREINOS AVULSOS</Text>
              </>
            )}

            {/* Templates list */}
            {s.displayedTemplates.length === 0 ? (
              <View style={styles.emptyBox}>
                <MaterialCommunityIcons name="file-document-outline" size={40} color={theme.border} />
                <Text style={styles.emptyText}>Nenhum treino encontrado com estes filtros.</Text>
              </View>
            ) : (
              s.displayedTemplates.map(item => (
                <TemplateCard
                  key={item.id}
                  item={item}
                  isOwner={s.isOwner(item)}
                  selectedCollection={s.selectedCollection}
                  onPress={() => s.goToEditor(item)}
                  onEdit={() => s.goToEditor(item)}
                  onMove={() => s.openMoveModal(item)}
                  onDelete={() => s.deleteTemplate(item.id)}
                />
              ))
            )}
          </ScrollView>
        )}
      </View>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      <CollectionModal
        visible={s.modalColVisible}
        onClose={() => s.setModalColVisible(false)}
        colName={s.colName}
        setColName={s.setColName}
        colColor={s.colColor}
        setColColor={s.setColColor}
        editingCollectionId={s.editingCollectionId}
        onSave={s.handleCreateOrEditCollection}
      />

      <TemplateModal
        visible={s.modalTempVisible}
        onClose={() => s.setModalTempVisible(false)}
        selectedCollection={s.selectedCollection}
        newTempName={s.newTempName}
        setNewTempName={s.setNewTempName}
        newTempGoal={s.newTempGoal}
        setNewTempGoal={s.setNewTempGoal}
        newTempLevel={s.newTempLevel}
        setNewTempLevel={s.setNewTempLevel}
        isImportingAI={s.isImportingAI}
        onImportPDF={s.handleImportPDF}
        onCreateManual={() => s.goToEditor(null)}
      />

      <MoveTemplateModal
        visible={s.modalMoveVisible}
        onClose={() => s.setModalMoveVisible(false)}
        collections={s.collections.filter(c => s.isOwner(c))}
        onMove={s.handleMoveTemplate}
      />

      <PreviewTemplateModal
        visible={s.modalPreviewVisible}
        onClose={() => s.setModalPreviewVisible(false)}
        template={s.templateToPreview}
        isCloning={s.isCloning}
        onClone={s.handleCloneTemplate}
      />
    </RootComponent>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 15,
    paddingTop: Platform.OS === 'android' ? 10 : 20,
    alignItems: 'center', borderBottomWidth: 1,
  },
  title: { fontWeight: '900', fontSize: 14, letterSpacing: 0.5 },
  backBtn: { padding: 5 },
  addIcon: { padding: 5 },

  filterTabsRow: { flexDirection: 'row', paddingHorizontal: 20, paddingTop: 15, gap: 10 },
  filterTab: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  filterTabText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },

  dropLabel: { fontSize: 10, fontWeight: '900', color: '#888', marginBottom: 6, letterSpacing: 0.5 },
  dropBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 10, borderWidth: 1 },
  dropList: { marginTop: 6, borderRadius: 10, borderWidth: 1, overflow: 'hidden' },
  dropOption: { padding: 12, borderBottomWidth: 1 },

  sectionTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 1, marginBottom: 15, marginTop: 10 },

  collectionCard: { width: '48%', padding: 20, borderRadius: 20, borderWidth: 1, marginBottom: 15, alignItems: 'flex-start' },
  collectionTitle: { fontWeight: '900', fontSize: 15, marginBottom: 5 },
  collectionCount: { fontSize: 11, fontWeight: 'bold' },

  emptyBox: { alignItems: 'center', marginTop: 40, padding: 30 },
  emptyText: { color: '#888', textAlign: 'center', marginTop: 10, fontStyle: 'italic' },
});