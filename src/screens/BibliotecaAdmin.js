// src/screens/BibliotecaAdmin.js
import React, { useState, useEffect, useCallback } from 'react';
import { 
    View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, 
    Image, Alert, Platform, useWindowDimensions, StatusBar, 
    ImageBackground, LayoutAnimation, UIManager 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '../contexts/ThemeContext';
import { useBibliotecaAdmin } from '../hooks/useBibliotecaAdmin';
import { categoryCovers, subCategoriesMap, SPACING, HORIZONTAL_PADDING } from '../data/bibliotecaData';

import ExerciseCard from '../components/BibliotecaAdmin/ExerciseCard';
import ExerciseFormModal from '../components/BibliotecaAdmin/ExerciseFormModal';
import CategoryFilterModal from '../components/BibliotecaAdmin/CategoryFilterModal';
import VideoPreviewModal from '../components/VideoPreviewModal';
import BulkContentModal from '../components/BibliotecaAdmin/BulkContentModal';
import { MASTER_IDS } from '../constants/masterIds';

// Habilita animações no Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function BibliotecaAdmin({ navigation }) {
    const { width } = useWindowDimensions();
    const { theme } = useTheme(); 

    const {
        exercises, setExercises, loading, filterText, setFilterText,
        selectedCat, setSelectedCat, selectedSubCat, setSelectedSubCat,
        filteredList, fetchLibrary, handleDelete, isWeb
    } = useBibliotecaAdmin();

    const [catModalVisible, setCatModalVisible] = useState(false); 
    const [formModalVisible, setFormModalVisible] = useState(false); 
    const [videoModalVisible, setVideoModalVisible] = useState(false); 
    const [showSubCatDropdown, setShowSubCatDropdown] = useState(false);
    const [currentVideoUrl, setCurrentVideoUrl] = useState('');
    const [editingExercise, setEditingExercise] = useState(null);
    const [bulkContentModalVisible, setBulkContentModalVisible] = useState(false);

    // 🔥 ESTADOS DAS ABAS E VERIFICAÇÃO DE COACH
    const [activeTab, setActiveTab] = useState('MEUS'); // 'MEUS' | 'ELITE'
    const [isMaster, setIsMaster] = useState(false); // Default true para não piscar a tela
    const [coachId, setCoachId] = useState(null);

    // 🔥 FUNDO EXTERNO (LATERAIS NO PC) AGORA É SEMPRE ESCURO INDEPENDENTE DO TEMA 🔥
    const webOuterBg = '#0a0a0a';

    // Verifica quem está logado para exibir ou não as abas
    useEffect(() => {
        const checkUser = async () => {
            const userJson = await AsyncStorage.getItem('user');
            if (userJson) {
                const user = JSON.parse(userJson);
                setCoachId(user.id);
                setIsMaster(MASTER_IDS.includes(user.id));
            }
        };
        checkUser();
    }, []);

    // Ocultar scrollbar no Web
    useEffect(() => {
        if (Platform.OS === 'web') {
            const style = document.createElement('style');
            style.id = 'hidden-scrollbar';
            style.innerHTML = `::-webkit-scrollbar { width: 0px; background: transparent; } * { scrollbar-width: none; }`;
            document.head.appendChild(style);
            return () => document.getElementById('hidden-scrollbar')?.remove();
        }
    }, []);

    // Animação suave ao filtrar ou trocar de aba
    useEffect(() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }, [filteredList.length, selectedCat, selectedSubCat, activeTab]);

    // 🔥 Em telas bem largas (PC grande) usa 3 colunas em vez de esticar 2 colunas gigantes
    const getNumColumns = () => {
        if (!isWeb) return 1;
        if (width > 1100) return 3;
        if (width > 800) return 2;
        return 1;
    };
    const numColumns = getNumColumns();
    const containerWidth = isWeb ? (width > 768 ? 1200 : (width > 480 ? 480 : width)) : width;
    const itemWidth = numColumns > 1 ? (containerWidth - (HORIZONTAL_PADDING * 2) - (SPACING * (numColumns - 1))) / numColumns : (containerWidth - (HORIZONTAL_PADDING * 2));
    const lateralSpace = (width - containerWidth) / 2;

    const openVideoPreview = useCallback((url) => {
        if (!url || url.length < 5) return Alert.alert("Vídeo Indisponível", "Este exercício não possui vídeo.");
        setCurrentVideoUrl(url);
        setVideoModalVisible(true);
    }, []);

    const handleEdit = useCallback((ex) => {
        setEditingExercise({ ...ex, subCategory: ex.subCategory || 'Geral', environments: ex.environments || ['ACADEMIA'] });
        setFormModalVisible(true);
    }, []);

    const handleAddNew = () => { setEditingExercise(null); setFormModalVisible(true); };

    const onSaveSuccess = (savedExercise, isEditing) => {
        setExercises(prev => isEditing ? prev.map(ex => ex.id === savedExercise.id ? savedExercise : ex) : [savedExercise, ...prev]);
        fetchLibrary(); 
    };

    // 🔥 LÓGICA DE SEPARAÇÃO DA LISTA NO FRONTEND 🔥
    let displayList = isMaster ? filteredList : filteredList.filter(ex => {
        if (activeTab === 'MEUS') return ex.coachId === coachId;
        if (activeTab === 'ELITE') return MASTER_IDS.includes(ex.coachId) || !ex.coachId;
        return true;
    });

    // 🔥 FILTRO ANTI-DUPLICATAS GLOBAL (PARA MASTERS E BASE ELITE) 🔥
    if (isMaster || activeTab === 'ELITE') {
        const uniqueExercises = [];
        const seenNames = new Set();

        displayList.forEach(ex => {
            const exerciseName = ex.name || ex.title || '';
            const normName = exerciseName.toLowerCase().trim();
            if (!seenNames.has(normName)) {
                uniqueExercises.push(ex);
                seenNames.add(normName);
            }
        });
        displayList = uniqueExercises;
    }

    // Componente de Skeleton
    const renderSkeleton = () => (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING, justifyContent: 'space-between' }}>
            {[1, 2, 3, 4].map(key => (
                <View key={key} style={[styles.skeletonCard, { width: itemWidth, backgroundColor: theme.surface }]}>
                    <View style={[styles.skeletonThumb, { backgroundColor: theme.border }]} />
                    <View style={{ flex: 1, justifyContent: 'center' }}>
                        <View style={{ height: 14, width: '80%', backgroundColor: theme.border, borderRadius: 4, marginBottom: 8 }} />
                        <View style={{ height: 10, width: '50%', backgroundColor: theme.border, borderRadius: 4, marginBottom: 12 }} />
                        <View style={{ height: 20, width: 60, backgroundColor: theme.border, borderRadius: 6 }} />
                    </View>
                </View>
            ))}
        </View>
    );

    // Componente de Empty State
    const renderEmptyState = () => (
        <View style={styles.emptyStateContainer}>
            <View style={[styles.emptyStateIconBox, { backgroundColor: theme.surface }]}>
                <MaterialCommunityIcons name="dumbbell" size={48} color={theme.textSecondary} style={{ opacity: 0.5 }} />
            </View>
            <Text style={[styles.emptyStateTitle, { color: theme.text }]}>Nenhum exercício encontrado</Text>
            <Text style={[styles.emptyStateSub, { color: theme.textSecondary }]}>
                {(!isMaster && activeTab === 'MEUS') ? "Você ainda não criou nenhum exercício personalizado." : "Tente buscar por outro nome ou ajuste os filtros de categoria."}
            </Text>
            {(filterText !== '' || selectedCat !== 'TODOS') && (
                <TouchableOpacity 
                    style={[styles.clearFilterBtn, { backgroundColor: theme.accent + '15' }]}
                    onPress={() => { setFilterText(''); setSelectedCat('TODOS'); setSelectedSubCat('Todos'); }}
                >
                    <Text style={[styles.clearFilterText, { color: theme.accent }]}>LIMPAR FILTROS</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    const RootComponent = isWeb ? View : SafeAreaView;
    const rootStyle = isWeb ? { height: '100vh', width: '100%', backgroundColor: webOuterBg } : { flex: 1, backgroundColor: theme.bg };

    return (
        <RootComponent style={rootStyle}>
            <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />

            {/* LOGOS LATERAIS RESTAURADAS */}
            {isWeb && lateralSpace > 10 && (
                <View style={[StyleSheet.absoluteFill, { zIndex: -1, pointerEvents: 'none' }]}>
                    <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: lateralSpace, justifyContent: 'center', alignItems: 'center' }}>
                        <Image source={require('../../assets/logopaelite.png')} style={{ width: '85%', height: '60%', resizeMode: 'contain' }} />
                    </View>
                    <View style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: lateralSpace, justifyContent: 'center', alignItems: 'center' }}>
                        <Image source={require('../../assets/logopaelite.png')} style={{ width: '85%', height: '60%', resizeMode: 'contain' }} />
                    </View>
                </View>
            )}

            <View style={{ flex: 1, width: '100%', alignSelf: 'center', backgroundColor: isWeb ? 'transparent' : theme.bg }}>
                <FlatList
                    key={`grid-${numColumns}`} 
                    data={loading ? [] : displayList} 
                    keyExtractor={item => String(item.id)}
                    numColumns={numColumns}
                    style={{ flex: 1, width: '100%' }}
                    contentContainerStyle={{ width: '100%', maxWidth: containerWidth, alignSelf: 'center', backgroundColor: theme.bg, paddingBottom: 30, paddingHorizontal: HORIZONTAL_PADDING, flexGrow: 1 }}
                    columnWrapperStyle={numColumns > 1 ? { gap: SPACING } : undefined} 
                    showsVerticalScrollIndicator={false}

                    ListHeaderComponent={
                        <View style={{ marginBottom: 10 }}>
                            <View style={[styles.header, { paddingTop: isWeb ? 20 : 60 }]}>
                                <View style={{flexDirection: 'row', alignItems: 'center', gap: 15}}>
                                    <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.iconBtn, { backgroundColor: theme.surface }]}>
                                        <MaterialCommunityIcons name="arrow-left" size={24} color={theme.text} />
                                    </TouchableOpacity>
                                    <View>
                                        <Text style={[styles.headerTitle, { color: theme.text }]}>BIBLIOTECA</Text>
                                        <Text style={styles.headerSubtitle}>GERENCIAMENTO</Text>
                                    </View>
                                </View>
                                <View style={{ flexDirection: 'row', gap: 10 }}>
                                    <TouchableOpacity onPress={() => setBulkContentModalVisible(true)} style={[styles.iconBtn, { backgroundColor: theme.surface }]}>
                                        <MaterialCommunityIcons name="text-box-multiple-outline" size={22} color={theme.accent} />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={fetchLibrary} style={[styles.iconBtn, { backgroundColor: theme.surface }]}>
                                        <MaterialCommunityIcons name="refresh" size={24} color={theme.accent} />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={[styles.searchBox, { backgroundColor: theme.surface }]}>
                                <MaterialCommunityIcons name="magnify" size={24} color={theme.textSecondary} />
                                <TextInput 
                                    style={[styles.searchInput, { color: theme.text }]} 
                                    placeholder="Pesquisar exercício..." 
                                    placeholderTextColor={theme.textSecondary}
                                    value={filterText} onChangeText={setFilterText} 
                                />
                            </View>

                            {/* 🔥 ABAS EXCLUSIVAS PARA PARCEIROS */}
                            {!isMaster && (
                                <View style={[styles.tabContainer, { backgroundColor: theme.surface }]}>
                                    <TouchableOpacity 
                                        style={[styles.tabBtn, activeTab === 'MEUS' && { backgroundColor: theme.accent }]} 
                                        onPress={() => setActiveTab('MEUS')}
                                    >
                                        <Text style={[styles.tabText, activeTab === 'MEUS' ? { color: theme.isDark ? '#000' : '#FFF' } : { color: theme.textSecondary }]}>MEUS EXERCÍCIOS</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={[styles.tabBtn, activeTab === 'ELITE' && { backgroundColor: theme.accent }]} 
                                        onPress={() => setActiveTab('ELITE')}
                                    >
                                        <Text style={[styles.tabText, activeTab === 'ELITE' ? { color: theme.isDark ? '#000' : '#FFF' } : { color: theme.textSecondary }]}>BASE ELITE</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            <TouchableOpacity 
                                style={[styles.catSelector, { backgroundColor: theme.surface, marginBottom: (selectedCat !== 'TODOS' && subCategoriesMap[selectedCat]) ? 10 : 20 }]}
                                onPress={() => setCatModalVisible(true)}
                            >
                                <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
                                    <View style={[styles.filterIconBox, { backgroundColor: theme.accent + '20' }]}>
                                        <MaterialCommunityIcons name="filter-variant" size={18} color={theme.accent} />
                                    </View>
                                    <Text style={[styles.catSelectorVal, { color: theme.text }]}>{selectedCat.toUpperCase()}</Text>
                                </View>
                                <MaterialCommunityIcons name="chevron-down" size={24} color={theme.textSecondary} />
                            </TouchableOpacity>

                            {selectedCat !== 'TODOS' && subCategoriesMap[selectedCat] && (
                                <View style={{ marginBottom: 20 }}>
                                    <TouchableOpacity 
                                        style={[styles.catSelector, { backgroundColor: theme.surface, paddingVertical: 12, borderRadius: showSubCatDropdown ? 20 : 20, borderBottomLeftRadius: showSubCatDropdown ? 8 : 20, borderBottomRightRadius: showSubCatDropdown ? 8 : 20 }]}
                                        onPress={() => setShowSubCatDropdown(!showSubCatDropdown)}
                                    >
                                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                                            <MaterialCommunityIcons name="subdirectory-arrow-right" size={20} color={theme.textSecondary} />
                                            <Text style={[styles.catSelectorVal, { color: theme.text, fontSize: 13 }]}>
                                                {selectedSubCat === 'Todos' ? 'TODAS AS SUBCATEGORIAS' : selectedSubCat.toUpperCase()}
                                            </Text>
                                        </View>
                                        <MaterialCommunityIcons name={showSubCatDropdown ? "chevron-up" : "chevron-down"} size={22} color={theme.textSecondary} />
                                    </TouchableOpacity>

                                    {showSubCatDropdown && (
                                        <View style={{ backgroundColor: theme.surface, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, padding: 12, marginTop: -8, paddingTop: 16 }}>
                                            {subCategoriesMap[selectedCat].map(sub => {
                                                const isSelected = selectedSubCat === sub;
                                                return (
                                                    <TouchableOpacity 
                                                        key={sub}
                                                        style={{ padding: 14, borderRadius: 12, backgroundColor: isSelected ? theme.accent + '15' : 'transparent', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
                                                        onPress={() => { setSelectedSubCat(sub); setShowSubCatDropdown(false); }}
                                                    >
                                                        <Text style={{ color: isSelected ? theme.accent : theme.text, fontWeight: isSelected ? '800' : '600', fontSize: 14 }}>{sub}</Text>
                                                        {isSelected && <MaterialCommunityIcons name="check-circle" size={18} color={theme.accent} />}
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </View>
                                    )}
                                </View>
                            )}

                            {/* 🔥 BANNER MANTIDO EXATAMENTE IGUAL 🔥 */}
                            <View style={{ marginBottom: 20, borderRadius: 24, overflow: 'hidden', height: 220, backgroundColor: '#000000', elevation: 5, shadowColor: '#000', shadowOffset: {width: 0, height: 10}, shadowOpacity: 0.2, shadowRadius: 15 }}>
                                <Image 
                                    source={{ uri: categoryCovers[selectedCat] || categoryCovers["TODOS"] }} 
                                    style={{ width: '100%', height: '100%', resizeMode: 'contain', position: 'absolute' }}
                                />
                                
                                <LinearGradient 
                                    colors={['#000000', 'transparent', 'transparent', '#000000']} 
                                    locations={[0, 0.25, 0.75, 1]}
                                    start={{ x: 0, y: 0 }} 
                                    end={{ x: 1, y: 0 }} 
                                    style={StyleSheet.absoluteFill}
                                />

                                <LinearGradient 
                                    colors={['transparent', 'rgba(0,0,0,0.9)']} 
                                    locations={[0.5, 1]}
                                    style={StyleSheet.absoluteFill}
                                />

                                <View style={[styles.coverOverlay, { backgroundColor: 'transparent' }]}>
                                    <Text style={styles.coverTitle}>{selectedCat.toUpperCase()}</Text>
                                    <View style={[styles.coverBadge, { backgroundColor: theme.accent }]}>
                                        <Text style={[styles.coverCount, { color: theme.isDark ? '#000' : '#FFF' }]}>{displayList.length} EXERCÍCIOS</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    }
                    ListEmptyComponent={loading ? renderSkeleton() : renderEmptyState()}
                    renderItem={({ item }) => (
                        <ExerciseCard item={item} width={itemWidth} theme={theme} onPress={openVideoPreview} onEdit={handleEdit} onDelete={handleDelete} />
                    )}
                />

                <View style={{ width: '100%', alignItems: 'center' }}>
                    <View style={[styles.footerBar, { width: '100%', maxWidth: containerWidth, backgroundColor: theme.bg }]}>
                        <TouchableOpacity style={[styles.btnPremium, { backgroundColor: theme.accent }]} onPress={handleAddNew}>
                            <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10}}>
                                <MaterialCommunityIcons name="plus" size={24} color={theme.isDark ? '#000' : '#FFF'} />
                                <Text style={[styles.btnTextPremium, { color: theme.isDark ? '#000' : '#FFF' }]}>NOVO EXERCÍCIO</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <CategoryFilterModal visible={catModalVisible} onClose={() => setCatModalVisible(false)} selectedCat={selectedCat} onSelect={(cat) => { setSelectedCat(cat); setSelectedSubCat('Todos'); }} theme={theme} />
            <ExerciseFormModal visible={formModalVisible} onClose={() => setFormModalVisible(false)} initialData={editingExercise} onSaveSuccess={onSaveSuccess} theme={theme} />
            <VideoPreviewModal visible={videoModalVisible} videoUrl={currentVideoUrl} onClose={() => { setVideoModalVisible(false); setCurrentVideoUrl(''); }} theme={theme} />
            <BulkContentModal visible={bulkContentModalVisible} onClose={() => setBulkContentModalVisible(false)} theme={theme} />
        </RootComponent>
    );
}

const styles = StyleSheet.create({
    header: { paddingBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    headerTitle: { fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
    headerSubtitle: { color: '#888', fontSize: 11, letterSpacing: 1.5, fontWeight: '800' },
    iconBtn: { padding: 12, borderRadius: 16 },
    searchBox: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingHorizontal: 20, height: 60, borderRadius: 20 },
    searchInput: { flex: 1, marginLeft: 12, fontSize: 16, fontWeight: '600', outlineStyle: 'none' },
    
    tabContainer: { flexDirection: 'row', borderRadius: 16, padding: 4, marginBottom: 20 },
    tabBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
    tabText: { fontWeight: '900', fontSize: 13, letterSpacing: 0.5 },

    catSelector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderRadius: 20 },
    filterIconBox: { padding: 6, borderRadius: 8 },
    catSelectorVal: { fontSize: 15, fontWeight: '800' },
    coverOverlay: { padding: 24, height: '100%', justifyContent: 'flex-end', borderRadius: 24 },
    coverTitle: { color: '#FFF', fontSize: 34, fontWeight: '900', letterSpacing: -1, marginBottom: 8 },
    coverBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    coverCount: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
    footerBar: { padding: 20, paddingBottom: Platform.OS === 'ios' ? 30 : 20 },
    btnPremium: { padding: 20, borderRadius: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: {width: 0, height: 8}, shadowOpacity: 0.2, shadowRadius: 12, elevation: 5 },
    btnTextPremium: { fontWeight: '900', fontSize: 16, letterSpacing: 0.5 },

    skeletonCard: { flexDirection: 'row', padding: 14, borderRadius: 20, marginBottom: 14, opacity: 0.7 },
    skeletonThumb: { width: 70, height: 70, borderRadius: 16, marginRight: 16 },

    emptyStateContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 20 },
    emptyStateIconBox: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
    emptyStateTitle: { fontSize: 20, fontWeight: '900', marginBottom: 10, textAlign: 'center' },
    emptyStateSub: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 30 },
    clearFilterBtn: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16 },
    clearFilterText: { fontSize: 14, fontWeight: '900', letterSpacing: 0.5 }
});