// src/components/MontarTreino/Modals/LibraryModals.js
import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, FlatList, ScrollView, Platform, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import SmartThumbnail from '../SmartThumbnail';

export default function LibraryModals({
    theme, isWeb, webOuterBg, modalBuscaVisible, setModalBuscaVisible, 
    searchText, setSearchText, selectedCategory, setSelectedCategory, 
    showCatDropdown, setShowCatDropdown, categories, exerciciosFiltrados, 
    addExercicioManual, isSwapping, openPreview, previewModalVisible, 
    setPreviewModalVisible, previewExercise, setPreviewExercise, previewVideoRef
}) {
    return (
        <>
            {/* MODAL DE BUSCA / BIBLIOTECA */}
            <Modal visible={modalBuscaVisible} animationType="slide">
                <View style={{ flex: 1, backgroundColor: webOuterBg }}>
                    <View style={{ width: '100%', backgroundColor: theme.bg, zIndex: 10, ...(isWeb ? { borderBottomWidth: 1, borderBottomColor: theme.border } : {}) }}>
                        <View style={{ width: '100%', maxWidth: 480, alignSelf: 'center', paddingTop: isWeb ? 20 : 10, paddingHorizontal: 20, paddingBottom: 15 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                                <Text style={[styles.headerTitle, { color: theme.text }]}>BIBLIOTECA</Text>
                                <TouchableOpacity onPress={() => { setModalBuscaVisible(false); setSelectedCategory('TODOS'); }}>
                                    <MaterialCommunityIcons name="close" size={24} color={theme.textSecondary} />
                                </TouchableOpacity>
                            </View>
                            <View style={[styles.searchBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                <MaterialCommunityIcons name="magnify" size={20} color={theme.textSecondary} />
                                <TextInput style={[styles.searchInput, { color: theme.text }]} placeholder="Buscar exercício..." placeholderTextColor={theme.textSecondary} value={searchText} onChangeText={setSearchText} />
                            </View>
                            <TouchableOpacity style={[styles.catSelector, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => setShowCatDropdown(!showCatDropdown)}>
                                <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                                    <MaterialCommunityIcons name="filter-variant" size={20} color={theme.textSecondary} />
                                    <Text style={[styles.catSelectorVal, { color: theme.text }]}>{selectedCategory.toUpperCase()}</Text>
                                </View>
                                <MaterialCommunityIcons name={showCatDropdown ? "chevron-up" : "chevron-down"} size={22} color={theme.textSecondary} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <FlatList 
                        style={[{ flex: 1, width: '100%' }, isWeb && { overflowY: 'auto' }]}
                        contentContainerStyle={{ width: '100%', maxWidth: 480, alignSelf: 'center', backgroundColor: theme.bg, padding: 20, paddingBottom: 100, flexGrow: 1, ...(isWeb ? { borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border } : {}) }}
                        data={exerciciosFiltrados} 
                        keyExtractor={item => item.id} 
                        showsVerticalScrollIndicator={true}
                        ListHeaderComponent={showCatDropdown ? (
                            <View style={{ backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 16, marginBottom: 20, padding: 10, maxHeight: 200 }}>
                                <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
                                    {categories.map(cat => (
                                        <TouchableOpacity key={cat} style={{ padding: 14, borderRadius: 10, backgroundColor: selectedCategory === cat ? theme.accent + '22' : 'transparent', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }} onPress={() => { setSelectedCategory(cat); setShowCatDropdown(false); }}>
                                            <Text style={{ color: selectedCategory === cat ? theme.accent : theme.text, fontWeight: selectedCategory === cat ? 'bold' : '500' }}>{cat}</Text>
                                            {selectedCategory === cat && <MaterialCommunityIcons name="check" size={18} color={theme.accent} />}
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        ) : null}
                        renderItem={({ item }) => (
                            <View style={[styles.libItem, { borderBottomColor: theme.border }]}>
                                <SmartThumbnail url={item.videoUrl} style={styles.thumbList} theme={theme} onPress={() => openPreview(item)} />
                                <View style={{flex:1, marginLeft: 15}}>
                                    <Text style={[styles.libName, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
                                    <View style={[styles.catTag, { backgroundColor: theme.surface, marginTop: 5, alignSelf: 'flex-start' }]}><Text style={[styles.libCat, { color: theme.textSecondary }]}>{item.category}</Text></View>
                                </View>
                                <TouchableOpacity onPress={() => addExercicioManual(item)} style={{ padding: 8, backgroundColor: theme.accent + '22', borderRadius: 12 }}>
                                    <MaterialCommunityIcons name={isSwapping ? "sync" : "plus"} size={24} color={theme.accent} />
                                </TouchableOpacity>
                            </View>
                        )} 
                    />
                </View>
            </Modal>

            {/* MODAL PREVIEW DO EXERCÍCIO */}
            <Modal visible={previewModalVisible} transparent animationType="fade" onRequestClose={() => { setPreviewModalVisible(false); setPreviewExercise(null); }}>
                <View style={styles.previewBackdrop}>
                    <View style={[styles.previewContainer, { backgroundColor: theme.surface }]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 20, paddingBottom: 15 }}>
                            <View style={{ flex: 1, marginRight: 15 }}>
                                <Text style={{ fontSize: 18, fontWeight: '900', color: theme.text }} numberOfLines={2}>{previewExercise?.name}</Text>
                                <View style={{ alignSelf: 'flex-start', marginTop: 8, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: theme.border }}>
                                    <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: 'bold' }}>{previewExercise?.category}</Text>
                                </View>
                            </View>
                            <TouchableOpacity style={{ width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: theme.border, justifyContent: 'center', alignItems: 'center' }} onPress={() => { setPreviewModalVisible(false); setPreviewExercise(null); }}>
                                <MaterialCommunityIcons name="close" size={18} color={theme.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={{ flex: 1, marginHorizontal: 20, marginBottom: 20, borderRadius: 16, overflow: 'hidden', backgroundColor: theme.surface }}>
                            {previewModalVisible && previewExercise?.videoUrl ? (
                                Platform.OS === 'web' ? (
                                    <video src={previewExercise.videoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '16px', outline: 'none' }} controls autoPlay loop muted />
                                ) : (
                                    <Video ref={previewVideoRef} style={{ width: '100%', height: '100%' }} source={{ uri: previewExercise.videoUrl }} resizeMode={ResizeMode.COVER} shouldPlay isLooping isMuted />
                                )
                            ) : (
                                <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
                                    <MaterialCommunityIcons name="video-off-outline" size={40} color={theme.textSecondary} />
                                </View>
                            )}
                        </View>

                        <View style={{ padding: 20, paddingTop: 0 }}>
                            <TouchableOpacity style={{ backgroundColor: '#99CC00', padding: 18, borderRadius: 12, alignItems: 'center' }} onPress={() => addExercicioManual(previewExercise)}>
                                <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 16 }}>Adicionar ao treino</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    headerTitle: { fontSize: 18, fontWeight: '900' },
    searchBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, height: 50, borderRadius: 12, borderWidth: 1, marginBottom: 15 },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 15, fontWeight: '500', outlineStyle: 'none' },
    catSelector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderRadius: 12, borderWidth: 1 },
    catSelectorVal: { fontSize: 15, fontWeight: '800' },
    libItem: { paddingVertical: 15, borderBottomWidth: 1, flexDirection:'row', alignItems:'center' },
    thumbList: { width: 60, height: 60, borderRadius: 14 },
    libName: { fontSize: 15, fontWeight: 'bold' },
    catTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    libCat: { fontSize: 10, fontWeight: '700' },
    previewBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    previewContainer: { width: '100%', maxWidth: 420, height: '85%', maxHeight: 800, borderRadius: 20, overflow: 'hidden', display: 'flex', flexDirection: 'column' }
});