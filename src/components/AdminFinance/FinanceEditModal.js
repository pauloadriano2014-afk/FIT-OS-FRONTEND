import React from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, Platform, ActivityIndicator, ScrollView, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// Importe as categorias e a função de cálculo de data do seu financeUtils.js
import { CATEGORIAS_OFFLINE, calcularProximaData } from '../../utils/financeUtils'; // Ajuste o caminho conforme necessário

export default function FinanceEditModal({
    theme, isWebPC, editingAluno, closeEditModal,
    isFinanceActiveEdit, setIsFinanceActiveEdit,
    financeCategoryEdit, setFinanceCategoryEdit,
    contractType, setContractType,
    contractValue, setContractValue,
    startDateEdit, setStartDateEdit,
    paymentDueDate, setPaymentDueDate,
    handleSaveModalContract, isSavingContract,
    handleReverterPagamento, handleDeleteOfflineClient
}) {
    if (!editingAluno) return null;

    // Garante que o botão de excluir apareça verificando o ID
    const isOfflineClient = String(editingAluno.id).startsWith('offline_');

    // Opções de duração padrão
    const defaultContractTypes = [
        { label: "Mensal", value: "Mensal" },
        { label: "Trimestral", value: "Trimestral" },
        { label: "Semestral", value: "Semestral" },
        { label: "Anual", value: "Anual" },
        { label: "Projeto 90 Dias", value: "Projeto 90 Dias" }, // Adicionado para consistência
        { label: "Ficha 8 Semanas", value: "Ficha 8 Semanas" }, // Adicionado para consistência
    ];

    // Opções de duração para "Projeto Especial / Desafio"
    const specialProjectContractTypes = [
        { label: "8 Semanas", value: "8 Semanas" },
        { label: "21 Dias", value: "21 Dias" },
    ];

    // Determine quais opções de duração mostrar
    const currentContractTypeOptions = financeCategoryEdit === "Projeto Especial / Desafio"
        ? specialProjectContractTypes
        : defaultContractTypes;

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
                                <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme === 'dark' ? '#FFF' : '#333' }}>Atualizar Dados</Text>
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
                                <Text style={{ fontSize: 14, fontWeight: 'bold', color: theme === 'dark' ? '#FFF' : '#333' }}>Aluno Ativo no Financeiro</Text>
                                <Text style={{ fontSize: 12, color: '#888', marginTop: 2 }}>Os valores pendentes entrarão na previsão do mês.</Text>
                            </View>
                            <Switch
                                value={isFinanceActiveEdit}
                                onValueChange={setIsFinanceActiveEdit}
                                trackColor={{ false: '#767577', true: '#8BC34A' }}
                                thumbColor={isFinanceActiveEdit ? '#009688' : '#f4f3f4'}
                            />
                        </View>

                        {/* CATEGORIA */}
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
                                // Para mobile, você precisaria de um Picker ou modal de seleção aqui
                                <TextInput
                                    style={{ padding: 12, color: theme === 'dark' ? '#FFF' : '#333', fontSize: 14, fontWeight: 'bold' }}
                                    value={financeCategoryEdit}
                                    onChangeText={setFinanceCategoryEdit}
                                    // Adicione um onPress para abrir um modal de seleção de categorias no mobile
                                />
                            )}
                        </View>

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
                                        // Para mobile, você precisaria de um Picker ou modal de seleção aqui
                                        <TextInput
                                            style={{ padding: 12, color: theme === 'dark' ? '#FFF' : '#333', fontSize: 14, fontWeight: 'bold' }}
                                            value={contractType}
                                            onChangeText={setContractType}
                                            // Adicione um onPress para abrir um modal de seleção de duração no mobile
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

                            {/* Coluna Data de Início */}
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

                            {/* Coluna Próximo Vencimento + Botão Renovação */}
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
                                            // Usar a função calcularProximaData para consistência
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

                        {/* BOTÕES DE AÇÃO */}
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

                        {/* 🔥 BOTÃO DE EXCLUIR CORRIGIDO */}
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