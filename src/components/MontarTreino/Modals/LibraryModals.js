// src/components/MontarTreino/Modals/LibraryModals.js
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, FlatList, ScrollView, Platform, StyleSheet, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import SmartThumbnail from '../SmartThumbnail';
import WorkoutPreviewPanel from '../WorkoutPreviewPanel';

// 🔥 MAPA DE SUBCATEGORIAS ATUALIZADO 🔥
const subCategoriesMap = {
    "Peito": ["Todos", "Superior", "Medial", "Inferior"],
    "Costas": ["Todos", "Puxadas", "Remadas", "Lombar"],
    "Pernas": ["Todos", "Multiarticular", "Quadríceps e Adutores", "Posteriores", "Glúteos", "Panturrilha"],
    "Ombros": ["Todos", "Multiarticular", "Frontal", "Lateral", "Posterior", "Trapézio"],
    "Abdômen": ["Todos", "Supra", "Infra", "Core", "Completo"]
};

export default function LibraryModals({
    theme, isWeb, webOuterBg, modalBuscaVisible, setModalBuscaVisible, 
    searchText, setSearchText, selectedCategory, setSelectedCategory, 
    selectedSubCat, setSelectedSubCat, // 🔥 ADICIONADO AQUI
    showCatDropdown, setShowCatDropdown, categories, exerciciosFiltrados, 
    addExercicioManual, isSwapping, openPreview, previewModalVisible, 
    setPreviewModalVisible, previewExercise, setPreviewExercise, previewVideoRef,
    currentExercises 
}) {
    const [toastVisible, setToastVisible] = useState(false);
    const [toastName, setToastName] = useState('');
    const fadeAnim = useRef(new Animated.Value(0)).current;

    // Removemos os states locais de subCat pois agora vêm das props (do Hook)
    const [showSubCatDropdown, setShowSubCatDropdown] = useState(false);

    useEffect(() => {
        // Reseta a subcategoria apenas quando a CATEGORIA principal for trocada manualmente pelo Dropdown
        if (!modalBuscaVisible) {
            setSelectedSubCat('Todos');
            setShowSubCatDropdown(false);
        }
    }, [selectedCategory, modalBuscaVisible]);

    const triggerToast = (name) => {
        setToastName(name);
        setToastVisible(true);
        
        Animated.sequence([
            Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.delay(1200),
            Animated.timing(fadeAnim, { toValue: 0, duration: 400, useNativeDriver: true })
        ]).start(() => setToastVisible(false));
    };

    const handleAdd = (item) => {
        addExercicioManual(item);
        triggerToast(item.name);
    };

    // 🔥 CACHE DE PERFORMANCE: BLINDADO CONTRA ACENTOS E LETRAS MAIÚSCULAS 🔥
    const finalExercises = useMemo(() => {
        return exerciciosFiltrados.filter(e => {
            if (!selectedSubCat || selectedSubCat === 'Todos') return true;
            
            const itemSubCat = String(e.subCategory || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
            const filterSubCat = String(selectedSubCat).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
            
            return itemSubCat === filterSubCat;
        });
    }, [exerciciosFiltrados, selectedSubCat]);

    return (
        <>
            <Modal visible={modalBuscaVisible} animationType="slide">
                <View style={{ flex: 1, backgroundColor: webOuterBg }}>
                    <View style={{ width: '100%', backgroundColor: theme.bg, zIndex: 20, ...(isWeb ? { borderBottomWidth: 1, borderBottomColor: theme.border } : {}) }}>
                        <View style={{ width: '100%', maxWidth: 480, alignSelf: 'center', paddingTop: isWeb ? 20 : 10, paddingHorizontal: 20, paddingBottom: 15 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                                <Text style={[styles.headerTitle, { color: theme.text }]}>BIBLIOTECA</Text>
                                <TouchableOpacity onPress={() => { setModalBuscaVisible(false); setSelectedCategory('TODOS'); setShowCatDropdown(false); }}>
                                    <MaterialCommunityIcons name="close" size={24} color={theme.textSecondary} />
                                </TouchableOpacity>
                            </View>
                            
                            <View style={[styles.searchBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                <MaterialCommunityIcons name="magnify" size={20} color={theme.textSecondary} />
                                <TextInput style={[styles.searchInput, { color: theme.text }]} placeholder="Buscar exercício..." placeholderTextColor={theme.textSecondary} value={searchText} onChangeText={setSearchText} />
                            </View>
                            
                            <TouchableOpacity style={[styles.catSelector, { backgroundColor: theme.surface, borderColor: theme.border, marginBottom: (selectedCategory !== 'TODOS' && subCategoriesMap[selectedCategory]) ? 10 : 0 }]} onPress={() => setShowCatDropdown(!showCatDropdown)}>
                                <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                                    <MaterialCommunityIcons name="filter-variant" size={20} color={theme.textSecondary} />
                                    <Text style={[styles.catSelectorVal, { color: theme.text }]}>{selectedCategory.toUpperCase()}</Text>
                                </View>
                                <MaterialCommunityIcons name={showCatDropdown ? "chevron-up" : "chevron-down"} size={22} color={theme.textSecondary} />
                            </TouchableOpacity>
                            
                            {showCatDropdown && (
                                <View style={[styles.dropdownContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                    <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false} style={{ maxHeight: 250 }}>
                                        {categories.map(cat => (
                                            <TouchableOpacity 
                                                key={cat} 
                                                style={[styles.dropdownItem, selectedCategory === cat && { backgroundColor: theme.accent + '22' }]} 
                                                onPress={() => { setSelectedCategory(cat); setSelectedSubCat('Todos'); setShowCatDropdown(false); }}
                                            >
                                                <Text style={{ color: selectedCategory === cat ? theme.accent : theme.text, fontWeight: selectedCategory === cat ? 'bold' : '500' }}>{cat}</Text>
                                                {selectedCategory === cat && <MaterialCommunityIcons name="check" size={18} color={theme.accent} />}
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}

                            {/* 🔥 NOVO DROPDOWN SANFONA PARA SUBCATEGORIAS 🔥 */}
                            {selectedCategory !== 'TODOS' && subCategoriesMap[selectedCategory] && !showCatDropdown && (
                                <View style={{ marginBottom: 10, marginTop: 5 }}>
                                    <TouchableOpacity 
                                        style={[
                                            styles.catSelector, 
                                            { 
                                                backgroundColor: theme.surface, 
                                                borderColor: theme.border, 
                                                paddingVertical: 12,
                                                borderRadius: showSubCatDropdown ? 12 : 12,
                                                borderBottomWidth: showSubCatDropdown ? 0 : 1,
                                                borderBottomLeftRadius: showSubCatDropdown ? 0 : 12,
                                                borderBottomRightRadius: showSubCatDropdown ? 0 : 12
                                            }
                                        ]}
                                        onPress={() => setShowSubCatDropdown(!showSubCatDropdown)}
                                    >
                                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                                            <MaterialCommunityIcons name="filter-variant" size={18} color={theme.accent} />
                                            <Text style={[styles.catSelectorVal, { color: theme.text, fontSize: 13 }]}>
                                                {selectedSubCat === 'Todos' ? 'TODAS AS SUBCATEGORIAS' : selectedSubCat.toUpperCase()}
                                            </Text>
                                        </View>
                                        <MaterialCommunityIcons name={showSubCatDropdown ? "chevron-up" : "chevron-down"} size={20} color={theme.textSecondary} />
                                    </TouchableOpacity>

                                    {showSubCatDropdown && (
                                        <View style={{ 
                                            backgroundColor: theme.surface, borderWidth: 1, borderTopWidth: 0, 
                                            borderColor: theme.border, borderBottomLeftRadius: 12, borderBottomRightRadius: 12, 
                                            padding: 8 
                                        }}>
                                            {subCategoriesMap[selectedCategory].map(sub => {
                                                const isSelected = selectedSubCat === sub;
                                                return (
                                                    <TouchableOpacity 
                                                        key={sub}
                                                        style={{ 
                                                            padding: 12, borderRadius: 8, 
                                                            backgroundColor: isSelected ? theme.accent + '22' : 'transparent', 
                                                            flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' 
                                                        }}
                                                        onPress={() => { 
                                                            setSelectedSubCat(sub); 
                                                            setShowSubCatDropdown(false); 
                                                        }}
                                                    >
                                                        <Text style={{ color: isSelected ? theme.accent : theme.text, fontWeight: isSelected ? 'bold' : '500', fontSize: 13 }}>
                                                            {sub}
                                                        </Text>
                                                        {isSelected && <MaterialCommunityIcons name="check" size={16} color={theme.accent} />}
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </View>
                                    )}
                                </View>
                            )}

                        </View>
                    </View>

                    {toastVisible && (
                        <Animated.View style={[styles.toastContainer, { opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
                            <View style={[styles.toastContent, { backgroundColor: '#4DE38F' }]}>
                                <MaterialCommunityIcons name="check-circle" size={16} color="#000" />
                                <Text style={styles.toastText} numberOfLines={1}>{toastName} ADICIONADO!</Text>
                            </View>
                        </Animated.View>
                    )}

                    <FlatList 
                        style={[{ flex: 1, width: '100%' }, isWeb && { overflowY: 'auto' }]}
                        contentContainerStyle={{ width: '100%', maxWidth: 480, alignSelf: 'center', backgroundColor: theme.bg, padding: 20, paddingBottom: 150, flexGrow: 1, ...(isWeb ? { borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border } : {}) }}
                        data={finalExercises} 
                        keyExtractor={item => item.id} 
                        showsVerticalScrollIndicator={true}
                        
                        // 🔥 OTIMIZAÇÃO MÁXIMA DA LISTA 🔥
                        initialNumToRender={8}
                        maxToRenderPerBatch={8}
                        windowSize={5}
                        removeClippedSubviews={Platform.OS !== 'web'}

                        renderItem={({ item }) => {
                            let displayCat = item.category.toUpperCase();
                            if (item.subCategory && item.subCategory !== 'Geral') {
                                displayCat += ` • ${item.subCategory.toUpperCase()}`;
                            }

                            return (
                                <View style={[styles.libItem, { borderBottomColor: theme.border }]}>
                                    <SmartThumbnail url={item.videoUrl} style={styles.thumbList} theme={theme} onPress={() => openPreview(item)} />
                                    <View style={{flex:1, marginLeft: 15}}>
                                        <Text style={[styles.libName, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
                                        <View style={[styles.catTag, { backgroundColor: theme.surface, marginTop: 5, alignSelf: 'flex-start' }]}>
                                            <Text style={[styles.libCat, { color: theme.textSecondary }]}>{displayCat}</Text>
                                        </View>
                                    </View>
                                    <TouchableOpacity onPress={() => handleAdd(item)} style={{ padding: 8, backgroundColor: theme.accent + '22', borderRadius: 12 }}>
                                        <MaterialCommunityIcons name={isSwapping ? "sync" : "plus"} size={24} color={theme.accent} />
                                    </TouchableOpacity>
                                </View>
                            );
                        }} 
                        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 30, color: theme.textSecondary }}>Nenhum exercício encontrado nessa categoria.</Text>}
                    />

                    {currentExercises && currentExercises.length > 0 && (
                        <WorkoutPreviewPanel currentExercises={currentExercises} theme={theme} />
                    )}
                </View>
            </Modal>

            <Modal visible={previewModalVisible} transparent animationType="fade" onRequestClose={() => { setPreviewModalVisible(false); setPreviewExercise(null); }}>
                <View style={styles.previewBackdrop}>
                    <View style={[styles.previewContainer, { backgroundColor: theme.surface }]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 20, paddingBottom: 15 }}>
                            <View style={{ flex: 1, marginRight: 15 }}>
                                <Text style={{ fontSize: 18, fontWeight: '900', color: theme.text }} numberOfLines={2}>{previewExercise?.name}</Text>
                                <View style={{ alignSelf: 'flex-start', marginTop: 8, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: theme.border }}>
                                    <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: 'bold' }}>
                                        {previewExercise?.category} {previewExercise?.subCategory && previewExercise.subCategory !== 'Geral' ? `• ${previewExercise.subCategory}` : ''}
                                    </Text>
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
                            <TouchableOpacity style={{ backgroundColor: '#4DE38F', padding: 18, borderRadius: 12, alignItems: 'center' }} onPress={() => handleAdd(previewExercise)}>
                                <Text style={{ color: '#000', fontWeight: '900', fontSize: 16 }}>Adicionar ao treino</Text>
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
    
    // 🔥 BLINDAGEM DE FONT SIZE (EVITA ZOOM NO IOS) 🔥
    searchInput: { flex: 1, marginLeft: 10, fontSize: 16, fontWeight: '500', outlineStyle: 'none' },
    
    catSelector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderRadius: 12, borderWidth: 1 },
    catSelectorVal: { fontSize: 15, fontWeight: '800' },
    dropdownContainer: { position: 'absolute', top: 140, left: 20, right: 20, zIndex: 100, borderRadius: 12, borderWidth: 1, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4 },
    dropdownItem: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
    
    subCatPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
    subCatPillText: { fontSize: 10, letterSpacing: 0.5 },

    libItem: { paddingVertical: 15, borderBottomWidth: 1, flexDirection:'row', alignItems:'center' },
    thumbList: { width: 60, height: 60, borderRadius: 14 },
    libName: { fontSize: 15, fontWeight: 'bold' },
    catTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    libCat: { fontSize: 10, fontWeight: '700' },
    previewBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    previewContainer: { width: '100%', maxWidth: 420, height: '85%', maxHeight: 800, borderRadius: 20, overflow: 'hidden', display: 'flex', flexDirection: 'column' },
    
    toastContainer: {
        position: 'absolute',
        top: 150,
        left: 0,
        right: 0,
        zIndex: 99,
        alignItems: 'center',
        pointerEvents: 'none',
    },
    toastContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 25,
        gap: 8,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    toastText: {
        color: '#000',
        fontWeight: '900',
        fontSize: 12,
        maxWidth: 200,
    }
});