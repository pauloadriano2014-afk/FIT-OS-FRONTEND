// src/components/MontarTreino/FloatingMenu.js
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function FloatingMenu({ theme, windowWidth, onAddExercise, onImportPDF, onOpenBases, onClone, onSaveBase, onDownloadPDF }) {
    const isMobile = Platform.OS === 'web' && windowWidth <= 768;

    const items = [
        { icon: 'plus-box-multiple', label: 'Exercício', color: theme.text, onPress: onAddExercise },
        { icon: 'file-pdf-box',      label: 'MFIT',       color: theme.text, onPress: onImportPDF },
        { icon: 'folder-download',   label: 'Bases',      color: theme.text, onPress: onOpenBases },
        { icon: 'account-switch',    label: 'Clonar',     color: theme.text, onPress: onClone },
        { icon: 'content-save-cog',  label: 'Salvar Base',color: theme.text, onPress: onSaveBase },
        { icon: 'file-pdf-box',      label: 'Baixar PDF', color: theme.accent, onPress: onDownloadPDF },
    ];

    const renderItems = () => items.map((item, i) => (
        <React.Fragment key={i}>
            {i > 0 && <View style={[S.divider, { backgroundColor: theme.border }]} />}
            <TouchableOpacity style={S.item} onPress={item.onPress}>
                <MaterialCommunityIcons name={item.icon} size={22} color={item.color} />
                <Text style={[S.label, { color: item.color }]}>{item.label}</Text>
            </TouchableOpacity>
        </React.Fragment>
    ));

    return (
        <View style={[S.container, { backgroundColor: theme.surface }]}>
            {isMobile ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.scrollContent} style={{ width: '100%' }} bounces={true}>
                    {renderItems()}
                </ScrollView>
            ) : (
                <View style={S.desktopContainer}>
                    {renderItems()}
                </View>
            )}
        </View>
    );
}

const S = StyleSheet.create({
    container: {
        position: Platform.OS === 'web' ? 'fixed' : 'absolute',
        bottom: Platform.OS === 'web' ? 30 : 20,
        alignSelf: 'center',
        borderRadius: 30,
        width: Platform.OS === 'web' && width > 768 ? 'auto' : '95%',
        zIndex: 9999,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        backgroundColor: '#1C1C1E',
        overflow: 'hidden',
    },
    desktopContainer: { flexDirection: 'row', paddingHorizontal: 15, paddingVertical: 10, justifyContent: 'space-evenly', alignItems: 'center' },
    scrollContent:    { flexDirection: 'row', paddingHorizontal: 15, paddingVertical: 10, alignItems: 'center', paddingRight: 25 },
    item:   { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 4 },
    label:  { fontSize: 10, fontWeight: '800', marginTop: 4, whiteSpace: 'nowrap' },
    divider:{ width: 1, height: 24, marginHorizontal: 5 },
});
