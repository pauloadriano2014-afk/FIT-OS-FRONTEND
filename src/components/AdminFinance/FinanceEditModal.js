// src/components/AdminFinance/FinanceEditModal.js
import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, Platform, ActivityIndicator, ScrollView, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CATEGORIAS_OFFLINE, calcularProximaData } from '../../utils/financeUtils';

export default function FinanceEditModal({
    theme, isWebPC, editingAluno, closeEditModal,
    isFinanceActiveEdit, setIsFinanceActiveEdit,
    financeCategoryEdit, setFinanceCategoryEdit,
    contractType, setContractType,
    contractValue, setContractValue,
    startDateEdit, setStartDateEdit,
    paymentDueDate, setPaymentDueDate,
    handleSaveModalContract, isSavingContract,
    handleReverterPagamento, handleDeleteOfflineClient,
    openChargeModal,
    updateCoachLocal // 🔥 NOVO: Recebe a função para atualizar a UI do coach em tempo real
}) {
    const [localCoachPlan, setLocalCoachPlan] = useState('PERSONAL');
    const [localCoachStatus, setLocalCoachStatus] = useState('ACTIVE');

    const isCoach = (editingAluno?.role || editingAluno?.type || '').toUpperCase() === 'COACH';

    useEffect(() => {
        if (editingAluno && isCoach) {
            setLocalCoachPlan(editingAluno.coachPlan || 'PERSONAL');
            setLocalCoachStatus(editingAluno.accountStatus || 'ACTIVE');
        }
    }, [editingAluno, isCoach]);

    if (!editingAluno) return null;

    const isOfflineClient = String(editingAluno?.id).startsWith('offline_');

    const defaultContractTypes = [
        { label: "Mensal", value: "Mensal" },
        { label: "Trimestral", value: "Trimestral" },
        { label: "Semestral", value: "Semestral" },
        { label: "Anual", value: "Anual" },
        { label: "Projeto 90 Dias", value: "Projeto 90 Dias" }, 
        { label: "Ficha 8 Semanas", value: "Ficha 8 Semanas" }, 
    ];

    const specialProjectContractTypes = [
        { label: "8 Semanas", value: "8 Semanas" },
        { label: "21 Dias", value: "21 Dias" },
    ];

    const PLAN_OPTIONS = [
        { value: 'PERSONAL', label: 'Personal Trainer' },
        { value: 'NUTRICIONISTA', label: 'Nutricionista' },
        { value: 'ELITE', label: 'Elite (Completo)' },
    ];

    const currentContractTypeOptions = financeCategoryEdit === "Projeto Especial / Desafio"
        ? specialProjectContractTypes
        : defaultContractTypes;

    // 🔥 Ao clicar no plano, já salva na API do coach e reflete na tela
    const handleChangeCoachPlan = async (newPlan) => {
        setLocalCoachPlan(newPlan);
        if (updateCoachLocal) updateCoachLocal(editingAluno.id, { coachPlan: newPlan, financeCategory: newPlan });
        try {
            await fetch('https://fitos-final.onrender.com/api/admin/coaches', {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ coachId: editingAluno.id, action: 'SET_PLAN', coachPlan: newPlan })
            });
        } catch (e) { console.log(e); }
    };

    // 🔥 Ao clicar em bloquear, já salva na API do coach e reflete na tela
    const handleToggleCoachBlock = async () => {
        const isActive = localCoachStatus === 'ACTIVE';
        const action = isActive ? 'BLOCK' : 'UNBLOCK';
        const newStatus = isActive ? 'REJECTED' : 'ACTIVE';
        
        setLocalCoachStatus(newStatus); 
        if (updateCoachLocal) updateCoachLocal(editingAluno.id, { accountStatus: newStatus });
        try {
            await fetch('https://fitos-final.onrender.com/api/admin/coaches', {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ coachId: editingAluno.id, action })
            });
        } catch (e) { 
            setLocalCoachStatus(isActive ? 'ACTIVE' : 'REJECTED');
            if (updateCoachLocal) updateCoachLocal(editingAluno.id, { accountStatus: isActive ? 'ACTIVE' : 'REJECTED' });
        }
    };

    return (
        <Modal visible={!!editingAluno} transparent animationType="fade">
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
                <View style={{
                    width: isWebPC ? 600 : '90%',
                    maxHeight: '90%',
                    backgroundColor: theme === 'dark' ? '#1E1E1E' : '#F9F9F9',
                    borderRadius: 15,
                    padding: 20,
                    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 8
                }}>

                    {/* CABEÇALHO */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: theme === 'dark' ? '#333' : '#E0E0E0', paddingBottom: 10 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={{ backgroundColor: '#E8F5E9', padding: 8, borderRadius: 20, marginRight: 10 }}>
                                <Ionicons name="pencil" size={20} color="#4CAF50" />
                            </View>
                            <View>
                                <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme === 'dark' ? '#FFF' : '#333' }}>
                                    {isCoach ? 'Configuração do Parceiro' : 'Atualizar Dados'}
                                </Text>
                                <Text style={{ fontSize: 12, color: '#888' }}>ID: {editingAluno.id}</Text>
                                <Text style={{ fontSize: 14, color: '#666', marginTop: 2 }}>{editingAluno.name}</Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={closeEditModal} style={{ padding: 5 }}>
                            <Ionicons name="close" size={24} color="#888" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>

                        {/* TOGGLE ATIVO/INATIVO */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme === 'dark' ? '#2A2A2A' : '#FFF', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: isFinanceActiveEdit ? '#8BC34A' : '#E0E0E0', marginBottom: 15 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 14, fontWeight: 'bold', color: theme === 'dark' ? '#FFF' : '#333' }}>
                                    Ativo na Previsão Financeira
                                </Text>
                                <Text style={{ fontSize: 12, color: '#888', marginTop: 2 }}>Os valores pendentes entrarão na previsão do mês.</Text>
                            </View>
                            <Switch
                                value={isFinanceActiveEdit}
                                onValueChange={setIsFinanceActiveEdit}
                                trackColor={{ false: '#767577', true: '#8BC34A' }}
                                thumbColor={isFinanceActiveEdit ? '#009688' : '#f4f3f4'}
                            />
                        </View>

                        {/* CATEGORIA (só mostra para aluno comum) */}
                        {!isCoach && (
                            <>
                                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#888', marginBottom: 5, textTransform: 'uppercase' }}>Categoria no Financeiro</Text>
                                <View style={{ backgroundColor: theme === 'dark' ? '#2A2A2A' : '#FFF', borderRadius: 8, borderWidth: 1, borderColor: theme === 'dark' ? '#444' : '#DDD', marginBottom: 15 }}>
                                    {Platform.OS === 'web' ? (
                                        <select
                                            value={financeCategoryEdit}
                                            onChange={(e) => setFinanceCategoryEdit(e.target.value)}
                                            style={{ width: '100%', padding: 12, backgroundColor: 'transparent', color: theme === 'dark' ? '#FFF' : '#333', border: 'none', outline: 'none', fontSize: 14, fontWeight: 'bold' }}
                                        >
                                            {CATEGORIAS_OFFLINE.map(category => (
                                                <option key={category} value={category}>{category}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <TextInput
                                            style={{ padding: 12, color: theme === 'dark' ? '#FFF' : '#333', fontSize: 14, fontWeight: 'bold' }}
                                            value={financeCategoryEdit}
                                            onChangeText={setFinanceCategoryEdit}
                                        />
                                    )}
                                </View>
                            </>
                        )}

                        {/* DURAÇÃO E VALOR */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 }}>
                            <View style={{ flex: 1, marginRight: 10 }}>
                                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#888', marginBottom: 5, textTransform: 'uppercase' }}>Duração (Plano)</Text>
                                <View style={{ backgroundColor: theme === 'dark' ? '#2A2A2A' : '#FFF', borderRadius: 8, borderWidth: 1, borderColor: theme === 'dark' ? '#444' : '#DDD' }}>
                                    {Platform.OS === 'web' ? (
                                        <select
                                            value={contractType}
                                            onChange={(e) => setContractType(e.target.value)}
                                            style={{ width: '100%', padding: 12, backgroundColor: 'transparent', color: theme === 'dark' ? '#FFF' : '#333', border: 'none', outline: 'none', fontSize: 14, fontWeight: 'bold' }}
                                        >
                                            {currentContractTypeOptions.map(option => (
                                                <option key={option.value} value={option.value}>{option.label}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <TextInput
                                            style={{ padding: 12, color: theme === 'dark' ? '#FFF' : '#333', fontSize: 14, fontWeight: 'bold' }}
                                            value={contractType}
                                            onChangeText={setContractType}
                                        />
                                    )}
                                </View>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#888', marginBottom: 5, textTransform: 'uppercase' }}>Valor (R$)</Text>
                                <TextInput
                                    style={{ backgroundColor: theme === 'dark' ? '#2A2A2A' : '#FFF', color: '#8BC34A', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: theme === 'dark' ? '#444' : '#DDD', fontSize: 14, fontWeight: 'bold', textAlign: 'center' }}
                                    value={String(contractValue)}
                                    onChangeText={setContractValue}
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>

                        {/* DATAS COM CALENDÁRIO NATIVO E BOTÃO RENOVOU */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 }}>
                            <View style={{ flex: 1, marginRight: 10 }}>
                                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#888', marginBottom: 5, textTransform: 'uppercase' }}>Data de Início</Text>
                                {Platform.OS === 'web' ? (
                                    <input
                                        type="date"
                                        value={startDateEdit}
                                        onChange={(e) => setStartDateEdit(e.target.value)}
                                        style={{ width: '100%', padding: '11px', borderRadius: '8px', border: `1px solid ${theme === 'dark' ? '#444' : '#DDD'}`, backgroundColor: theme === 'dark' ? '#2A2A2A' : '#FFF', color: theme === 'dark' ? '#FFF' : '#333', outline: 'none', fontSize: '14px', fontWeight: 'bold', boxSizing: 'border-box' }}
                                    />
                                ) : (
                                    <TextInput
                                        style={{ backgroundColor: theme === 'dark' ? '#2A2A2A' : '#FFF', color: theme === 'dark' ? '#FFF' : '#333', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: theme === 'dark' ? '#444' : '#DDD', fontSize: 14, fontWeight: 'bold' }}
                                        value={startDateEdit}
                                        onChangeText={setStartDateEdit}
                                        placeholder="AAAA-MM-DD"
                                    />
                                )}
                            </View>

                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#888', marginBottom: 5, textTransform: 'uppercase' }}>Próximo Vencimento</Text>
                                {Platform.OS === 'web' ? (
                                    <input
                                        type="date"
                                        value={paymentDueDate}
                                        onChange={(e) => setPaymentDueDate(e.target.value)}
                                        style={{ width: '100%', padding: '11px', borderRadius: '8px', border: `1px solid ${theme === 'dark' ? '#444' : '#DDD'}`, backgroundColor: theme === 'dark' ? '#2A2A2A' : '#FFF', color: theme === 'dark' ? '#FFF' : '#333', outline: 'none', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', boxSizing: 'border-box' }}
                                    />
                                ) : (
                                    <TextInput
                                        style={{ backgroundColor: theme === 'dark' ? '#2A2A2A' : '#FFF', color: theme === 'dark' ? '#FFF' : '#333', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: theme === 'dark' ? '#444' : '#DDD', fontSize: 14, fontWeight: 'bold', marginBottom: 8 }}
                                        value={paymentDueDate}
                                        onChangeText={setPaymentDueDate}
                                        placeholder="AAAA-MM-DD"
                                    />
                                )}

                                <TouchableOpacity
                                    style={{ backgroundColor: '#4CAF50', paddingVertical: 8, borderRadius: 8, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}
                                    onPress={() => {
                                        if(paymentDueDate) {
                                            const newDueDate = calcularProximaData(paymentDueDate, contractType);
                                            setPaymentDueDate(newDueDate.split('T')[0]);
                                        }
                                    }}
                                >
                                    <Ionicons name="cash-outline" size={16} color="#FFF" style={{ marginRight: 5 }} />
                                    <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 12 }}>RENOVOU</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* 🚀 ZONA EXCLUSIVA DO SAAS 🚀 */}
                        {isCoach && (
                            <View style={{ marginBottom: 20, backgroundColor: theme === 'dark' ? '#2A2A2A' : '#F4F0F9', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#BF5AF250' }}>
                                <Text style={{ fontSize: 12, fontWeight: '900', color: '#BF5AF2', marginBottom: 15, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                    <Ionicons name="briefcase" size={14} /> Configurações do Software (SaaS)
                                </Text>

                                {/* Plano do Coach */}
                                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#888', marginBottom: 5 }}>Plano de Acesso</Text>
                                <View style={{ backgroundColor: theme === 'dark' ? '#1E1E1E' : '#FFF', borderRadius: 8, borderWidth: 1, borderColor: theme === 'dark' ? '#444' : '#DDD', marginBottom: 15 }}>
                                    {Platform.OS === 'web' ? (
                                        <select
                                            value={localCoachPlan}
                                            onChange={(e) => handleChangeCoachPlan(e.target.value)}
                                            style={{ width: '100%', padding: 12, backgroundColor: 'transparent', color: theme === 'dark' ? '#FFF' : '#333', border: 'none', outline: 'none', fontSize: 14, fontWeight: 'bold' }}
                                        >
                                            {PLAN_OPTIONS.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, padding: 5 }}>
                                            {PLAN_OPTIONS.map(opt => (
                                                <TouchableOpacity 
                                                    key={opt.value} 
                                                    style={{ flex: 1, minWidth: '30%', padding: 8, borderRadius: 6, backgroundColor: localCoachPlan === opt.value ? '#BF5AF2' : (theme === 'dark' ? '#333' : '#EEE'), alignItems: 'center' }}
                                                    onPress={() => handleChangeCoachPlan(opt.value)}
                                                >
                                                    <Text style={{ fontSize: 11, fontWeight: 'bold', color: localCoachPlan === opt.value ? '#FFF' : (theme === 'dark' ? '#CCC' : '#555'), textAlign: 'center' }}>
                                                        {opt.label}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    )}
                                </View>

                                {/* Bloqueio de Acesso */}
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme === 'dark' ? '#1E1E1E' : '#FFF', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: localCoachStatus === 'ACTIVE' ? '#8BC34A' : '#FF3B30' }}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 13, fontWeight: 'bold', color: localCoachStatus === 'ACTIVE' ? '#8BC34A' : '#FF3B30' }}>
                                            {localCoachStatus === 'ACTIVE' ? 'Acesso Liberado no App' : 'Coach Bloqueado no App'}
                                        </Text>
                                        <Text style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
                                            {localCoachStatus === 'ACTIVE' ? 'Ele consegue logar e usar a plataforma.' : 'Cortar acesso por falta de pagamento.'}
                                        </Text>
                                    </View>
                                    <Switch
                                        value={localCoachStatus === 'ACTIVE'}
                                        onValueChange={handleToggleCoachBlock}
                                        trackColor={{ false: '#FF3B3060', true: '#8BC34A60' }}
                                        thumbColor={localCoachStatus === 'ACTIVE' ? '#8BC34A' : '#FF3B30'}
                                    />
                                </View>
                            </View>
                        )}
                        {/* 🚀 FIM ZONA EXCLUSIVA DO SAAS 🚀 */}

                        {!isOfflineClient && openChargeModal && !isCoach && (
                            <TouchableOpacity
                                style={{ backgroundColor: '#009688', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 10, flexDirection: 'row', justifyContent: 'center' }}
                                onPress={() => openChargeModal(editingAluno)}
                            >
                                <Ionicons name="qr-code-outline" size={18} color="#FFF" style={{ marginRight: 8 }} />
                                <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>GERAR COBRANÇA (PIX/CARTÃO)</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={{ backgroundColor: '#8BC34A', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 10 }}
                            onPress={handleSaveModalContract}
                            disabled={isSavingContract}
                        >
                            {isSavingContract ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>💾 SALVAR E FECHAR</Text>}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={{ backgroundColor: 'transparent', padding: 15, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#F44336', marginBottom: isOfflineClient ? 10 : 0 }}
                            onPress={handleReverterPagamento}
                        >
                            <Text style={{ color: '#F44336', fontWeight: 'bold', fontSize: 14 }}>↩ REVERTER PAGAMENTO</Text>
                        </TouchableOpacity>

                        {isOfflineClient && (
                            <TouchableOpacity
                                style={{ backgroundColor: '#F44336', padding: 15, borderRadius: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
                                onPress={() => handleDeleteOfflineClient(editingAluno.id)}
                            >
                                <Ionicons name="trash-outline" size={18} color="#FFF" style={{ marginRight: 8 }} />
                                <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 14 }}>EXCLUIR ALUNO OFFLINE</Text>
                            </TouchableOpacity>
                        )}

                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}