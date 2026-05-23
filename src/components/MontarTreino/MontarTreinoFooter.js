import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function MontarTreinoFooter({ theme, currentExercisesLength, isTemplateMode, setters }) {
    return (
        <View style={styles.listFooter}>
            {currentExercisesLength > 0 && (
                <>
                    <TouchableOpacity
                        style={[styles.addMoreBtn, { borderColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}
                        onPress={() => { 
                            setters.setIsSelectingSubstitute(false); 
                            setters.setIsSwapping(false); 
                            setters.setModalBuscaVisible(true); 
                        }}
                    >
                        <MaterialCommunityIcons name="plus" size={16} color={theme.textSecondary} />
                        <Text style={[styles.addMoreBtnText, { color: theme.textSecondary }]}>Adicionar mais exercícios</Text>
                    </TouchableOpacity>

                    {!isTemplateMode && (
                        <TouchableOpacity
                            style={[styles.saveTemplateBtn, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderColor: theme.accent + '40' }]}
                            onPress={() => setters.setModalSaveTemplateVisible(true)}
                        >
                            <MaterialCommunityIcons name="content-save-all" size={17} color={theme.accent} />
                            <Text style={[styles.saveTemplateBtnText, { color: theme.accent }]}>Salvar como template</Text>
                        </TouchableOpacity>
                    )}
                </>
            )}
            <View style={{ height: 120 }} />
        </View>
    );
}

const styles = StyleSheet.create({
    listFooter: {
        width: '100%',
        paddingHorizontal: 16,
        marginTop: 10,
    },
    addMoreBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
        borderWidth: 1.5,
        borderStyle: 'dashed',
        borderRadius: 14,
        marginBottom: 12,
        gap: 6,
    },
    addMoreBtnText: {
        fontWeight: '700',
        fontSize: 13,
    },
    saveTemplateBtn: {
        padding: 15,
        borderRadius: 14,
        borderWidth: 1,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 12,
    },
    saveTemplateBtnText: {
        fontWeight: '700',
        fontSize: 13,
    },
});