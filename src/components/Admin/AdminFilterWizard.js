import React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function AdminFilterWizard({
    theme, filterModalVisible, setFilterModalVisible, filterStep, setFilterStep,
    filterStatus, setFilterStatus, filterIntensidade, setFilterIntensidade, filterPlano, setFilterPlano,
    OPT_STATUS, OPT_INTENSIDADE, OPT_PLANOS
}) {
    return (
        <Modal visible={filterModalVisible} transparent animationType="fade" onRequestClose={() => setFilterModalVisible(false)}>
            <View style={styles.modalBackdropFiltro}>
                <View style={[styles.catModalContent, { backgroundColor: theme.surface, borderColor: theme.border }]}>

                    <View style={styles.wizardHeader}>
                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                            <TouchableOpacity 
                                onPress={() => filterStep > 1 ? setFilterStep(filterStep - 1) : setFilterModalVisible(false)}
                                style={[styles.wizardBackBtn, { backgroundColor: theme.bg }]}
                            >
                                <MaterialCommunityIcons name={filterStep > 1 ? "arrow-left" : "close"} size={20} color={theme.text} />
                            </TouchableOpacity>
                            <View>
                                <Text style={[styles.wizardStepText, { color: theme.accent }]}>PASSO {filterStep} DE 3</Text>
                                <Text style={[styles.wizardTitle, { color: theme.text }]}>
                                    {filterStep === 1 ? 'Qual o Status?' : filterStep === 2 ? 'Qual a Intensidade?' : 'Qual o Plano?'}
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={() => { setFilterStatus('TODOS'); setFilterIntensidade('TODOS'); setFilterPlano('TODOS'); setFilterStep(1); setFilterModalVisible(false); }}>
                            <Text style={{color: '#FF3B30', fontSize: 10, fontWeight: '900'}}>RESETAR</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>

                        {filterStep === 1 && OPT_STATUS.map((opt) => (
                            <TouchableOpacity 
                                key={opt.id} 
                                style={[styles.wizardOption, { backgroundColor: theme.bg, borderColor: filterStatus === opt.id ? theme.accent : theme.border }]} 
                                onPress={() => { setFilterStatus(opt.id); setFilterStep(2); }}
                            >
                                <Text style={[styles.wizardOptionText, { color: filterStatus === opt.id ? theme.accent : theme.text }]}>{opt.label.toUpperCase()}</Text>
                                <MaterialCommunityIcons name={filterStatus === opt.id ? "check-circle" : "chevron-right"} size={20} color={filterStatus === opt.id ? theme.accent : theme.border} />
                            </TouchableOpacity>
                        ))}

                        {filterStep === 2 && OPT_INTENSIDADE.map((opt) => (
                            <TouchableOpacity 
                                key={opt.id} 
                                style={[styles.wizardOption, { backgroundColor: theme.bg, borderColor: filterIntensidade === opt.id ? theme.accent : theme.border }]} 
                                onPress={() => { setFilterIntensidade(opt.id); setFilterStep(3); }}
                            >
                                <Text style={[styles.wizardOptionText, { color: filterIntensidade === opt.id ? theme.accent : theme.text }]}>{opt.label.toUpperCase()}</Text>
                                <MaterialCommunityIcons name={filterIntensidade === opt.id ? "check-circle" : "chevron-right"} size={20} color={filterIntensidade === opt.id ? theme.accent : theme.border} />
                            </TouchableOpacity>
                        ))}

                        {filterStep === 3 && OPT_PLANOS.map((opt) => (
                            <TouchableOpacity 
                                key={opt.id} 
                                style={[styles.wizardOption, { backgroundColor: theme.bg, borderColor: filterPlano === opt.id ? theme.accent : theme.border }]} 
                                onPress={() => { 
                                    setFilterPlano(opt.id); 
                                    setFilterModalVisible(false); 
                                    setFilterStep(1); 
                                }}
                            >
                                <Text style={[styles.wizardOptionText, { color: filterPlano === opt.id ? theme.accent : theme.text }]}>{opt.label.toUpperCase()}</Text>
                                <MaterialCommunityIcons name={filterPlano === opt.id ? "check-bold" : "chevron-right"} size={20} color={filterPlano === opt.id ? theme.accent : theme.border} />
                            </TouchableOpacity>
                        ))}

                    </ScrollView>

                    <View style={styles.wizardProgress}>
                        <View style={[styles.progressDot, { backgroundColor: filterStep >= 1 ? theme.accent : theme.border }]} />
                        <View style={[styles.progressLine, { backgroundColor: filterStep >= 2 ? theme.accent : theme.border }]} />
                        <View style={[styles.progressDot, { backgroundColor: filterStep >= 2 ? theme.accent : theme.border }]} />
                        <View style={[styles.progressLine, { backgroundColor: filterStep >= 3 ? theme.accent : theme.border }]} />
                        <View style={[styles.progressDot, { backgroundColor: filterStep >= 3 ? theme.accent : theme.border }]} />
                    </View>

                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalBackdropFiltro: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: 20 },
    catModalContent: { width: '100%', maxWidth: 450, alignSelf: 'center', borderRadius: 24, padding: 25, borderWidth: 1, maxHeight: '80%' },
    wizardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 25 },
    wizardBackBtn: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(128,128,128,0.2)' },
    wizardStepText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
    wizardTitle: { fontSize: 18, fontWeight: '900', marginTop: 2 },
    wizardOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderRadius: 16, marginBottom: 10, borderWidth: 2 },
    wizardOptionText: { fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
    wizardProgress: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20 },
    progressDot: { width: 10, height: 10, borderRadius: 5 },
    progressLine: { width: 30, height: 2, marginHorizontal: 5 },
});