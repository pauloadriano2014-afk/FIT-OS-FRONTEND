import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function MontarTreinoHeader({ navigation, theme, isEditing, salvarTreinoFinal, sending, containerMaxWidth }) {
    return (
        <View style={[styles.headerContainer, { backgroundColor: theme.bg, borderBottomColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
            <View style={[styles.headerInner, { maxWidth: containerMaxWidth }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: theme.surface }]}>
                    <MaterialCommunityIcons name="arrow-left" size={22} color={theme.text} />
                </TouchableOpacity>

                <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
                    {isEditing ? 'Editar Rotina' : 'Nova Rotina'}
                </Text>

                <TouchableOpacity
                    onPress={salvarTreinoFinal} 
                    disabled={sending}
                    style={[styles.saveBtn, { backgroundColor: sending ? theme.border : theme.accent }]}
                >
                    {sending ? (
                        <ActivityIndicator color={theme.isDark ? '#000' : '#FFF'} size="small" />
                    ) : (
                        <Text style={[styles.saveBtnText, { color: theme.isDark ? '#000' : '#FFF' }]}>SALVAR</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    headerContainer: {
        width: '100%',
        alignItems: 'center',
        borderBottomWidth: 1,
        zIndex: 10,
    },
    headerInner: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        flex: 1,
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 0.3,
    },
    saveBtn: {
        paddingHorizontal: 18,
        paddingVertical: 9,
        borderRadius: 20,
        minWidth: 80,
        alignItems: 'center',
    },
    saveBtnText: {
        fontWeight: '900',
        fontSize: 12,
        letterSpacing: 0.5,
    },
});