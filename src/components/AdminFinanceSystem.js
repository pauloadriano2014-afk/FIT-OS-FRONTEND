// src/components/AdminFinanceSystem.js

import React from 'react';
import { View, Platform, useWindowDimensions, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Componentes Filhos
import FinanceHeaderMetrics from './AdminFinance/FinanceHeaderMetrics';
import FinanceFilters from './AdminFinance/FinanceFilters';
import FinanceStudentList from './AdminFinance/FinanceStudentList';
import FinanceEditModal from './AdminFinance/FinanceEditModal';
import FinanceAddModal from './AdminFinance/FinanceAddModal';
import FinanceChargeModal from './AdminFinance/FinanceChargeModal';
import AsaasPaymentsPanel from './AdminFinance/AsaasPaymentsPanel';
import FinanceWithdrawalPanel from './AdminFinance/FinanceWithdrawalPanel'; // 🚀 NOVO PAINEL DE SAQUE IMPORTADO

// Hook de Inteligência que modularizamos
import useAdminFinance from '../hooks/useAdminFinance';

export default function AdminFinanceSystem({ theme, alunos, coachFilter, getLogCoach }) {
    const { width } = useWindowDimensions();
    const isWebPC = Platform.OS === 'web' && width > 768;

    // Conecta toda a inteligência e variáveis do Hook Modularizado
    const {
        viewMode, setViewMode, isMaster,
        selectedMonth, setSelectedMonth, filterStatus, setFilterStatus, filterCategory, setFilterCategory,
        filterPrazo, setFilterPrazo, searchQuery, setSearchQuery,
        metrics, studentList, currentYear, loadingId, chargeAluno, setChargeAluno,
        editingAluno, contractType, setContractType, contractValue, setContractValue,
        startDateEdit, setStartDateEdit, paymentDueDate, setPaymentDueDate,
        financeCategoryEdit, setFinanceCategoryEdit, isFinanceActiveEdit, setIsFinanceActiveEdit,
        editPhotoUrl, isUploadingEditPhoto, isSavingContract,
        isAddModalVisible, setIsAddModalVisible, newPhotoUrl, uploadingPhoto,
        newName, setNewName, newPhone, setNewPhone, newCategory, setNewCategory,
        newDuration, setNewDuration, newValue, setNewValue, newStartDate, setNewStartDate,
        newDueDate, setNewDueDate, isSavingNew, totalAtivosNoMes, percRetidos, percNovos, retidosNoMes, novosNoMes,
        handleTogglePagamento, openWhatsApp, openEditModal, closeEditModal, handlePickEditImage, handlePickImage,
        handleSaveModalContract, handleReverterPagamento, handleSaveNewOfflineClient, handleDeleteOfflineClient,
        openChargeModal, updateCoachLocal
    } = useAdminFinance(alunos, coachFilter, getLogCoach, theme);

    return (
        <View style={{ flex: 1, paddingHorizontal: 20 }}>
            
            {/* 🚀 CHAVEADOR DE SAAS EXCLUSIVO PARA MASTERS */}
            {isMaster && (
                <View style={[styles.toggleContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <TouchableOpacity
                        style={[styles.toggleBtn, viewMode === 'ALUNOS' && { backgroundColor: theme.accent }]}
                        onPress={() => setViewMode('ALUNOS')}
                        activeOpacity={0.8}
                    >
                        <MaterialCommunityIcons name="account-group" size={20} color={viewMode === 'ALUNOS' ? '#000' : theme.textSecondary} />
                        <Text style={[styles.toggleText, { color: viewMode === 'ALUNOS' ? '#000' : theme.textSecondary }]}>MEUS ALUNOS</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.toggleBtn, viewMode === 'COACHES' && { backgroundColor: '#BF5AF2' }]}
                        onPress={() => setViewMode('COACHES')}
                        activeOpacity={0.8}
                    >
                        <MaterialCommunityIcons name="handshake" size={20} color={viewMode === 'COACHES' ? '#FFF' : theme.textSecondary} />
                        <Text style={[styles.toggleText, { color: viewMode === 'COACHES' ? '#FFF' : theme.textSecondary }]}>COACHES PARCEIROS</Text>
                    </TouchableOpacity>
                </View>
            )}

            <FinanceHeaderMetrics 
                theme={theme} selectedMonth={selectedMonth} currentYear={currentYear} 
                metrics={metrics} setIsAddModalVisible={setIsAddModalVisible} isWebPC={isWebPC} 
            />

            {/* GRÁFICO DE MÉTRICAS */}
            <View style={[styles.growthCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <MaterialCommunityIcons name="google-analytics" size={20} color={theme.text} />
                        <Text style={[styles.growthTitle, { color: theme.text }]}>DESEMPENHO DA CARTEIRA</Text>
                    </View>
                    <Text style={{ fontSize: 13, fontWeight: 'bold', color: theme.text }}>
                        Total Ativos: {totalAtivosNoMes}
                    </Text>
                </View>

                {totalAtivosNoMes > 0 ? (
                    <>
                        <View style={styles.barContainer}>
                            <View style={[styles.barSegment, { width: `${percRetidos}%`, backgroundColor: viewMode === 'COACHES' ? '#BF5AF2' : theme.accent, borderTopLeftRadius: 8, borderBottomLeftRadius: 8, borderTopRightRadius: percNovos === 0 ? 8 : 0, borderBottomRightRadius: percNovos === 0 ? 8 : 0 }]} />
                            <View style={[styles.barSegment, { width: `${percNovos}%`, backgroundColor: '#32ADE6', borderTopRightRadius: 8, borderBottomRightRadius: 8, borderTopLeftRadius: percRetidos === 0 ? 8 : 0, borderBottomLeftRadius: percRetidos === 0 ? 8 : 0 }]} />
                        </View>
                        
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <View style={[styles.legendDot, { backgroundColor: viewMode === 'COACHES' ? '#BF5AF2' : theme.accent }]} />
                                <Text style={{ fontSize: 12, color: theme.textSecondary }}>
                                    <Text style={{ fontWeight: 'bold', color: theme.text }}>{retidosNoMes}</Text> Retidos
                                </Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <View style={[styles.legendDot, { backgroundColor: '#32ADE6' }]} />
                                <Text style={{ fontSize: 12, color: theme.textSecondary }}>
                                    <Text style={{ fontWeight: 'bold', color: theme.text }}>{novosNoMes}</Text> Novos Cadastros
                                </Text>
                            </View>
                        </View>
                    </>
                ) : (
                    <Text style={{ fontSize: 12, color: theme.textSecondary, textAlign: 'center', paddingVertical: 10 }}>
                        Nenhum cadastro ativo encontrado neste mês.
                    </Text>
                )}
            </View>

            <FinanceFilters 
                theme={theme} isWebPC={isWebPC} viewMode={viewMode}
                searchQuery={searchQuery} setSearchQuery={setSearchQuery} 
                selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth} 
                filterStatus={filterStatus} setFilterStatus={setFilterStatus} 
                filterPrazo={filterPrazo} setFilterPrazo={setFilterPrazo} 
                filterCategory={filterCategory} setFilterCategory={setFilterCategory} 
            />

            {/* 🚀 PAINEL DE SAQUE E PAGAMENTOS (Aparece apenas quando não está gerindo coaches) */}
            {viewMode === 'ALUNOS' && (
                <>
                    {/* Componente Novo de Saque */}
                    <FinanceWithdrawalPanel theme={theme} isWebPC={isWebPC} isMaster={isMaster} />
                    
                    {/* 🔥 AGORA O PAINEL DE PAGAMENTOS RECEBE O MÊS E O ANO */}
                    <AsaasPaymentsPanel 
                        theme={theme} 
                        isWebPC={isWebPC} 
                        selectedMonth={selectedMonth} 
                        currentYear={currentYear} 
                    />
                </>
            )}

            <FinanceStudentList 
                theme={theme} isWebPC={isWebPC} viewMode={viewMode}
                studentList={studentList} loadingId={loadingId} 
                openEditModal={openEditModal} handleTogglePagamento={handleTogglePagamento} openWhatsApp={openWhatsApp} 
                handleDeleteOfflineClient={handleDeleteOfflineClient}
            />

            <FinanceEditModal 
                theme={theme} isWebPC={isWebPC} editingAluno={editingAluno} closeEditModal={closeEditModal}
                isFinanceActiveEdit={isFinanceActiveEdit} setIsFinanceActiveEdit={setIsFinanceActiveEdit}
                financeCategoryEdit={financeCategoryEdit} setFinanceCategoryEdit={setFinanceCategoryEdit}
                contractType={contractType} setContractType={setContractType}
                contractValue={contractValue} setContractValue={setContractValue}
                startDateEdit={startDateEdit} setStartDateEdit={setStartDateEdit}
                paymentDueDate={paymentDueDate} setPaymentDueDate={setPaymentDueDate}
                isUploadingEditPhoto={isUploadingEditPhoto} editPhotoUrl={editPhotoUrl}
                handlePickEditImage={handlePickEditImage} handleSaveModalContract={handleSaveModalContract}
                isSavingContract={isSavingContract} handleReverterPagamento={handleReverterPagamento}
                handleDeleteOfflineClient={handleDeleteOfflineClient}
                openChargeModal={openChargeModal}
                updateCoachLocal={updateCoachLocal}
            />

            <FinanceAddModal 
                theme={theme} isWebPC={isWebPC} isAddModalVisible={isAddModalVisible} setIsAddModalVisible={setIsAddModalVisible}
                newName={newName} setNewName={setNewName} newCategory={newCategory} setNewCategory={setNewCategory}
                newPhone={newPhone} setNewPhone={setNewPhone} newDuration={newDuration} setNewDuration={setNewDuration}
                newValue={newValue} setNewValue={setNewValue} newStartDate={newStartDate} setNewStartDate={setNewStartDate}
                newDueDate={newDueDate} setNewDueDate={setNewDueDate} uploadingPhoto={uploadingPhoto} newPhotoUrl={newPhotoUrl}
                handlePickImage={handlePickImage} handleSaveNewOfflineClient={handleSaveNewOfflineClient} isSavingNew={isSavingNew}
            />

            <FinanceChargeModal
                theme={theme} isWebPC={isWebPC} aluno={chargeAluno}
                visible={!!chargeAluno} onClose={() => setChargeAluno(null)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    toggleContainer: { flexDirection: 'row', borderRadius: 12, padding: 4, marginBottom: 16, borderWidth: 1 },
    toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 8, gap: 8 },
    toggleText: { fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
    growthCard: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 16 },
    growthTitle: { fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
    barContainer: { width: '100%', height: 12, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 8, flexDirection: 'row', overflow: 'hidden' },
    barSegment: { height: '100%' },
    legendDot: { width: 10, height: 10, borderRadius: 5 }
});