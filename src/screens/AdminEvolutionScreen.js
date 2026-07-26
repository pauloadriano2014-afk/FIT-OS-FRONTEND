// src/screens/AdminEvolutionScreen.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Dimensions, ActivityIndicator, Platform, StatusBar, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

/* 🔥 IMPORTAÇÃO DO TEMA E HOOK CUSTOMIZADO */
import { useTheme } from '../contexts/ThemeContext';
import useAdminEvolution from '../hooks/useAdminEvolution';

/* 🔥 IMPORTAÇÃO DOS GERADORES DE PDF PREMIUM */
import { generateSinglePDF } from '../utils/PdfSingleReport';
import { generateComparePDF } from '../utils/PdfCompareReport';

/* 🔥 IMPORTAÇÃO DAS ABAS MODULARIZADAS */
import AdminAssessmentTab from '../components/AdminAssessmentTab';
import AdminCheckinTab from '../components/AdminCheckinTab';
import AdminWorkoutLogsTab from '../components/AdminWorkoutLogsTab';

/* 🔥 IMPORTAÇÃO DOS MODAIS */
import AssessmentFormModal from '../components/AssessmentFormModal';
import AssessmentDetailsModal from '../modals/AssessmentDetailsModal';
import CheckinDetailsModal from '../modals/CheckinDetailsModal';

export default function AdminEvolutionScreen({ route, navigation }) {
    // 1. DADOS DO ALUNO VINDO DA NAVEGAÇÃO
    const aluno = { 
        id: route.params?.alunoId || route.params?.aluno?.id || '',
        name: route.params?.alunoName || route.params?.aluno?.name || 'ALUNO',
        birthDate: route.params?.alunoBirthDate || route.params?.aluno?.birthDate || '',
        gender: route.params?.alunoGender || route.params?.aluno?.gender || ''
    };

    const { theme } = useTheme();
    const [activeTab, setActiveTab] = useState('AVALIACAO'); 

    // 2. HOOK COM TODA A INTELIGÊNCIA E COMUNICAÇÃO COM A API
    const {
        loading,
        assessmentHistory,
        workoutLogs,
        checkinHistory,
        modalVisible, setModalVisible,
        detailsVisible, setDetailsVisible,
        selectedAssessment, setSelectedAssessment,
        checkinModalVisible, setCheckinModalVisible,
        selectedCheckin, setSelectedCheckin,
        editingId,
        method, setMethod,
        customDate,
        weight, setWeight,
        currentAge, setCurrentAge,
        currentGender, setCurrentGender,
        measures, setMeasures,
        folds, setFolds,
        photos, setPhotos,
        handleDelete,
        openDetails,
        handleDateChange,
        resetForm,
        handleEdit,
        handleSaveAssessment,
        // 🔥 geração do diagnóstico por IA 🔥
        generatingAI,
        generateAIReport,
        // 🔥 edição manual do diagnóstico por IA 🔥
        savingAIReport,
        updateAIReport
    } = useAdminEvolution(aluno);

    // 3. RESPONSIVIDADE E LARGURA DO GRÁFICO
    const isWeb = Platform.OS === 'web';
    const { width: windowWidth } = Dimensions.get('window');
    const chartWidth = isWeb && windowWidth > 768 ? 440 : windowWidth - 75; 
    
    const webOuterBg = theme.isDark ? '#0a0a0a' : '#E5E5EA';
    const RootComponent = isWeb ? View : SafeAreaView;
    const rootStyle = isWeb ? { height: '100vh', width: '100%', backgroundColor: webOuterBg } : { flex: 1, backgroundColor: theme.bg };

    // 4. FUNÇÃO DE VOLTAR
    const handleGoBack = () => {
        if (navigation.canGoBack()) navigation.goBack();
        else if (isWeb) window.history.back();
        else navigation.goBack();
    };

    // 🔥 NOVA FUNÇÃO: GERAR COMPARATIVO COM GÊNERO CORRIGIDO 🔥
    const handleGenerateComparePDF = () => {
        if (assessmentHistory && assessmentHistory.length >= 2) {
            const alunoCompleto = { ...aluno, gender: currentGender || aluno.gender };
            generateComparePDF(assessmentHistory, alunoCompleto, "Excelente evolução neste ciclo. Mantivemos a massa magra e reduzimos as medidas críticas.");
        } else {
            Alert.alert("Atenção", "É necessário ter pelo menos 2 avaliações cadastradas para gerar o Laudo Comparativo.");
        }
    };

    return (
        <RootComponent style={rootStyle}>
            <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />
            
            {/* 🔥 CONTAINER RESPONSIVO (960px NO PC) 🔥 */}
            <View style={[styles.mainContainer, { backgroundColor: theme.bg }, isWeb && { maxWidth: 960, borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border }]}>
                
                {/* CABEÇALHO */}
                <View style={[styles.header, { borderBottomColor: theme.border }]}>
                    <TouchableOpacity onPress={handleGoBack} style={{padding:5}}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color={theme.text} />
                    </TouchableOpacity>
                    
                    <Text style={[styles.headerTitle, { color: theme.text }]}>PRONTUÁRIO: <Text style={{ color: '#4DE38F' }}>{aluno.name?.split(' ')[0].toUpperCase()}</Text></Text>
                    
                    {/* BOTÃO DE LAUDO COMPARATIVO NO CABEÇALHO */}
                    <TouchableOpacity 
                        onPress={handleGenerateComparePDF} 
                        style={{padding:5}}
                        disabled={!assessmentHistory || assessmentHistory.length < 2}
                    >
                        <MaterialCommunityIcons 
                            name="file-compare" 
                            size={24} 
                            color={assessmentHistory && assessmentHistory.length >= 2 ? '#9D00FF' : theme.textSecondary} 
                        />
                    </TouchableOpacity>
                </View>

                {/* 🔥 ABAS PREMIUM (DESIGN MODERNO) 🔥 */}
                <View style={[styles.tabContainer, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderColor: theme.border }]}>
                    {['AVALIACAO', 'CHECKINS', 'FEEDBACK'].map((tab) => {
                        const labels = { 'AVALIACAO': 'AVALIAÇÃO', 'CHECKINS': 'CHECK-INS', 'FEEDBACK': 'TREINOS' };
                        const isActive = activeTab === tab;
                        return (
                            <TouchableOpacity 
                                key={tab} 
                                style={[
                                    styles.tabButton, 
                                    isActive && { backgroundColor: theme.surface, borderColor: '#4DE38F' }
                                ]} 
                                onPress={() => setActiveTab(tab)}
                            >
                                <Text style={[
                                    styles.tabText, 
                                    { color: isActive ? theme.text : theme.textSecondary }
                                ]}>
                                    {labels[tab]}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* CONTEÚDO PRINCIPAL */}
                {loading ? (
                    <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
                        <ActivityIndicator color="#4DE38F" size="large"/>
                    </View>
                ) : (
                    <View style={{ flex: 1 }}>
                        {activeTab === 'AVALIACAO' && (
                            <AdminAssessmentTab 
                                theme={theme}
                                currentAge={currentAge}
                                currentGender={currentGender}
                                assessmentHistory={assessmentHistory}
                                chartWidth={chartWidth}
                                onNewAssessment={() => { resetForm(); setModalVisible(true); }}
                                onOpenDetails={openDetails}
                                onDelete={handleDelete}
                            />
                        )}

                        {activeTab === 'CHECKINS' && (
                            <AdminCheckinTab 
                                checkinHistory={checkinHistory} 
                                theme={theme} 
                                onOpenCheckinDetails={(item) => { setSelectedCheckin(item); setCheckinModalVisible(true); }}
                            />
                        )}

                        {activeTab === 'FEEDBACK' && (
                            <AdminWorkoutLogsTab 
                                workoutLogs={workoutLogs} 
                                theme={theme} 
                            />
                        )}
                    </View>
                )}
            </View>

            {/* MODAIS GLOBAIS DA TELA */}
            <CheckinDetailsModal 
                visible={checkinModalVisible} 
                onClose={() => setCheckinModalVisible(false)} 
                theme={theme} 
                selectedCheckin={selectedCheckin} 
            />

            <AssessmentFormModal 
                visible={modalVisible} 
                onClose={() => { setModalVisible(false); resetForm(); }} 
                editingId={editingId} 
                customDate={customDate} handleDateChange={handleDateChange} 
                method={method} setMethod={setMethod} 
                weight={weight} setWeight={setWeight} 
                currentAge={currentAge} setCurrentAge={setCurrentAge} 
                currentGender={currentGender} setCurrentGender={setCurrentGender} 
                folds={folds} setFolds={setFolds} 
                measures={measures} setMeasures={setMeasures} 
                onSave={handleSaveAssessment} 
                theme={theme} isWeb={isWeb} webOuterBg={webOuterBg} 
                photos={photos} setPhotos={setPhotos} 
            />

            {/* 🔥 REPASSE DO GÊNERO CORRIGIDO PARA O LAUDO ÚNICO + IA (GERAR/EDITAR) 🔥 */}
            <AssessmentDetailsModal 
                visible={detailsVisible} 
                assessment={selectedAssessment} 
                onClose={() => setDetailsVisible(false)} 
                onEdit={() => handleEdit(selectedAssessment)} 
                onDelete={() => handleDelete(selectedAssessment?.id)} 
                onGeneratePDF={() => generateSinglePDF(selectedAssessment, { ...aluno, gender: currentGender || selectedAssessment?.user?.gender || aluno.gender })} 
                onGenerateAI={() => generateAIReport(selectedAssessment?.id)}
                generatingAI={generatingAI}
                onSaveAIReport={(payload) => updateAIReport(selectedAssessment?.id, payload)}
                savingAIReport={savingAIReport}
                theme={theme} 
            />

        </RootComponent>
    );
}

const styles = StyleSheet.create({
    mainContainer: { flex: 1, width: '100%', alignSelf: 'center' },
    header: { flexDirection:'row', alignItems:'center', padding:20, paddingTop: Platform.OS === 'android' ? 10 : 20, justifyContent:'space-between', borderBottomWidth: 1 },
    headerTitle: { fontWeight:'bold', fontSize:16 },
    
    /* 🔥 ESTILOS DAS ABAS PREMIUM 🔥 */
    tabContainer: { 
        flexDirection: 'row', 
        padding: 4, 
        borderRadius: 16, 
        marginHorizontal: 20, 
        marginBottom: 10,
        marginTop: 15,
        borderWidth: 1
    },
    tabButton: { 
        flex: 1, 
        paddingVertical: 12, 
        borderRadius: 12, 
        alignItems: 'center', 
        borderWidth: 1, 
        borderColor: 'transparent' 
    },
    tabText: { 
        fontWeight: '900', 
        fontSize: 11, 
        letterSpacing: 1 
    }
});