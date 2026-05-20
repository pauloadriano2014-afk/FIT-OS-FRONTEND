// src/components/AdminFinanceSystem.js

import React, { useState, useMemo, useEffect, createElement } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Linking, Image, ActivityIndicator, Alert, Modal, TextInput, ScrollView, useWindowDimensions, Dimensions, Switch } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage'; // 🔥 IMPORT ADICIONADO 🔥

const MONTHS = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];

const CATEGORIAS_OFFLINE = ['Consultoria Online', 'Personal Trainer', 'Assessoria de Corrida', 'Projeto Especial / Desafio', 'Plano Alimentar / Nutrição'];

// 🔥 MOTOR DE DATAS 🔥
const calcularProximaData = (dataBaseIso, tipoContrato) => {
    const data = dataBaseIso ? new Date(dataBaseIso) : new Date();
    let novaData = new Date(data.getTime());
    switch (tipoContrato) {
        case 'Mensal': novaData.setMonth(novaData.getMonth() + 1); break;
        case 'Trimestral': novaData.setMonth(novaData.getMonth() + 3); break;
        case 'Semestral': novaData.setMonth(novaData.getMonth() + 6); break;
        case 'Anual': novaData.setFullYear(novaData.getFullYear() + 1); break;
        case 'Projeto 90 Dias': novaData.setDate(novaData.getDate() + 90); break;
        case 'Ficha 8 Semanas': novaData.setDate(novaData.getDate() + 56); break;
        default: novaData.setMonth(novaData.getMonth() + 1);
    }
    return novaData.toISOString();
};

const calcularDataAnterior = (dataBaseIso, tipoContrato) => {
    const data = dataBaseIso ? new Date(dataBaseIso) : new Date();
    let novaData = new Date(data.getTime());
    switch (tipoContrato) {
        case 'Mensal': novaData.setMonth(novaData.getMonth() - 1); break;
        case 'Trimestral': novaData.setMonth(novaData.getMonth() - 3); break;
        case 'Semestral': novaData.setMonth(novaData.getMonth() - 6); break;
        case 'Anual': novaData.setFullYear(novaData.getFullYear() - 1); break;
        case 'Projeto 90 Dias': novaData.setDate(novaData.getDate() - 90); break;
        case 'Ficha 8 Semanas': novaData.setDate(novaData.getDate() - 56); break;
        default: novaData.setMonth(novaData.getMonth() - 1);
    }
    return novaData.toISOString();
};

const getDueDateStatus = (isoDate, theme) => {
    if (!isoDate) return { days: 0, color: theme.textSecondary, label: 'SEM DATA', border: theme.border };
    const target = new Date(isoDate);
    const today = new Date();
    target.setHours(0,0,0,0);
    today.setHours(0,0,0,0);
    
    const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 3600 * 24));
    
    if (diffDays <= 0) return { days: diffDays, color: theme.isDark ? '#FFF' : '#000', label: 'VENCIDO', border: theme.isDark ? '#555' : '#333' }; 
    if (diffDays <= 3) return { days: diffDays, color: '#FF3B30', label: 'URGENTE', border: '#FF3B30' }; 
    if (diffDays <= 7) return { days: diffDays, color: '#FF9500', label: 'ATENÇÃO', border: '#FF9500' }; 
    return { days: diffDays, color: '#34C759', label: 'NO PRAZO', border: '#34C759' }; 
};

const forceMiddayUTC = (dateStr) => {
    if (!dateStr) return null;
    if (dateStr.includes('T')) return dateStr;
    return `${dateStr}T12:00:00Z`;
};

export default function AdminFinanceSystem({ theme, alunos, coachFilter, getLogCoach }) {
    const { width } = useWindowDimensions();
    const isWebPC = Platform.OS === 'web' && width > 768;
    
    const currentMonthIndex = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    // Filtros
    const [selectedMonth, setSelectedMonth] = useState(currentMonthIndex);
    const [filterStatus, setFilterStatus] = useState('ATIVOS'); 
    const [filterCategory, setFilterCategory] = useState('TODOS'); 
    const [filterPrazo, setFilterPrazo] = useState('TODOS'); 
    const [searchQuery, setSearchQuery] = useState(''); 
    
    const [localAlunos, setLocalAlunos] = useState([]);
    const [offlineClients, setOfflineClients] = useState([]); 
    const [loadingId, setLoadingId] = useState(null);

    // Edição Modal
    const [editingAluno, setEditingAluno] = useState(null);
    const [contractType, setContractType] = useState('Mensal');
    const [contractValue, setContractValue] = useState('0');
    const [startDateEdit, setStartDateEdit] = useState(''); 
    const [paymentDueDate, setPaymentDueDate] = useState('');
    const [financeCategoryEdit, setFinanceCategoryEdit] = useState('Consultoria Online');
    const [isFinanceActiveEdit, setIsFinanceActiveEdit] = useState(true);
    const [isSavingContract, setIsSavingContract] = useState(false);

    // Novo Aluno
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [newPhotoUrl, setNewPhotoUrl] = useState('');
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [newName, setNewName] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [newCategory, setNewCategory] = useState('Consultoria Online');
    const [newDuration, setNewDuration] = useState('Mensal');
    const [newValue, setNewValue] = useState('');
    const [newStartDate, setNewStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [newDueDate, setNewDueDate] = useState('');
    const [isSavingNew, setIsSavingNew] = useState(false);

    useEffect(() => {
        setLocalAlunos(alunos);
    }, [alunos]);

    // 🔥 CARREGA ALUNOS OFFLINE DO CACHE ASSIM QUE A TELA ABRE 🔥
    useEffect(() => {
        const loadOfflineClients = async () => {
            try {
                const saved = await AsyncStorage.getItem('@offline_clients');
                if (saved) setOfflineClients(JSON.parse(saved));
            } catch (e) { console.error("Erro ao carregar offline", e); }
        };
        loadOfflineClients();
    }, []);

    const todosAlunosFinanceiro = useMemo(() => {
        const mix = [...localAlunos, ...offlineClients];
        return mix.filter(a => {
            if (a.isOffline) return a.assignedCoach === coachFilter;
            return getLogCoach(a) === coachFilter;
        }).map(aluno => ({
            ...aluno,
            financeCategory: aluno.financeCategory || (aluno.isOffline ? aluno.plan : 'Consultoria Online'),
            isFinanceActive: aluno.isFinanceActive !== undefined ? aluno.isFinanceActive : true
        }));
    }, [localAlunos, offlineClients, coachFilter, getLogCoach]);

    const metrics = useMemo(() => {
        let entrada = 0;
        let pendente = 0;
        let previsao = 0;

        const endOfSelectedMonth = new Date(currentYear, selectedMonth + 1, 0);
        endOfSelectedMonth.setHours(23, 59, 59, 999);

        todosAlunosFinanceiro.forEach(aluno => {
            const valor = parseFloat(aluno.contractValue) || 0;
            const isPaid = aluno.paymentDueDate ? new Date(aluno.paymentDueDate) > endOfSelectedMonth : false;

            if (isPaid) {
                entrada += valor;
                previsao += valor;
            } else {
                if (aluno.isFinanceActive) {
                    pendente += valor;
                    previsao += valor;
                }
            }
        });

        return { entrada, pendente, previsao };
    }, [todosAlunosFinanceiro, selectedMonth, currentYear]);

    const studentList = useMemo(() => {
        const endOfSelectedMonth = new Date(currentYear, selectedMonth + 1, 0);
        endOfSelectedMonth.setHours(23, 59, 59, 999);

        let list = todosAlunosFinanceiro.map(aluno => {
            const isPaid = aluno.paymentDueDate ? new Date(aluno.paymentDueDate) > endOfSelectedMonth : false;
            return { ...aluno, isPaid };
        });

        if (filterStatus === 'ATIVOS') list = list.filter(a => a.isFinanceActive);
        if (filterStatus === 'INATIVOS') list = list.filter(a => !a.isFinanceActive);
        if (filterStatus === 'PAGOS') list = list.filter(a => a.isPaid && a.isFinanceActive);
        if (filterStatus === 'PENDENTES') list = list.filter(a => !a.isPaid && a.isFinanceActive);

        if (filterCategory !== 'TODOS') list = list.filter(a => a.financeCategory === filterCategory);

        if (filterPrazo !== 'TODOS') {
            list = list.filter(a => {
                if (!a.paymentDueDate) return false;
                const status = getDueDateStatus(a.paymentDueDate, theme);
                if (filterPrazo === 'VENCIDOS') return status.days <= 0;
                if (filterPrazo === 'ALERTA_3D') return status.days > 0 && status.days <= 3;
                if (filterPrazo === 'ATENCAO_7D') return status.days >= 4 && status.days <= 7;
                if (filterPrazo === 'NO_PRAZO') return status.days > 7;
                return true;
            });
        }

        if (searchQuery.trim() !== '') {
            const term = searchQuery.toLowerCase();
            list = list.filter(a => (a.name || '').toLowerCase().includes(term));
        }

        return list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }, [todosAlunosFinanceiro, selectedMonth, currentYear, filterStatus, filterCategory, filterPrazo, searchQuery, theme]);

    const handleTogglePagamento = async (aluno) => {
        const isCurrentlyPaid = aluno.isPaid;
        const msg = isCurrentlyPaid 
            ? `Deseja CANCELAR o pagamento de ${aluno.name} e RETROCEDER a data de vencimento?` 
            : `Deseja REGISTRAR o pagamento de ${aluno.name} e AVANÇAR a data de vencimento?`;

        const confirmAction = async () => {
            setLoadingId(aluno.id);
            try {
                const tipoContrato = aluno.contractType || 'Mensal';
                const dataBase = aluno.paymentDueDate ? aluno.paymentDueDate : new Date().toISOString();
                
                const novaDataISO = isCurrentlyPaid 
                    ? calcularDataAnterior(dataBase, tipoContrato) 
                    : calcularProximaData(dataBase, tipoContrato);

                const updatedData = { paymentDueDate: novaDataISO };

                setLocalAlunos(prev => prev.map(a => a.id === aluno.id ? { ...a, ...updatedData } : a));
                const parentRef = alunos.find(a => a.id === aluno.id);
                if (parentRef) Object.assign(parentRef, updatedData);

                if (aluno.isOffline) {
                    const newList = offlineClients.map(a => a.id === aluno.id ? { ...a, ...updatedData } : a);
                    setOfflineClients(newList);
                    await AsyncStorage.setItem('@offline_clients', JSON.stringify(newList)); // 🔥 SALVA NO CACHE 🔥
                    if (Platform.OS === 'web') window.alert(isCurrentlyPaid ? "Pagamento estornado!" : "Pagamento registrado!");
                } else {
                    await fetch('https://fitos-final.onrender.com/api/admin/update-contract', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            userId: aluno.id,
                            contractType: tipoContrato,
                            contractValue: parseFloat(aluno.contractValue) || 0,
                            paymentDueDate: novaDataISO,
                            financeCategory: aluno.financeCategory || 'Consultoria Online',
                            isFinanceActive: aluno.isFinanceActive !== undefined ? aluno.isFinanceActive : true
                        }),
                    });
                    if (Platform.OS === 'web') window.alert(isCurrentlyPaid ? "Pagamento estornado!" : "Pagamento registrado!");
                }
            } catch (error) {
                console.error("Erro ao processar pagamento:", error);
                if (Platform.OS === 'web') window.alert("Erro ao processar.");
            } finally {
                setLoadingId(null);
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm(msg)) confirmAction();
        } else {
            Alert.alert(isCurrentlyPaid ? "Estornar" : "Confirmar", msg, [
                { text: "Cancelar", style: "cancel" },
                { text: "Sim", style: isCurrentlyPaid ? 'destructive' : 'default', onPress: confirmAction }
            ]);
        }
    };

    const openWhatsApp = (phone, name) => {
        if (!phone) return;
        const message = `Olá ${name}, tudo bem? Estou entrando em contato para falar sobre sua consultoria...`;
        const url = `whatsapp://send?phone=+55${phone.replace(/\D/g, '')}&text=${encodeURIComponent(message)}`;
        Linking.openURL(url).catch(() => {
            if (Platform.OS === 'web') window.alert("Por favor, instale o WhatsApp ou use um dispositivo móvel.");
            else Alert.alert("Erro", "Não foi possível abrir o WhatsApp.");
        });
    };

    const openEditModal = (aluno) => {
        setEditingAluno(aluno);
        setContractType(aluno.contractType || 'Mensal');
        setContractValue(aluno.contractValue ? String(aluno.contractValue) : '0');
        setStartDateEdit(aluno.startDate ? aluno.startDate.split('T')[0] : (aluno.createdAt ? new Date(aluno.createdAt).toISOString().split('T')[0] : ''));
        setPaymentDueDate(aluno.paymentDueDate ? aluno.paymentDueDate.split('T')[0] : '');
        setFinanceCategoryEdit(aluno.financeCategory || 'Consultoria Online');
        setIsFinanceActiveEdit(aluno.isFinanceActive !== undefined ? aluno.isFinanceActive : true);
    };

    const closeEditModal = () => {
        setEditingAluno(null);
        setContractType('Mensal');
        setContractValue('0');
        setStartDateEdit('');
        setPaymentDueDate('');
        setFinanceCategoryEdit('Consultoria Online');
        setIsFinanceActiveEdit(true);
    };

    const handleSaveModalContract = async () => {
        if (!editingAluno) return;
        setIsSavingContract(true);
        try {
            const parsedValue = parseFloat(String(contractValue).replace(',', '.')) || 0;
            const safeIsoDate = forceMiddayUTC(paymentDueDate);
            const safeStartIsoDate = forceMiddayUTC(startDateEdit);

            const updatedData = {
                userId: editingAluno.id,
                contractType,
                contractValue: parsedValue,
                paymentDueDate: safeIsoDate,
                startDate: safeStartIsoDate, 
                financeCategory: financeCategoryEdit, 
                isFinanceActive: isFinanceActiveEdit
            };

            setLocalAlunos(prev => prev.map(a => a.id === editingAluno.id ? { ...a, ...updatedData } : a));
            const parentRef = alunos.find(a => a.id === editingAluno.id);
            if (parentRef) Object.assign(parentRef, updatedData);

            if (editingAluno.isOffline) {
                const newList = offlineClients.map(a => a.id === editingAluno.id ? { ...a, ...updatedData } : a);
                setOfflineClients(newList);
                await AsyncStorage.setItem('@offline_clients', JSON.stringify(newList)); // 🔥 SALVA NO CACHE 🔥
                if (Platform.OS === 'web') window.alert("Sucesso!");
            } else {
                const response = await fetch('https://fitos-final.onrender.com/api/admin/update-contract', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedData),
                });
                if (!response.ok) throw new Error("Falha");
                if (Platform.OS === 'web') window.alert("Contrato atualizado.");
            }
            closeEditModal();
        } catch (error) {
            if (Platform.OS === 'web') window.alert("Erro ao salvar.");
        } finally {
            setIsSavingContract(false);
        }
    };

    const handleReverterPagamento = async () => {
        if (!editingAluno) return;

        const confirmRevert = async () => {
            setIsSavingContract(true);
            try {
                const parsedValue = parseFloat(String(contractValue).replace(',', '.')) || 0;
                const safeStartIsoDate = forceMiddayUTC(startDateEdit);

                const updatedData = {
                    userId: editingAluno.id,
                    contractType,
                    contractValue: parsedValue,
                    paymentDueDate: null, 
                    startDate: safeStartIsoDate,
                    financeCategory: financeCategoryEdit, 
                    isFinanceActive: isFinanceActiveEdit
                };

                setLocalAlunos(prev => prev.map(a => a.id === editingAluno.id ? { ...a, ...updatedData } : a));
                const parentRef = alunos.find(a => a.id === editingAluno.id);
                if (parentRef) Object.assign(parentRef, updatedData);

                if (editingAluno.isOffline) {
                    const newList = offlineClients.map(a => a.id === editingAluno.id ? { ...a, ...updatedData } : a);
                    setOfflineClients(newList);
                    await AsyncStorage.setItem('@offline_clients', JSON.stringify(newList)); // 🔥 SALVA NO CACHE 🔥
                    if (Platform.OS === 'web') window.alert("Pagamento Revertido!");
                } else {
                    const response = await fetch('https://fitos-final.onrender.com/api/admin/update-contract', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(updatedData),
                    });
                    if (!response.ok) throw new Error("Falha na resposta do servidor");
                    if (Platform.OS === 'web') window.alert("Pagamento Revertido!");
                }
                closeEditModal();
            } catch (error) {
                console.error("Erro ao reverter contrato:", error);
                if (Platform.OS === 'web') window.alert("Erro ao reverter o pagamento.");
            } finally {
                setIsSavingContract(false);
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm(`Tem certeza que deseja REVERTER o pagamento e marcá-lo como PENDENTE?`)) confirmRevert();
        } else {
            Alert.alert("Reverter Pagamento", `Tem certeza que deseja REVERTER o pagamento?`, [
                { text: "Cancelar", style: "cancel" },
                { text: "Sim", style: 'destructive', onPress: confirmRevert }
            ]);
        }
    };

    const handlePickImage = async () => {
        try {
            setUploadingPhoto(true);
            let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.5 });
            if (!result.canceled) setNewPhotoUrl(result.assets[0].uri);
        } catch (error) {
            console.error(error);
        } finally {
            setUploadingPhoto(false);
        }
    };

    const handleSaveNewOfflineClient = async () => {
        if (!newName || !newPhone || !newValue || !newStartDate || !newDueDate) {
            if (Platform.OS === 'web') window.alert("Preencha todos os campos obrigatórios.");
            return;
        }
        setIsSavingNew(true);
        try {
            const parsedOfflineValue = parseFloat(String(newValue).replace(',', '.')) || 0;
            const newClient = {
                id: `offline_${Date.now()}`, 
                name: newName,
                phone: newPhone,
                plan: newCategory,
                financeCategory: newCategory,
                contractType: newDuration,
                contractValue: parsedOfflineValue,
                startDate: forceMiddayUTC(newStartDate), 
                paymentDueDate: forceMiddayUTC(newDueDate),
                photoUrl: newPhotoUrl,
                isOffline: true,
                isFinanceActive: true,
                assignedCoach: coachFilter, // Atribui à aba de quem criou
                coachId: coachFilter === 'ADRI' ? 'adri_coach_id_placeholder' : 'PAULO_COACH_ID_PLACEHOLDER', 
            };
            
            const newList = [...offlineClients, newClient];
            setOfflineClients(newList);
            await AsyncStorage.setItem('@offline_clients', JSON.stringify(newList)); // 🔥 SALVA NO CACHE PARA NÃO SUMIR 🔥

            if (Platform.OS === 'web') window.alert("Aluno offline cadastrado com sucesso.");
            setIsAddModalVisible(false);
            setNewName(''); setNewPhone(''); setNewCategory('Consultoria Online'); setNewDuration('Mensal'); setNewValue('');
            setNewStartDate(new Date().toISOString().split('T')[0]); setNewDueDate(''); setNewPhotoUrl('');
        } catch (error) {
            console.error(error);
        } finally {
            setIsSavingNew(false);
        }
    };

    const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    const renderWebSelect = (value, onChange, options) => (
        <View style={styles.webSelectWrapper(theme)}>
            <select value={value} onChange={onChange} style={styles.webSelectInput(theme)}>
                {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            <MaterialCommunityIcons name="chevron-down" size={20} color={theme.textSecondary} style={styles.webSelectIcon} />
        </View>
    );

    return (
        <View style={{ flex: 1, paddingHorizontal: 20 }}>
            <View style={[styles.headerCard, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.isDark ? 'transparent' : '#000' }]}>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 15}}>
                     <View style={[styles.iconBox, {backgroundColor: theme.accent + '22', width: 44, height: 44, borderRadius: 22}]}>
                        <MaterialCommunityIcons name="cash-multiple" size={22} color={theme.accent} />
                    </View>
                    <View>
                        <Text style={[styles.mainLabel, { color: theme.text }]}>GESTÃO FINANCEIRA</Text>
                        <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: 'bold', letterSpacing: 0.5 }}>{MONTHS[selectedMonth]} {currentYear}</Text>
                    </View>
                </View>
                <TouchableOpacity style={[styles.addBtnModern, { backgroundColor: theme.accent }]} onPress={() => setIsAddModalVisible(true)}>
                    <MaterialCommunityIcons name="account-plus" size={18} color="#FFF" />
                    <Text style={[styles.addBtnText, { color: '#FFF' }]}>NOVO ALUNO OFFLINE</Text>
                </TouchableOpacity>
            </View>

            <TextInput 
                style={[styles.searchBar, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} 
                placeholder="Buscar aluno pelo nome..." 
                placeholderTextColor={theme.textSecondary} 
                value={searchQuery} 
                onChangeText={setSearchQuery} 
            />

            <View style={[styles.filterBar, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.isDark ? 'transparent' : '#000', flexDirection: isWebPC ? 'row' : 'column', padding: isWebPC ? 0 : 15 }]}>
                <View style={[{ padding: isWebPC ? 15 : 0 }, isWebPC ? { flex: 1, borderRightWidth: 1, borderRightColor: theme.border } : { marginBottom: 15 }]}>
                    <Text style={styles.inputLabel}>MÊS</Text>
                    {Platform.OS === 'web' ? renderWebSelect(selectedMonth, (e) => setSelectedMonth(Number(e.target.value)), MONTHS.map((m, i) => ({ value: i, label: m }))) : (
                        <View style={styles.pickerWrapper}><Picker selectedValue={selectedMonth} onValueChange={setSelectedMonth} style={{ color: theme.text }} dropdownIconColor={theme.accent}>{MONTHS.map((m, i) => <Picker.Item key={i} label={m} value={i} />)}</Picker></View>
                    )}
                </View>

                <View style={[{ padding: isWebPC ? 15 : 0 }, isWebPC ? { flex: 1, borderRightWidth: 1, borderRightColor: theme.border } : { marginBottom: 15 }]}>
                    <Text style={styles.inputLabel}>STATUS DO ALUNO</Text>
                    {Platform.OS === 'web' ? renderWebSelect(filterStatus, (e) => setFilterStatus(e.target.value), [{ value: 'ATIVOS', label: 'TODOS ATIVOS' }, { value: 'INATIVOS', label: 'INATIVOS' }, { value: 'PAGOS', label: 'PAGOS' }, { value: 'PENDENTES', label: 'PENDENTES' }]) : (
                        <View style={styles.pickerWrapper}><Picker selectedValue={filterStatus} onValueChange={setFilterStatus} style={{ color: theme.text }} dropdownIconColor={theme.accent}><Picker.Item label="TODOS ATIVOS" value="ATIVOS" /><Picker.Item label="INATIVOS" value="INATIVOS" /><Picker.Item label="PAGOS" value="PAGOS" /><Picker.Item label="PENDENTES" value="PENDENTES" /></Picker></View>
                    )}
                </View>

                <View style={[{ padding: isWebPC ? 15 : 0 }, isWebPC ? { flex: 1, borderRightWidth: 1, borderRightColor: theme.border } : { marginBottom: 15 }]}>
                    <Text style={styles.inputLabel}>VENCIMENTO</Text>
                    {Platform.OS === 'web' ? renderWebSelect(filterPrazo, (e) => setFilterPrazo(e.target.value), [{ value: 'TODOS', label: 'QUALQUER DATA' }, { value: 'VENCIDOS', label: 'VENCIDO OU BLOQUEADO (0 dias)' }, { value: 'ALERTA_3D', label: 'URGENTE (1 a 3 dias)' }, { value: 'ATENCAO_7D', label: 'RENOVAÇÃO (4 a 7 dias)' }, { value: 'NO_PRAZO', label: 'NO PRAZO (> 7 dias)' }]) : (
                        <View style={styles.pickerWrapper}><Picker selectedValue={filterPrazo} onValueChange={setFilterPrazo} style={{ color: theme.text }} dropdownIconColor={theme.accent}><Picker.Item label="QUALQUER DATA" value="TODOS" /><Picker.Item label="VENCIDO OU BLOQUEADO (0 dias)" value="VENCIDOS" /><Picker.Item label="URGENTE (1 a 3 dias)" value="ALERTA_3D" /><Picker.Item label="RENOVAÇÃO (4 a 7 dias)" value="ATENCAO_7D" /><Picker.Item label="NO PRAZO (> 7 dias)" value="NO_PRAZO" /></Picker></View>
                    )}
                </View>

                <View style={[{ padding: isWebPC ? 15 : 0 }, isWebPC ? { flex: 1 } : {}]}>
                    <Text style={styles.inputLabel}>CATEGORIA</Text>
                    {Platform.OS === 'web' ? renderWebSelect(filterCategory, (e) => setFilterCategory(e.target.value), [{ value: 'TODOS', label: 'TODAS' }, ...CATEGORIAS_OFFLINE.map(c => ({ value: c, label: c }))]) : (
                        <View style={styles.pickerWrapper}><Picker selectedValue={filterCategory} onValueChange={setFilterCategory} style={{ color: theme.text }} dropdownIconColor={theme.accent}><Picker.Item label="TODAS" value="TODOS" />{CATEGORIAS_OFFLINE.map(c => <Picker.Item key={c} label={c} value={c} />)}</Picker></View>
                    )}
                </View>
            </View>

            <View style={{ flexDirection: isWebPC ? 'row' : 'column', gap: 15, marginBottom: 30 }}>
                <View style={[styles.metricCard, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.isDark ? 'transparent' : '#000', flex: isWebPC ? 1 : undefined, width: isWebPC ? 'auto' : '100%' }]}>
                    <View style={styles.metricHeader}>
                        <View style={[styles.iconBox, { backgroundColor: '#34C75922' }]}><MaterialCommunityIcons name="cash-check" size={18} color="#34C759" /></View>
                        <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>ENTRADA DO MÊS</Text>
                    </View>
                    <Text style={[styles.metricValue, { color: '#34C759' }]}>{formatCurrency(metrics.entrada)}</Text>
                </View>
                <View style={[styles.metricCard, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.isDark ? 'transparent' : '#000', flex: isWebPC ? 1 : undefined, width: isWebPC ? 'auto' : '100%' }]}>
                    <View style={styles.metricHeader}>
                        <View style={[styles.iconBox, { backgroundColor: '#FF3B3022' }]}><MaterialCommunityIcons name="cash-remove" size={18} color="#FF3B30" /></View>
                        <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>PENDENTE (ATIVOS)</Text>
                    </View>
                    <Text style={[styles.metricValue, { color: '#FF3B30' }]}>{formatCurrency(metrics.pendente)}</Text>
                </View>
                <View style={[styles.metricCard, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.isDark ? 'transparent' : '#000', flex: isWebPC ? 1 : undefined, width: isWebPC ? 'auto' : '100%' }]}>
                    <View style={styles.metricHeader}>
                        <View style={[styles.iconBox, { backgroundColor: '#007AFF22' }]}><MaterialCommunityIcons name="cash-multiple" size={18} color="#007AFF" /></View>
                        <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>PREVISÃO TOTAL</Text>
                    </View>
                    <Text style={[styles.metricValue, { color: '#007AFF' }]}>{formatCurrency(metrics.previsao)}</Text>
                </View>
            </View>

            <View style={[styles.listContainer, isWebPC ? { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.isDark ? 'transparent' : '#000' } : { backgroundColor: 'transparent', borderWidth: 0, padding: 0, elevation: 0, shadowOpacity: 0 } ]}>
                
                {isWebPC && (
                    <View style={[styles.listHeader, { borderBottomColor: theme.border }]}>
                        <Text style={[styles.listHeaderTitle, { color: theme.textSecondary, flex: 2 }]}>ALUNO E PLANO</Text>
                        <Text style={[styles.listHeaderTitle, { color: theme.textSecondary, width: 150, textAlign: 'center' }]}>STATUS</Text>
                        <Text style={[styles.listHeaderTitle, { color: theme.textSecondary, flex: 1, textAlign: 'right' }]}>AÇÕES RÁPIDAS</Text>
                    </View>
                )}

                {studentList.map(aluno => {
                    const dueStatus = getDueDateStatus(aluno.paymentDueDate, theme);
                    const isInactive = !aluno.isFinanceActive;

                    return isWebPC ? (
                        <View key={aluno.id} style={[styles.listItem, { borderBottomColor: theme.border, flexDirection: 'row', alignItems: 'center', opacity: isInactive ? 0.5 : 1 }]}>
                            <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                {aluno.photoUrl ? (
                                    <View style={[styles.avatar, { overflow: 'hidden' }]}><Image source={{ uri: aluno.photoUrl }} style={{ width: '100%', height: '100%' }} /></View>
                                ) : (
                                    <View style={[styles.avatarPlaceholder, { borderColor: theme.border }]}><MaterialCommunityIcons name="account" size={24} color={theme.textSecondary} /></View>
                                )}
                                <View style={{ flex: 1 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                        <Text style={[styles.studentName, { color: theme.text }, isInactive && { textDecorationLine: 'line-through' }]} numberOfLines={1}>{aluno.name}</Text>
                                        {aluno.isOffline && <MaterialCommunityIcons name="cloud-off-outline" size={12} color={theme.textSecondary} title="Aluno Offline" />}
                                        {isInactive && <MaterialCommunityIcons name="power-plug-off" size={12} color="#FF3B30" title="Inativo" />}
                                    </View>
                                    <Text style={styles.studentPlan} numberOfLines={1}>
                                        {aluno.financeCategory || 'Consultoria Online'} - {formatCurrency(aluno.contractValue || 0)}
                                    </Text>
                                    
                                    {aluno.paymentDueDate && !isInactive && (
                                        <View style={[styles.dueDateBadge, { borderColor: dueStatus.border, backgroundColor: dueStatus.color + '15' }]}>
                                            <MaterialCommunityIcons name={dueStatus.days <= 0 ? "lock" : "calendar-clock"} size={12} color={dueStatus.color} />
                                            <Text style={{color: dueStatus.color, fontSize: 9, fontWeight: '900', marginLeft: 4}}>
                                                {dueStatus.days < 0 
                                                    ? `BLOQUEADO (VENCIDO HÁ ${Math.abs(dueStatus.days)} DIAS)` 
                                                    : dueStatus.days === 0 
                                                        ? 'BLOQUEADO HOJE' 
                                                        : `VENCE EM ${dueStatus.days} DIAS`}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </View>

                            <View style={{ width: 150, alignItems: 'center' }}>
                                <View style={[styles.statusBadge, { backgroundColor: isInactive ? theme.bg : (aluno.isPaid ? '#34C75922' : '#FF3B3022') }]}>
                                    <Text style={[styles.statusText, { color: isInactive ? theme.textSecondary : (aluno.isPaid ? '#34C759' : '#FF3B30') }]}>
                                        {isInactive ? 'INATIVO' : (aluno.isPaid ? 'PAGO NO MÊS' : 'PENDENTE NO MÊS')}
                                    </Text>
                                </View>
                            </View>

                            <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 6 }}>
                                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#32ADE622' }]} onPress={() => openEditModal(aluno)}>
                                    <MaterialCommunityIcons name="pencil" size={16} color="#32ADE6" />
                                </TouchableOpacity>
                                
                                <TouchableOpacity 
                                    style={[styles.actionBtn, { backgroundColor: aluno.isPaid ? theme.bg : '#34C759', borderColor: aluno.isPaid ? theme.border : '#34C759', borderWidth: 1, paddingHorizontal: 10, flexDirection: 'row', gap: 5, width: 'auto' }]} 
                                    onPress={() => handleTogglePagamento(aluno)} 
                                    disabled={loadingId === aluno.id || isInactive}
                                >
                                    {loadingId === aluno.id ? <ActivityIndicator size="small" color="#FFF" /> : (
                                        <>
                                            <MaterialCommunityIcons name={aluno.isPaid ? "undo-variant" : "cash-check"} size={16} color={aluno.isPaid ? theme.textSecondary : '#FFF'} />
                                            <Text style={{ color: aluno.isPaid ? theme.textSecondary : '#FFF', fontSize: 11, fontWeight: 'bold' }}>{aluno.isPaid ? 'ESTORNAR' : 'PAGO'}</Text>
                                        </>
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#25D36622' }]} onPress={() => openWhatsApp(aluno.phone, aluno.name)}>
                                    <MaterialCommunityIcons name="whatsapp" size={18} color="#25D366" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <View key={aluno.id} style={[styles.mobileCard, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.isDark ? 'transparent' : '#000', opacity: isInactive ? 0.6 : 1 }]}>
                            <View style={styles.mobileCardHeader}>
                                {aluno.photoUrl ? (
                                    <Image source={{ uri: aluno.photoUrl }} style={styles.mobileAvatar} />
                                ) : (
                                    <View style={[styles.mobileAvatarPlaceholder, { borderColor: theme.border }]}><MaterialCommunityIcons name="account" size={24} color={theme.textSecondary} /></View>
                                )}
                                <View style={styles.mobileCardInfo}>
                                    <Text style={[styles.mobileStudentName, { color: theme.text }, isInactive && { textDecorationLine: 'line-through' }]} numberOfLines={1}>{aluno.name}</Text>
                                    <Text style={styles.mobileStudentCategory}>{aluno.financeCategory || 'Consultoria Online'}</Text>
                                    
                                    {aluno.paymentDueDate && !isInactive && (
                                        <View style={[styles.dueDateBadge, { borderColor: dueStatus.border, backgroundColor: dueStatus.color + '15' }]}>
                                            <MaterialCommunityIcons name={dueStatus.days <= 0 ? "lock" : "calendar-clock"} size={12} color={dueStatus.color} />
                                            <Text style={{color: dueStatus.color, fontSize: 9, fontWeight: '900', marginLeft: 4}}>
                                                {dueStatus.days < 0 
                                                    ? `BLOQUEADO (VENCIDO HÁ ${Math.abs(dueStatus.days)} DIAS)` 
                                                    : dueStatus.days === 0 
                                                        ? 'BLOQUEADO HOJE' 
                                                        : `VENCE EM ${dueStatus.days} DIAS`}
                                            </Text>
                                        </View>
                                    )}
                                    {isInactive && (
                                        <View style={[styles.dueDateBadge, { borderColor: theme.border, backgroundColor: theme.bg }]}>
                                            <MaterialCommunityIcons name="power-plug-off" size={12} color={theme.textSecondary} />
                                            <Text style={{color: theme.textSecondary, fontSize: 9, fontWeight: '900', marginLeft: 4}}>ALUNO INATIVO</Text>
                                        </View>
                                    )}
                                </View>
                            </View>

                            <View style={[styles.mobileFinanceBanner, { backgroundColor: isInactive ? theme.bg : (aluno.isPaid ? '#34C75922' : '#FF3B3022') }]}>
                                <MaterialCommunityIcons name="wallet-outline" size={16} color={isInactive ? theme.textSecondary : (aluno.isPaid ? '#34C759' : '#FF3B30')} />
                                <Text style={[styles.mobileFinanceBannerText, { color: isInactive ? theme.textSecondary : (aluno.isPaid ? '#34C759' : '#FF3B30') }]}>
                                    {isInactive ? 'INATIVO NO MÊS' : (aluno.isPaid ? 'MÊS PAGO' : 'MÊS PENDENTE')} • {formatCurrency(aluno.contractValue || 0)}
                                </Text>
                            </View>

                            <View style={styles.mobileActionRow}>
                                <TouchableOpacity 
                                    style={[styles.mobileBtnHalf, { backgroundColor: aluno.isPaid ? theme.bg : theme.accent, borderColor: aluno.isPaid ? theme.border : theme.accent, borderWidth: 1 }]} 
                                    onPress={() => handleTogglePagamento(aluno)} 
                                    disabled={loadingId === aluno.id || isInactive}
                                >
                                    {loadingId === aluno.id ? <ActivityIndicator size="small" color={aluno.isPaid ? theme.text : '#FFF'} /> : (
                                        <>
                                            <MaterialCommunityIcons name={aluno.isPaid ? "undo-variant" : "cash-check"} size={16} color={aluno.isPaid ? theme.textSecondary : (theme.isDark ? '#000' : '#FFF')} />
                                            <Text style={[styles.mobileBtnHalfText, { color: aluno.isPaid ? theme.textSecondary : (theme.isDark ? '#000' : '#FFF') }]}>
                                                {aluno.isPaid ? 'ESTORNAR DATA' : 'MARCAR PAGO'}
                                            </Text>
                                        </>
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity style={[styles.mobileBtnHalf, { backgroundColor: theme.isDark ? '#222' : '#111' }]} onPress={() => openEditModal(aluno)}>
                                    <MaterialCommunityIcons name="pencil" size={16} color="#FFF" />
                                    <Text style={[styles.mobileBtnHalfText, { color: '#FFF' }]}>EDITAR</Text>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity style={styles.mobileBtnWhatsApp} onPress={() => openWhatsApp(aluno.phone, aluno.name)}>
                                <MaterialCommunityIcons name="whatsapp" size={18} color="#FFF" />
                                <Text style={styles.mobileBtnWhatsAppText}>WHATSAPP (MSG)</Text>
                            </TouchableOpacity>
                        </View>
                    )
                })}

                {studentList.length === 0 && <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Nenhum aluno encontrado neste filtro.</Text>}
            </View>

            {/* 🔥 MODAL DE EDIÇÃO DE CONTRATO 🔥 */}
            <Modal visible={!!editingAluno} transparent animationType="fade" onRequestClose={closeEditModal}>
                <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={closeEditModal}>
                    <TouchableOpacity activeOpacity={1} style={[styles.modernModalContent, { backgroundColor: theme.bg, borderColor: theme.border }]}>

                        <View style={styles.modernModalHeader(theme)}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                <View style={[styles.iconBox, { backgroundColor: theme.accent + '22' }]}><MaterialCommunityIcons name="pencil-lock" size={18} color={theme.accent} /></View>
                                <View>
                                    <Text style={[styles.modalTitle, {color: theme.text}]}>Atualizar Dados</Text>
                                    <Text style={{color: theme.textSecondary, fontSize: 11}}>ID: {editingAluno?.id}</Text>
                                    <Text style={{color: theme.textSecondary, fontSize: 11}}>{editingAluno?.name}</Text>
                                </View>
                            </View>
                            <TouchableOpacity onPress={closeEditModal} style={styles.closeButton}><MaterialCommunityIcons name="close" size={26} color={theme.textSecondary} /></TouchableOpacity>
                        </View>

                        <View style={{ gap: 20 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: isFinanceActiveEdit ? theme.accent : theme.border, backgroundColor: isFinanceActiveEdit ? theme.accent + '15' : theme.surface }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ color: isFinanceActiveEdit ? theme.text : '#FF3B30', fontWeight: 'bold', fontSize: 13 }}>
                                        {isFinanceActiveEdit ? "Aluno Ativo no Financeiro" : "Aluno Inativo no Financeiro"}
                                    </Text>
                                    <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 4 }}>
                                        {isFinanceActiveEdit ? "Os valores pendentes entrarão na previsão do mês." : "O valor deste aluno foi congelado e não entrará mais na previsão."}
                                    </Text>
                                </View>
                                <Switch value={isFinanceActiveEdit} onValueChange={setIsFinanceActiveEdit} trackColor={{ false: theme.border, true: theme.accent }} thumbColor={Platform.OS === 'ios' ? '#FFF' : '#FFF'} />
                            </View>

                            <View style={styles.formRow(isWebPC)}>
                                <View style={{ flex: isWebPC ? 1 : undefined, width: isWebPC ? 'auto' : '100%' }}>
                                    <Text style={styles.inputLabel}>CATEGORIA NO FINANCEIRO</Text>
                                    {Platform.OS === 'web' ? renderWebSelect(financeCategoryEdit, (e) => setFinanceCategoryEdit(e.target.value), CATEGORIAS_OFFLINE.map(c => ({ value: c, label: c }))) : (
                                        <View style={[styles.pickerContainer, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                                            <Picker selectedValue={financeCategoryEdit} onValueChange={setFinanceCategoryEdit} style={{ color: theme.text }} dropdownIconColor={theme.accent}>
                                                {CATEGORIAS_OFFLINE.map(c => <Picker.Item key={c} label={c} value={c} />)}
                                            </Picker>
                                        </View>
                                    )}
                                </View>
                            </View>

                            <View style={{ flexDirection: isWebPC ? 'row' : 'column', gap: 15 }}>
                                <View style={{ flex: isWebPC ? 1 : undefined, width: isWebPC ? 'auto' : '100%' }}>
                                    <Text style={styles.inputLabel}>DURAÇÃO (TIPO DE PLANO)</Text>
                                    {Platform.OS === 'web' ? renderWebSelect(contractType, (e) => setContractType(e.target.value), [ { value: 'Mensal', label: 'Mensal' }, { value: 'Trimestral', label: 'Trimestral' }, { value: 'Semestral', label: 'Semestral' }, { value: 'Anual', label: 'Anual' }, { value: 'Projeto 90 Dias', label: 'Projeto 90 Dias' }, { value: 'Ficha 8 Semanas', label: 'Ficha 8 Semanas' } ]) : (
                                        <View style={[styles.pickerContainer, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                                            <Picker selectedValue={contractType} onValueChange={setContractType} style={{ color: theme.text }} dropdownIconColor={theme.accent}><Picker.Item label="Mensal" value="Mensal" /><Picker.Item label="Trimestral" value="Trimestral" /><Picker.Item label="Semestral" value="Semestral" /><Picker.Item label="Anual" value="Anual" /><Picker.Item label="Projeto 90 Dias" value="Projeto 90 Dias" /><Picker.Item label="Ficha 8 Semanas" value="Ficha 8 Semanas" /></Picker>
                                        </View>
                                    )}
                                </View>

                                <View style={{ flex: isWebPC ? 1 : undefined, width: isWebPC ? 'auto' : '100%' }}>
                                    <Text style={styles.inputLabel}>VALOR (R$)</Text>
                                    <TextInput style={[styles.inputLarge, { backgroundColor: theme.surface, color: theme.accent, borderColor: theme.border, textAlign: 'center' }]} placeholder="0.00" placeholderTextColor={theme.textSecondary} value={contractValue} onChangeText={setContractValue} keyboardType="numeric" />
                                </View>
                            </View>

                            {/* 🔥 ADIÇÃO DA DATA DE INÍCIO NO MODAL 🔥 */}
                            <View style={{ flexDirection: isWebPC ? 'row' : 'column', gap: 15 }}>
                                <View style={{ flex: isWebPC ? 1 : undefined, width: isWebPC ? 'auto' : '100%' }}>
                                    <Text style={styles.inputLabel}>DATA DE INÍCIO</Text>
                                    {/* 🔥 CORREÇÃO DO ERRO DA TELA BRANCA AQUI (style sem array) 🔥 */}
                                    {Platform.OS === 'web' ? createElement('input', { type: 'date', value: startDateEdit, onChange: (e) => setStartDateEdit(e.target.value), style: { ...styles.webDate(theme), flex: 1 } }) : (
                                        <TextInput style={[styles.inputLarge, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} placeholder="AAAA-MM-DD" value={startDateEdit} onChangeText={setStartDateEdit} />
                                    )}
                                </View>
                                <View style={{ flex: isWebPC ? 1 : undefined, width: isWebPC ? 'auto' : '100%' }}>
                                    <Text style={styles.inputLabel}>PRÓXIMO VENCIMENTO</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                        {Platform.OS === 'web' ? createElement('input', { type: 'date', value: paymentDueDate, onChange: (e) => setPaymentDueDate(e.target.value), style: { ...styles.webDate(theme), flex: 1 } }) : (
                                            <TextInput style={[styles.inputLarge, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border, flex: 1 }]} placeholder="AAAA-MM-DD" value={paymentDueDate} onChangeText={setPaymentDueDate} />
                                        )}
                                        <TouchableOpacity style={[styles.modernBtn, { backgroundColor: '#34C759' }]} onPress={() => setPaymentDueDate(calcularProximaData(paymentDueDate ? forceMiddayUTC(paymentDueDate) : new Date().toISOString(), contractType).split('T')[0])}>
                                            <MaterialCommunityIcons name="cash-plus" size={16} color="#FFF" />
                                            <Text style={styles.modernBtnText}>💰 RENOVOU</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>

                            <TouchableOpacity style={[styles.saveBtnLg, { backgroundColor: theme.accent, marginTop: 15, flexDirection: 'row', gap: 8, height: 54 }]} onPress={() => handleSaveModalContract()} disabled={isSavingContract}>
                                {isSavingContract ? <ActivityIndicator color={theme.isDark ? '#000' : '#FFF'} /> : (
                                    <><MaterialCommunityIcons name="content-save" size={20} color={theme.isDark ? '#000' : '#FFF'} /><Text style={{color: theme.isDark ? '#000' : '#FFF', fontWeight: '900', fontSize: 13, letterSpacing: 0.5}}>SALVAR E FECHAR</Text></>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity style={[styles.saveBtnLg, { backgroundColor: 'transparent', borderColor: '#FF3B30', borderWidth: 1, marginTop: 10, flexDirection: 'row', gap: 8, height: 54 }]} onPress={handleReverterPagamento} disabled={isSavingContract}>
                                <MaterialCommunityIcons name="undo-variant" size={20} color="#FF3B30" />
                                <Text style={{color: '#FF3B30', fontWeight: '900', fontSize: 13, letterSpacing: 0.5}}>REVERTER PAGAMENTO</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

            {/* 🔥 MODAL DE NOVO ALUNO OFFLINE MODERNIZADO 🔥 */}
            <Modal visible={isAddModalVisible} transparent animationType="slide" onRequestClose={() => setIsAddModalVisible(false)}>
                <View style={styles.modalBackdrop}>
                    <ScrollView contentContainerStyle={{ paddingVertical: 40, alignItems: 'center' }} showsVerticalScrollIndicator={false} style={{ width: '100%' }}>
                        <View style={[styles.addModalContent, { backgroundColor: theme.bg, borderColor: theme.border }]}>

                            <View style={styles.modernModalHeader(theme)}>
                                <Text style={[styles.modalTitle, {color: theme.text}]}>Cadastrar Aluno Offline</Text>
                                <TouchableOpacity onPress={() => setIsAddModalVisible(false)}><MaterialCommunityIcons name="close" size={26} color={theme.textSecondary} /></TouchableOpacity>
                            </View>

                            <View style={{ gap: 20 }}>
                                <View style={{ flexDirection: isWebPC ? 'row' : 'column', gap: 15 }}>
                                    <View style={{ flex: isWebPC ? 1 : undefined, width: isWebPC ? 'auto' : '100%' }}><Text style={styles.inputLabel}>NOME COMPLETO</Text><TextInput style={[styles.inputLarge, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} placeholder="Ex: Abner Kristopher" placeholderTextColor={theme.textSecondary} value={newName} onChangeText={setNewName} /></View>
                                    <View style={{ flex: isWebPC ? 1 : undefined, width: isWebPC ? 'auto' : '100%' }}><Text style={styles.inputLabel}>CATEGORIA NO FINANCEIRO</Text>{Platform.OS === 'web' ? renderWebSelect(newCategory, (e) => setNewCategory(e.target.value), CATEGORIAS_OFFLINE.map(c => ({ value: c, label: c }))) : <View style={[styles.pickerContainer, { borderColor: theme.border, backgroundColor: theme.surface }]}><Picker selectedValue={newCategory} onValueChange={setNewCategory} style={{ color: theme.text }} dropdownIconColor={theme.accent}>{CATEGORIAS_OFFLINE.map(c => <Picker.Item key={c} label={c} value={c} />)}</Picker></View>}</View>
                                </View>
                                
                                <View style={{ flexDirection: isWebPC ? 'row' : 'column', gap: 15 }}>
                                    <View style={{ flex: isWebPC ? 1 : undefined, width: isWebPC ? 'auto' : '100%' }}><Text style={styles.inputLabel}>TELEFONE</Text><TextInput style={[styles.inputLarge, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} placeholder="41 9999-9999" placeholderTextColor={theme.textSecondary} value={newPhone} onChangeText={setNewPhone} keyboardType="numeric" /></View>
                                    <View style={{ flex: isWebPC ? 1 : undefined, width: isWebPC ? 'auto' : '100%' }}><Text style={styles.inputLabel}>DURAÇÃO DO CONTRATO</Text>{Platform.OS === 'web' ? renderWebSelect(newDuration, (e) => setNewDuration(e.target.value), [ { value: 'Mensal', label: 'Mensal' }, { value: 'Trimestral', label: 'Trimestral' }, { value: 'Semestral', label: 'Semestral' }, { value: 'Anual', label: 'Anual' } ]) : <View style={[styles.pickerContainer, { borderColor: theme.border, backgroundColor: theme.surface }]}><Picker selectedValue={newDuration} onValueChange={setNewDuration} style={{ color: theme.text }} dropdownIconColor={theme.accent}><Picker.Item label="Mensal" value="Mensal" /><Picker.Item label="Trimestral" value="Trimestral" /><Picker.Item label="Semestral" value="Semestral" /><Picker.Item label="Anual" value="Anual" /></Picker></View>}</View>
                                </View>
                                
                                <View><Text style={styles.inputLabel}>VALOR TOTAL (R$)</Text><TextInput style={[styles.inputLarge, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} placeholder="Ex: 149,90" placeholderTextColor={theme.textSecondary} value={newValue} onChangeText={setNewValue} keyboardType="numeric" /></View>
                                
                                <View style={{ flexDirection: isWebPC ? 'row' : 'column', gap: 15 }}>
                                    <View style={{ flex: isWebPC ? 1 : undefined, width: isWebPC ? 'auto' : '100%' }}><Text style={styles.inputLabel}>DATA INÍCIO</Text>{Platform.OS === 'web' ? createElement('input', { type: 'date', value: newStartDate, onChange: (e) => setNewStartDate(e.target.value), style: { ...styles.webDate(theme), flex: 1 } }) : <TextInput style={[styles.inputLarge, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} placeholder="AAAA-MM-DD" value={newStartDate} onChangeText={setNewStartDate} />}</View>
                                    <View style={{ flex: isWebPC ? 1 : undefined, width: isWebPC ? 'auto' : '100%' }}><Text style={styles.inputLabel}>VENCIMENTO</Text>{Platform.OS === 'web' ? createElement('input', { type: 'date', value: newDueDate, onChange: (e) => setNewDueDate(e.target.value), style: { ...styles.webDate(theme), flex: 1 } }) : <TextInput style={[styles.inputLarge, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} placeholder="AAAA-MM-DD" value={newDueDate} onChangeText={setNewDueDate} />}</View>
                                </View>
                                
                                <View style={{ marginTop: 10 }}>
                                    <Text style={[styles.inputLabel, { fontStyle: 'italic', color: theme.textSecondary }]}>MÍDIA / FOTO DE PERFIL</Text>
                                    <View style={[styles.mediaBox, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                                        {uploadingPhoto ? <ActivityIndicator color={theme.accent} size="small" /> : newPhotoUrl ? <View style={styles.mediaPreviewAvatar}>{Platform.OS === 'web' ? <img src={newPhotoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Avatar" /> : <Image source={{ uri: newPhotoUrl }} style={{ width: '100%', height: '100%' }} />}</View> : <View style={styles.mediaPlaceholder}><MaterialCommunityIcons name="account-circle" size={32} color={theme.textSecondary} /></View>}
                                        <TouchableOpacity style={[styles.uploadBtn, { backgroundColor: '#1C1C1E' }]} onPress={handlePickImage}><MaterialCommunityIcons name="upload" size={16} color="#FFF" /><Text style={{color: '#FFF', fontWeight: 'bold', fontSize: 11, letterSpacing: 0.5}}>SELECIONAR DA GALERIA</Text></TouchableOpacity>
                                    </View>
                                </View>

                                <TouchableOpacity style={[styles.saveBtnLg, { backgroundColor: theme.accent, marginTop: 10, flexDirection: 'row', gap: 8, height: 54 }]} onPress={handleSaveNewOfflineClient} disabled={isSavingNew}>
                                    {isSavingNew ? <ActivityIndicator color={theme.isDark ? '#000' : '#FFF'} /> : <><MaterialCommunityIcons name="content-save" size={20} color={theme.isDark ? '#000' : '#FFF'} /><Text style={{color: theme.isDark ? '#000' : '#FFF', fontWeight: '900', fontSize: 13, letterSpacing: 0.5}}>SALVAR DADOS CADASTRAIS</Text></>}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ScrollView>
                </View>
            </Modal>

        </View>
    );
}

const styles = StyleSheet.create({
    headerCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderRadius: 16, borderWidth: 1, marginBottom: 20, elevation: 2, shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, shadowRadius: 4, flexWrap: 'wrap', gap: 10 },
    mainLabel: { fontWeight: '900', fontSize: 18, letterSpacing: -0.5, marginBottom: 0 },
    addBtnModern: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 15, height: 40, borderRadius: 10, elevation: 3 },
    addBtnText: { fontWeight: '900', fontSize: 11, letterSpacing: 0.5 },

    searchBar: { padding: 14, borderRadius: 12, marginBottom: 20, borderWidth: 1, outlineStyle: 'none', fontSize: 14, fontWeight: 'bold' },

    filterBar: { borderRadius: 16, borderWidth: 1, marginBottom: 25, elevation: 1, overflow: 'hidden' },
    inputLabel: { color: '#888', fontSize: 10, fontWeight: '900', marginBottom: 6, letterSpacing: 1 },

    webSelectWrapper: (theme) => ({ position: 'relative', width: '100%', borderRadius: 10, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface }),
    webSelectInput: (theme) => ({ width: '100%', padding: '12px 35px 12px 12px', backgroundColor: 'transparent', color: theme.text, border: 'none', outline: 'none', fontWeight: 'bold', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', fontSize: '13px', appearance: 'none', '-webkit-appearance': 'none', '-moz-appearance': 'none', cursor: 'pointer' }),
    webSelectIcon: { position: 'absolute', right: 10, top: '50%', marginTop: -10, pointerEvents: 'none' },
    pickerWrapper: { borderRadius: 10, borderWidth: 1, borderColor: '#333', backgroundColor: '#1A1A1A', overflow: 'hidden' },

    metricCard: { padding: 20, borderRadius: 16, borderWidth: 1, elevation: 2, shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, shadowRadius: 4 },
    metricHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15 },
    iconBox: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    metricLabel: { fontWeight: '900', fontSize: 11, letterSpacing: 0.5 },
    metricValue: { fontSize: 26, fontWeight: '900', letterSpacing: -1 },

    listContainer: { borderRadius: 16, borderWidth: 1, padding: 10, marginBottom: 50 },
    listHeader: { flexDirection: 'row', padding: 15, borderBottomWidth: 1 },
    listHeaderTitle: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
    listItem: { padding: 15, borderBottomWidth: 1, gap: 0 },

    dueDateBadge: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingHorizontal: 12, 
        paddingVertical: 6, 
        borderRadius: 20, 
        borderWidth: 1, 
        marginTop: 8,
        alignSelf: 'flex-start',
        shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 
    },

    mobileCard: { borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1, elevation: 3, shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.1, shadowRadius: 6 },
    mobileCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    mobileAvatar: { width: 48, height: 48, borderRadius: 24 },
    mobileAvatarPlaceholder: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
    mobileCardInfo: { flex: 1, marginLeft: 15 },
    mobileStudentName: { fontSize: 16, fontWeight: '900', textTransform: 'uppercase' },
    mobileStudentCategory: { color: '#888', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', marginTop: 2 },
    mobileBadgesRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
    mobileBadgeDark: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 5 },
    mobileBadgeDarkText: { color: '#FFF', fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 },
    mobileFinanceBanner: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 12, borderRadius: 12, marginBottom: 15, gap: 8 },
    mobileFinanceBannerText: { fontSize: 13, fontWeight: '900', letterSpacing: 1 },
    mobileActionRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
    mobileBtnHalf: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 14, borderRadius: 12, gap: 6 },
    mobileBtnHalfText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
    mobileBtnWhatsApp: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#25D366', paddingVertical: 14, borderRadius: 12, gap: 8 },
    mobileBtnWhatsAppText: { color: '#FFF', fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },

    avatar: { width: 40, height: 40, borderRadius: 20 },
    avatarPlaceholder: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
    studentName: { fontWeight: '900', fontSize: 13, marginBottom: 1 },
    studentPlan: { color: '#888', fontSize: 11, fontWeight: 'bold' },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, alignSelf: 'center' },
    statusText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
    actionBtn: { height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center', minWidth: 36 },
    emptyText: { textAlign: 'center', padding: 30, fontStyle: 'italic', fontWeight: 'bold' },

    formRow: (isDesktop) => ({ flexDirection: isDesktop ? 'row' : 'column', gap: 15 }),
    
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: Platform.OS === 'web' && Dimensions.get('window').width > 768 ? 20 : 10 },
    modernModalContent: { width: '100%', maxWidth: 650, borderRadius: 24, padding: Platform.OS === 'web' && Dimensions.get('window').width > 768 ? 30 : 20, borderWidth: 1, elevation: 10 },
    modernModalHeader: (theme) => ({ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25, borderBottomWidth: 1, borderColor: theme.border, paddingBottom: 15 }),
    modalTitle: { fontWeight: '900', fontSize: 18, letterSpacing: -0.5 },

    addModalContent: { width: '100%', maxWidth: 800, alignSelf: 'center', borderRadius: 24, padding: Platform.OS === 'web' && Dimensions.get('window').width > 768 ? 30 : 20, borderWidth: 1 },
    cardTitle: { fontSize: 14, fontWeight: '900', letterSpacing: 0.5, marginBottom: 2 },

    inputLarge: { padding: 15, borderRadius: 12, borderWidth: 1, fontSize: 14, fontWeight: 'bold' },

    webDate: (theme) => ({ width: '100%', padding: '14px', borderRadius: '12px', border: `1px solid ${theme.border}`, backgroundColor: theme.surface, color: theme.text, outline: 'none', fontSize: '14px', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', fontWeight: 'bold', boxSizing: 'border-box' }),

    modernBtn: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 12, height: 48, borderRadius: 12, elevation: 3 },
    modernBtnText: { color: '#FFF', fontWeight: '900', fontSize: 11, letterSpacing: 0.5 },

    saveBtnLg: { height: 54, borderRadius: 12, justifyContent: 'center', alignItems: 'center', elevation: 2 },
    pickerContainer: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },

    mediaBox: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', gap: 15 },
    mediaPreviewAvatar: { width: 48, height: 48, borderRadius: 8, overflow: 'hidden' },
    mediaPlaceholder: { width: 48, height: 48, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.05)', justifyContent: 'center', alignItems: 'center' },
    uploadBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 15, paddingVertical: 12, borderRadius: 8, elevation: 2 },
});