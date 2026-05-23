import React from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AdminStudentCard from './AdminStudentCard';

export default function TabAlunos({
    theme, navigation, search, setSearch, setFilterModalVisible, activeFiltersCount,
    subTabAlunos, switchSubTab, displayList, visibleCount, setVisibleCount, setInviteModalVisible
}) {
    return (
        <>
            <TouchableOpacity style={[styles.inviteBtn, { backgroundColor: theme.accent }]} onPress={() => setInviteModalVisible(true)}>
                <MaterialCommunityIcons name="star-shooting" size={18} color={theme.isDark ? '#000' : '#FFF'} />
                <Text style={[styles.inviteBtnText, { color: theme.isDark ? '#000' : '#FFF' }]}>GERAR LINK DE CADASTRO</Text>
            </TouchableOpacity>

            <TextInput 
                style={[styles.searchBar, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} 
                placeholder="Buscar aluno..." 
                placeholderTextColor={theme.textSecondary} 
                value={search} 
                onChangeText={setSearch} 
            />

            <TouchableOpacity style={[styles.filterSelector, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => setFilterModalVisible(true)}>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                    <MaterialCommunityIcons name="filter-variant" size={18} color={theme.accent} />
                    <Text style={[styles.filterSelectorVal, { color: theme.text }]}>
                        FILTROS ATIVOS: {activeFiltersCount === 0 ? 'Nenhum' : activeFiltersCount}
                    </Text>
                </View>
                <MaterialCommunityIcons name="chevron-down" size={20} color={theme.textSecondary} />
            </TouchableOpacity>

            <View style={styles.subTabsContainer}>
                <TouchableOpacity style={[styles.subTab, subTabAlunos === 'ATIVOS' ? { backgroundColor: theme.surface, borderColor: theme.border } : { borderColor: 'transparent' }]} onPress={() => switchSubTab('ATIVOS')}>
                    <Text style={[styles.subTabText, { color: subTabAlunos === 'ATIVOS' ? theme.text : theme.textSecondary }]}>ATIVOS ({displayList.length})</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.subTab, subTabAlunos === 'INATIVOS' ? { backgroundColor: theme.surface, borderColor: theme.border } : { borderColor: 'transparent' }]} onPress={() => switchSubTab('INATIVOS')}>
                    <Text style={[styles.subTabText, { color: subTabAlunos === 'INATIVOS' ? '#FF4444' : theme.textSecondary }]}>INATIVOS</Text>
                </TouchableOpacity>
            </View>

            {displayList.length === 0 ? (
                <Text style={styles.empty}>Nenhum aluno encontrado neste filtro.</Text>
            ) : (
                displayList.slice(0, visibleCount).map(item => (
                    <View key={item.id} style={{ width: '100%', marginBottom: 15 }}>
                        <AdminStudentCard item={item} theme={theme} navigation={navigation} isHeadCoach={true} />
                    </View>
                ))
            )}

            {visibleCount < displayList.length && (
                <TouchableOpacity style={[styles.loadMoreBtn, { borderColor: theme.accent, backgroundColor: theme.accent + '15' }]} onPress={() => setVisibleCount(p => p + 15)}>
                    <Text style={[styles.loadMoreText, { color: theme.accent }]}>CARREGAR MAIS</Text>
                </TouchableOpacity>
            )}
        </>
    );
}

const styles = StyleSheet.create({
    inviteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 15, padding: 14, borderRadius: 14, gap: 8 },
    inviteBtnText: { fontWeight: '900', fontSize: 13, letterSpacing: 0.5 },
    searchBar: { padding: 14, borderRadius: 12, marginBottom: 15, borderWidth: 1, outlineStyle: 'none', fontSize: 16 },
    filterSelector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, borderWidth: 1, marginBottom: 15 },
    filterSelectorVal: { fontSize: 12, fontWeight: '800' },
    subTabsContainer: { flexDirection: 'row', marginBottom: 15, gap: 10 },
    subTab: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center' }, 
    subTabText: { fontSize: 11, fontWeight: '800' },
    empty: { color: '#888', textAlign: 'center', marginTop: 50, fontWeight: '600' },
    loadMoreBtn: { padding: 16, marginVertical: 20, borderRadius: 14, borderWidth: 1, alignItems: 'center' },
    loadMoreText: { fontWeight: '900', fontSize: 12, letterSpacing: 1 }
});