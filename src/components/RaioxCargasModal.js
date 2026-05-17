// src/modals/RaioxCargasModal.js

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Modal, Alert, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart } from 'react-native-gifted-charts';

const getRpeColor = (rpeValue) => {
    if (!rpeValue) return '#888';
    if (rpeValue >= 9) return '#FF3B30'; 
    if (rpeValue >= 7) return '#FF9500'; 
    if (rpeValue >= 5) return '#FFCC00'; 
    return '#32ADE6'; 
};

export default function RaioxCargasModal({ visible, onClose, historicoDeCargasList, theme }) {
    const [raioxSearch, setRaioxSearch] = useState('');
    const [raioxProgram, setRaioxProgram] = useState('TODOS');
    const [raioxDay, setRaioxDay] = useState('TODOS');
    const [showRaioxProgramDrop, setShowRaioxProgramDrop] = useState(false);
    const [showRaioxDayDrop, setShowRaioxDayDrop] = useState(false);
    const [expandedExercises, setExpandedExercises] = useState({});

    useEffect(() => {
        if (visible) {
            setRaioxSearch('');
            setRaioxProgram('TODOS');
            setRaioxDay('TODOS');
            setExpandedExercises({});
            setShowRaioxProgramDrop(false);
            setShowRaioxDayDrop(false);
        }
    }, [visible]);

    const toggleAccordion = (exName) => setExpandedExercises(prev => ({ ...prev, [exName]: !prev[exName] }));

    const handleShareReport = (exName) => {
        const msg = `Tire um print (captura de tela) desta aba com o gráfico aberto para enviar a evolução de ${exName} para o aluno.`;
        if (Platform.OS === 'web') {
            window.alert(`📸 Relatório Pronto!\n\n${msg}`);
        } else {
            Alert.alert("📸 Relatório Pronto!", msg);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' }}>
                <View style={{ width: '100%', maxWidth: 600, alignSelf: 'center', height: '90%', backgroundColor: theme.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: theme.border }}>
                    
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: theme.border }}>
                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                            <MaterialCommunityIcons name="weight-lifter" size={24} color={theme.accent} />
                            <Text style={{ fontSize: 16, fontWeight: '900', color: theme.text, letterSpacing: 0.5 }}>RAIO-X DE CARGAS E EVOLUÇÃO</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={{padding: 5}}>
                            <MaterialCommunityIcons name="close" size={24} color={theme.text}/>
                        </TouchableOpacity>
                    </View>

                    <View style={{ padding: 20, borderBottomWidth: 1, borderColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', zIndex: 10 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.bg, borderRadius: 12, borderWidth: 1, borderColor: theme.border, paddingHorizontal: 12, marginBottom: 15 }}>
                            <MaterialCommunityIcons name="magnify" size={20} color={theme.textSecondary} />
                            <TextInput 
                                style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 8, color: theme.text, fontWeight: 'bold', outlineStyle: 'none' }}
                                placeholder="Buscar exercício (Ex: Puxada)"
                                placeholderTextColor={theme.textSecondary}
                                value={raioxSearch}
                                onChangeText={setRaioxSearch}
                            />
                            {raioxSearch.length > 0 && <TouchableOpacity onPress={() => setRaioxSearch('')}><MaterialCommunityIcons name="close-circle" size={18} color={theme.textSecondary} /></TouchableOpacity>}
                        </View>
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            {(() => {
                                const programasDisponiveis = Array.from(new Set(historicoDeCargasList.map(i => i.programName))).sort();
                                const diasDisponiveis = Array.from(new Set(historicoDeCargasList.filter(i => raioxProgram === 'TODOS' || i.programName === raioxProgram).map(i => i.dayName))).sort();

                                return (
                                    <>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontSize: 10, fontWeight: '900', color: '#888', marginBottom: 6 }}>PERIODIZAÇÃO</Text>
                                            <TouchableOpacity style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: theme.bg, borderRadius: 10, borderWidth: 1, borderColor: theme.border }} onPress={() => { setShowRaioxProgramDrop(!showRaioxProgramDrop); setShowRaioxDayDrop(false); }}>
                                                <Text style={{color: theme.text, fontSize: 11, fontWeight: 'bold'}} numberOfLines={1}>{raioxProgram}</Text>
                                                <MaterialCommunityIcons name={showRaioxProgramDrop ? "chevron-up" : "chevron-down"} size={16} color={theme.textSecondary} />
                                            </TouchableOpacity>
                                            {showRaioxProgramDrop && (
                                                <ScrollView style={{ position: 'absolute', top: 60, left: 0, right: 0, maxHeight: 200, backgroundColor: theme.surface, borderRadius: 10, borderWidth: 1, borderColor: theme.border, zIndex: 20 }}>
                                                    <TouchableOpacity style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: theme.border }} onPress={() => { setRaioxProgram('TODOS'); setRaioxDay('TODOS'); setShowRaioxProgramDrop(false); }}>
                                                        <Text style={{color: raioxProgram === 'TODOS' ? theme.accent : theme.text, fontWeight: 'bold', fontSize: 11}}>TODOS</Text>
                                                    </TouchableOpacity>
                                                    {programasDisponiveis.map(prog => (
                                                        <TouchableOpacity key={prog} style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: theme.border }} onPress={() => { setRaioxProgram(prog); setRaioxDay('TODOS'); setShowRaioxProgramDrop(false); }}>
                                                            <Text style={{color: raioxProgram === prog ? theme.accent : theme.text, fontWeight: raioxProgram === prog ? 'bold' : 'normal', fontSize: 11}}>{prog}</Text>
                                                        </TouchableOpacity>
                                                    ))}
                                                </ScrollView>
                                            )}
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontSize: 10, fontWeight: '900', color: '#888', marginBottom: 6 }}>DIA DE TREINO</Text>
                                            <TouchableOpacity style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: theme.bg, borderRadius: 10, borderWidth: 1, borderColor: theme.border }} onPress={() => { setShowRaioxDayDrop(!showRaioxDayDrop); setShowRaioxProgramDrop(false); }}>
                                                <Text style={{color: theme.text, fontSize: 11, fontWeight: 'bold'}} numberOfLines={1}>{raioxDay}</Text>
                                                <MaterialCommunityIcons name={showRaioxDayDrop ? "chevron-up" : "chevron-down"} size={16} color={theme.textSecondary} />
                                            </TouchableOpacity>
                                            {showRaioxDayDrop && (
                                                <ScrollView style={{ position: 'absolute', top: 60, left: 0, right: 0, maxHeight: 200, backgroundColor: theme.surface, borderRadius: 10, borderWidth: 1, borderColor: theme.border, zIndex: 20 }}>
                                                    <TouchableOpacity style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: theme.border }} onPress={() => { setRaioxDay('TODOS'); setShowRaioxDayDrop(false); }}>
                                                        <Text style={{color: raioxDay === 'TODOS' ? theme.accent : theme.text, fontWeight: 'bold', fontSize: 11}}>TODOS</Text>
                                                    </TouchableOpacity>
                                                    {diasDisponiveis.map(dia => (
                                                        <TouchableOpacity key={dia} style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: theme.border }} onPress={() => { setRaioxDay(dia); setShowRaioxDayDrop(false); }}>
                                                            <Text style={{color: raioxDay === dia ? theme.accent : theme.text, fontWeight: raioxDay === dia ? 'bold' : 'normal', fontSize: 11}}>{dia}</Text>
                                                        </TouchableOpacity>
                                                    ))}
                                                </ScrollView>
                                            )}
                                        </View>
                                    </>
                                );
                            })()}
                        </View>
                    </View>
                    
                    <ScrollView contentContainerStyle={{padding: 20}} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                        {(() => {
                            let filtrados = historicoDeCargasList;
                            if (raioxProgram !== 'TODOS') filtrados = filtrados.filter(i => i.programName === raioxProgram);
                            if (raioxDay !== 'TODOS') filtrados = filtrados.filter(i => i.dayName === raioxDay);
                            if (raioxSearch.trim() !== '') {
                                const searchLower = raioxSearch.toLowerCase();
                                filtrados = filtrados.filter(i => i.exerciseName.toLowerCase().includes(searchLower));
                            }

                            if (filtrados.length === 0) {
                                return (
                                    <View style={{ alignItems:'center', padding: 30, borderStyle:'dashed', borderWidth:1, borderColor: theme.border, borderRadius:10 }}>
                                        <MaterialCommunityIcons name="text-box-search-outline" size={40} color={theme.textSecondary} style={{opacity: 0.5}} />
                                        <Text style={{ color: '#888', textAlign: 'center', fontStyle: 'italic', marginTop: 10 }}>Nenhuma carga encontrada para estes filtros.</Text>
                                    </View>
                                );
                            }

                            const agrupado = {};
                            filtrados.forEach(item => {
                                if (!agrupado[item.exerciseName]) agrupado[item.exerciseName] = [];
                                agrupado[item.exerciseName].push(item);
                            });

                            const chavesOrdenadas = Object.keys(agrupado).sort((a, b) => {
                                const orderA = agrupado[a][0].orderIndex;
                                const orderB = agrupado[b][0].orderIndex;
                                if (orderA !== orderB) return orderA - orderB;
                                return a.localeCompare(b);
                            });

                            return chavesOrdenadas.map((exName, index) => {
                                const historyEntries = agrupado[exName];
                                const pr = Math.max(...historyEntries.map(i => i.maxWeight));
                                const isExpanded = !!expandedExercises[exName];
                                
                                const isCardio = historyEntries[0]?.isCardio || false;
                                const unit = isCardio ? ' min' : 'kg';

                                const chartData = historyEntries.slice().reverse().map(entry => ({
                                    value: entry.maxWeight,
                                    label: entry.dateFormatted.substring(0, 5),
                                    dataPointText: `${entry.maxWeight}${unit}`,
                                }));

                                return (
                                    <View key={index} style={{ marginBottom: 15, backgroundColor: theme.bg, borderRadius: 14, borderWidth: 1, borderColor: theme.border, overflow: 'hidden' }}>
                                        <TouchableOpacity 
                                            style={{ padding: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: isExpanded ? theme.surface : theme.bg }}
                                            onPress={() => toggleAccordion(exName)}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={{ color: theme.accent, fontSize: 16, fontWeight: '900', flex: 1, paddingRight: 10 }}>{exName}</Text>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                                <View style={{ backgroundColor: theme.accent + '20', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                                                    <Text style={{ color: theme.accent, fontSize: 12, fontWeight: '900' }}>{isCardio ? `Máx: ${pr} min` : `PR: ${pr}kg`}</Text>
                                                </View>
                                                <MaterialCommunityIcons name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color={theme.textSecondary} />
                                            </View>
                                        </TouchableOpacity>
                                        
                                        {isExpanded && (
                                            <View style={{ padding: 18, borderTopWidth: 1, borderColor: theme.border }}>
                                                
                                                {chartData.length > 1 && !isCardio && (
                                                    <View style={{ marginBottom: 25, alignItems: 'center', backgroundColor: theme.surface, paddingVertical: 15, borderRadius: 12, borderWidth: 1, borderColor: theme.border }}>
                                                        <Text style={{ color: theme.textSecondary, fontSize: 10, fontWeight: 'bold', marginBottom: 10, letterSpacing: 1 }}>CURVA DE PROGRESSÃO</Text>
                                                        <LineChart
                                                            data={chartData}
                                                            height={120}
                                                            width={260}
                                                            spacing={55}
                                                            initialSpacing={20}
                                                            color={theme.accent}
                                                            thickness={3}
                                                            dataPointsColor={theme.accent}
                                                            textFontSize={10}
                                                            textColor={theme.text}
                                                            yAxisColor={theme.border}
                                                            xAxisColor={theme.border}
                                                            yAxisTextStyle={{color: theme.textSecondary, fontSize: 9}}
                                                            xAxisLabelTextStyle={{color: theme.textSecondary, fontSize: 9}}
                                                            hideRules
                                                            isAnimated
                                                            yAxisLabelWidth={30}
                                                            maxValue={pr > 0 ? Math.ceil(pr * 1.4) : 10} 
                                                            textShiftY={-10}
                                                            noOfSections={4} 
                                                        />
                                                    </View>
                                                )}

                                                {!isCardio && (
                                                    <TouchableOpacity 
                                                        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.accent, padding: 12, borderRadius: 10, marginBottom: 20 }}
                                                        onPress={() => handleShareReport(exName)}
                                                    >
                                                        <MaterialCommunityIcons name="share-variant" size={18} color="#000" />
                                                        <Text style={{ color: '#000', fontWeight: '900', fontSize: 12, letterSpacing: 0.5 }}>COMPARTILHAR EVOLUÇÃO</Text>
                                                    </TouchableOpacity>
                                                )}

                                                <Text style={{ color: theme.textSecondary, fontSize: 10, fontWeight: 'bold', marginBottom: 15, letterSpacing: 1 }}>HISTÓRICO DETALHADO</Text>

                                                {historyEntries.map((item, hIdx) => {
                                                    return (
                                                        <View key={hIdx} style={{ marginBottom: hIdx === historyEntries.length - 1 ? 0 : 20, backgroundColor: theme.bg, padding: 15, borderRadius: 12, borderWidth: 1, borderColor: theme.border }}>
                                                            
                                                            {/* 🔥 CORREÇÃO DE OURO: flexShrink: 0 NO RPE, flex: 1 NO TEXTO. VAZAMENTO OBLITERADO 🔥 */}
                                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' }}>
                                                                <View style={{ flex: 1, paddingRight: 12 }}>
                                                                    <Text style={{ color: theme.text, fontSize: 13, fontWeight: 'bold' }}>{item.dateFormatted}</Text>
                                                                    <Text style={{ color: theme.textSecondary, fontSize: 11 }} numberOfLines={1} ellipsizeMode="tail">
                                                                        {item.programName} ({item.dayName})
                                                                    </Text>
                                                                </View>
                                                                
                                                                <View style={{ flexShrink: 0, backgroundColor: getRpeColor(item.rpe) + '20', borderWidth: 1, borderColor: getRpeColor(item.rpe), paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                                                    <MaterialCommunityIcons name="fire" size={12} color={getRpeColor(item.rpe)} />
                                                                    <Text style={{ color: getRpeColor(item.rpe), fontSize: 10, fontWeight: '900' }}>RPE: {item.rpe || '?'}</Text>
                                                                </View>
                                                            </View>

                                                            {!isCardio && (
                                                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: theme.surface, padding: 10, borderRadius: 8, marginBottom: 12 }}>
                                                                    <View style={{ alignItems: 'center', flex: 1, borderRightWidth: 1, borderRightColor: theme.border }}>
                                                                        <Text style={{ color: theme.textSecondary, fontSize: 9, fontWeight: 'bold' }}>TONELAGEM</Text>
                                                                        <Text style={{ color: theme.text, fontSize: 14, fontWeight: '900' }}>{item.totalVolume} kg</Text>
                                                                    </View>
                                                                    <View style={{ alignItems: 'center', flex: 1 }}>
                                                                        <Text style={{ color: theme.textSecondary, fontSize: 9, fontWeight: 'bold' }}>1RM ESTIMADO</Text>
                                                                        <Text style={{ color: theme.accent, fontSize: 14, fontWeight: '900' }}>{item.max1RM} kg</Text>
                                                                    </View>
                                                                </View>
                                                            )}

                                                            <View style={{ backgroundColor: theme.surface, borderRadius: 8, overflow: 'hidden' }}>
                                                                {item.setsData.map((setInfo, sIdx) => (
                                                                    <View key={sIdx} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, borderBottomWidth: sIdx === item.setsData.length - 1 ? 0 : 1, borderBottomColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                                                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, flexWrap: 'wrap' }}>
                                                                            <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: '900', width: 22 }}>{setInfo.setLabel}</Text>
                                                                            
                                                                            {setInfo.rawWeights.map((wVal, i) => (
                                                                                <React.Fragment key={i}>
                                                                                    {i > 0 && <Text style={{color: theme.accent, fontWeight: 'bold', fontSize: 11}}> ➔ Drop: </Text>}
                                                                                    <Text style={{ color: theme.text, fontSize: 13, fontWeight: 'bold' }}>{wVal}{unit}</Text>
                                                                                </React.Fragment>
                                                                            ))}
                                                                            {isCardio ? null : <Text style={{color: theme.textSecondary, fontWeight: 'normal'}}> x {setInfo.reps}</Text>}

                                                                        </View>
                                                                        {setInfo.technique && (
                                                                            <View style={{ backgroundColor: theme.accent + '20', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 10 }}>
                                                                                <Text style={{ color: theme.accent, fontSize: 9, fontWeight: 'bold', textTransform: 'uppercase' }}>{setInfo.technique.replace(/_/g, ' ')}</Text>
                                                                            </View>
                                                                        )}
                                                                    </View>
                                                                ))}
                                                            </View>
                                                        </View>
                                                    );
                                                })}
                                            </View>
                                        )}
                                    </View>
                                );
                            });
                        })()}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}