// src/components/MontarTreino/FloatingMenu.js
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function FloatingMenu({ theme, windowWidth, onAddExercise, onImportPDF, onOpenBases, onClone, onSaveBase, onDownloadPDF }) {
    const isMobile = Platform.OS === 'web' && windowWidth <= 768;

    // Cor adaptada ao tema
    const menuBg = theme.isDark ? '#1C1C1E' : '#FFFFFF';
    const dividerColor = theme.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';
    const menuShadow = theme.isDark
        ? '0 8px 32px rgba(0,0,0,0.5)'
        : '0 8px 32px rgba(0,0,0,0.15)';

    const items = [
        { icon: 'plus-box-multiple', label: 'Exercício',   color: theme.text,   onPress: onAddExercise },
        { icon: 'file-pdf-box',      label: 'MFIT',        color: theme.text,   onPress: onImportPDF },
        { icon: 'folder-download',   label: 'Bases',       color: theme.text,   onPress: onOpenBases },
        { icon: 'account-switch',    label: 'Clonar',      color: theme.text,   onPress: onClone },
        { icon: 'content-save-cog',  label: 'Salvar Base', color: theme.text,   onPress: onSaveBase },
        { icon: 'file-pdf-box',      label: 'Baixar PDF',  color: theme.accent, onPress: onDownloadPDF },
    ];

    const renderItems = () => items.map((item, i) => (
        <React.Fragment key={i}>
            {i > 0 && <View style={[S.divider, { backgroundColor: dividerColor }]} />}
            <TouchableOpacity style={S.item} onPress={item.onPress}>
                <MaterialCommunityIcons name={item.icon} size={22} color={item.color} />
                <Text style={[S.label, { color: item.color }]}>{item.label}</Text>
            </TouchableOpacity>
        </React.Fragment>
    ));

    const containerStyle = Platform.OS === 'web' ? {
        position: 'fixed',
        bottom: 30,
        left: '50%',
        transform: 'translateX(-50%)',
        borderRadius: 30,
        zIndex: 9999,
        backgroundColor: menuBg,
        boxShadow: menuShadow,
        borderWidth: theme.isDark ? 0 : 1,
        borderColor: 'rgba(0,0,0,0.06)',
    } : {
        position: 'absolute',
        bottom: 20,
        alignSelf: 'center',
        borderRadius: 30,
        zIndex: 9999,
        elevation: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: theme.isDark ? 0.4 : 0.15,
        shadowRadius: 16,
        backgroundColor: menuBg,
    };

    return (
        <View style={containerStyle}>
            {isMobile ? (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={S.scrollContent}
                    style={{ borderRadius: 30 }}
                    bounces={true}
                >
                    {renderItems()}
                </ScrollView>
            ) : (
                <View style={S.desktopRow}>
                    {renderItems()}
                </View>
            )}
        </View>
    );
}

const S = StyleSheet.create({
    desktopRow: {
        flexDirection: 'row',
        paddingHorizontal: 18,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    scrollContent: {
        flexDirection: 'row',
        paddingHorizontal: 18,
        paddingVertical: 12,
        alignItems: 'center',
        gap: 4,
        paddingRight: 28,
    },
    item: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 14,
        paddingVertical: 4,
    },
    label: {
        fontSize: 10,
        fontWeight: '800',
        marginTop: 5,
        ...(Platform.OS === 'web' ? { whiteSpace: 'nowrap' } : {}),
    },
    divider: {
        width: 1,
        height: 26,
        marginHorizontal: 2,
    },
});