import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function MagicSyncButton({ theme, isTemplateMode, currentExercisesLength, handleMagicSync, isSyncingCargas }) {
    if (isTemplateMode || currentExercisesLength === 0) return null;

    return (
        <TouchableOpacity 
            style={[styles.magicSyncBtn, { backgroundColor: theme.surface, borderColor: theme.accent }]} 
            onPress={handleMagicSync}
            disabled={isSyncingCargas}
        >
            {isSyncingCargas ? (
                <ActivityIndicator size="small" color={theme.accent} />
            ) : (
                <>
                    <MaterialCommunityIcons name="magic-staff" size={20} color={theme.accent} />
                    <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={[styles.magicSyncTitle, { color: theme.accent }]}>PUXAR CARGAS DO ALUNO</Text>
                        <Text style={styles.magicSyncDesc}>Preenche o peso de todos os exercícios deste dia.</Text>
                    </View>
                </>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    magicSyncBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        marginTop: 10,
        marginBottom: 10,
    },
    magicSyncTitle: {
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    magicSyncDesc: {
        fontSize: 10,
        color: '#888',
        marginTop: 2,
    },
});