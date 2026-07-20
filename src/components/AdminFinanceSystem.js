// src/components/AdminFinanceSystem.js

import React, { useState, useMemo, useEffect } from 'react';
import { View, Platform, Linking, Alert, useWindowDimensions, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Utilitários
import { calcularProximaData, calcularDataAnterior, getDueDateStatus, forceMiddayUTC } from '../utils/financeUtils';

// Componentes Filhos
import FinanceHeaderMetrics from './AdminFinance/FinanceHeaderMetrics';
import FinanceFilters from './AdminFinance/FinanceFilters';
import FinanceStudentList from './AdminFinance/FinanceStudentList';
import FinanceEditModal from './AdminFinance/FinanceEditModal';
import FinanceAddModal from './AdminFinance/FinanceAddModal';
import FinanceChargeModal from './AdminFinance/FinanceChargeModal';
import AsaasPaymentsPanel from './AdminFinance/AsaasPaymentsPanel';

const getInterval = (type) => {
    const t = (type || '').toLowerCase();
    if (t.includes('trimestral')) return 3;
    if (t.includes('semestral')) return 6;
    if (t.includes('anual')) return 12;
    if (t.includes('bimestral')) return 2;
    return 1; 
};

export default function AdminFinanceSystem({ theme, alunos, coachFilter, getLogCoach }) {
    const { width } = useWindowDimensions();
    const isWebPC = Platform.OS === 'web' && width > 768;

    const currentMonthIndex = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // 🚀 NOVO: Estado para alternar entre Alunos e Coaches (SaaS)
    const [viewMode, setViewMode] = useState('ALUNOS'); // 'ALUNOS' | 'COACHES'
    const [currentUserId, setCurrentUserId] = useState(null);

    // Estados de Filtros
    const [selectedMonth, setSelectedMonth] = useState(currentMonthIndex);
    const [filterStatus, setFilterStatus] = useState('ATIVOS'); 
    const [filterCategory, setFilterCategory] = useState('TODOS'); 
    const [filterPrazo, setFilterPrazo] = useState('TODOS'); 
    const [searchQuery, setSearchQuery] = useState(''); 

    // Estados de Dados
    const [localAlunos, setLocalAlunos] = useState([]);
    const [offlineClients, setOfflineClients] = useState([]); 
    const [loadingId, setLoadingId] = useState(null);
    const [renderTrigger, setRenderTrigger] = useState(0);

    // Estados dos Modais
    const [editingAluno, setEditingAluno] = useState(null);
    const [contractType, setContractType] = useState('Mensal');
    const [contractValue, setContractValue] = useState('0');
    const [startDateEdit, setStartDateEdit] = useState(''); 
    const [paymentDueDate, setPaymentDueDate] = useState('');
    const [financeCategoryEdit, setFinanceCategoryEdit] = useState('Consultoria Online');
    const [isFinanceActiveEdit, setIsFinanceActiveEdit] = useState(true);
    const [editPhotoUrl, setEditPhotoUrl] = useState(''); 
    const [isUploadingEditPhoto, setIsUploadingEditPhoto] = useState(false); 
    const [isSavingContract, setIsSavingContract] = useState(false);
    const [chargeAluno, setChargeAluno] = useState(null);

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

    // Identifica se é o Master (Paulo ou Adri)
    useEffect(() => {
        AsyncStorage.getItem('user').then(u => {
            if (u) {
                const parsed = JSON.parse(u);
                setCurrentUserId(parsed.id);
            }
        });
    }, []);
    const isMaster = currentUserId === '3c82f763-66b4-48da-836e-16817d4f57c0' || currentUserId === 'b7c0c181-41fd-4156-b8fe-963a267759a3';

    // Efeitos (Migração e Carregamento)
    useEffect(() => {
        const migrateOfflineClients = async () => {
            try {
                const cachedOffline = await AsyncStorage.getItem('@offline_clients');
                if (cachedOffline) {
                    const clients = JSON.parse(cachedOffline);
                    if (clients?.length > 0) {
                        for (const client of clients) {
                            await fetch('https://fitos-final.onrender.com/api/admin/offline-clients', {
                                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(client)
                            });
                        }
                        await AsyncStorage.removeItem('@offline_clients');
                    }
                }
            } catch (e) { console.error("Erro na migração:", e); }
        };
        migrateOfflineClients();
    }, []);

    useEffect(() => {
        fetch('https://fitos-final.onrender.com/api/admin/offline-clients/get')
            .then(res => res.json())
            .then(data => setOfflineClients(data || []))
            .catch(e => console.error("Erro ao buscar offline:", e));
    }, []);

    useEffect(() => { setLocalAlunos(alunos || []); }, [alunos]);

    useEffect(() => {
        const loadOfflineClients = async () => {
            try {
                const saved = await AsyncStorage.getItem('@offline_clients');
                if (saved) setOfflineClients(JSON.parse(saved) || []);
            } catch (e) { console.error("Erro ao carregar offline", e); }
        };
        loadOfflineClients();
    }, []);

    // ─── LÓGICA DE FILTRAGEM INTELIGENTE DOS MESES ───
    
    // 1. Junta os dados e separa COACHES de ALUNOS
    const todosAlunosFinanceiro = useMemo(() => {
        const mix = [...(localAlunos || []).map(a => ({...a})), ...(offlineClients || []).map(a => ({...a}))];
        
        // MODO COACHES PARCEIROS (SaaS)
        if (viewMode === 'COACHES') {
            return mix.filter(a => {
                const r = (a.role || a.type || '').toUpperCase();
                return r === 'COACH' && !a.isOffline;
            }).map(aluno => ({
                ...aluno,
                financeCategory: aluno.coachBillingPlan || 'SaaS Coach', 
                isFinanceActive: aluno.isFinanceActive !== undefined ? aluno.isFinanceActive : true
            }));
        }

        // MODO ALUNOS (Padrão)
        return mix.filter(a => {
            const r = (a.role || a.type || '').toUpperCase();
            if (r === 'COACH' || r === 'ADMIN') return false; // Esconde os coaches daqui

            if (a.isOffline) return a.assignedCoach === coachFilter;
            return getLogCoach(a) === coachFilter;
        }).map(aluno => ({
            ...aluno,
            financeCategory: aluno.financeCategory || (aluno.isOffline ? aluno.plan : 'Consultoria Online'),
            isFinanceActive: aluno.isFinanceActive !== undefined ? aluno.isFinanceActive : true
        }));
    }, [localAlunos, offlineClients, coachFilter, getLogCoach, renderTrigger, viewMode]);

    // 2. Filtra QUEM ESTÁ ATIVO e QUEM COBRA no mês selecionado
    const enrichedStudentList = useMemo(() => {
        const targetStart = new Date(currentYear, selectedMonth, 1);
        const targetEnd = new Date(currentYear, selectedMonth + 1, 0, 23, 59, 59, 999);

        return (todosAlunosFinanceiro || []).map(aluno => {
            const anchorStartStr = aluno.startDate || aluno.createdAt || new Date().toISOString();
            const startDate = new Date(anchorStartStr);
            
            const startMonth = startDate.getMonth();
            const startYear = startDate.getFullYear();

            const isNewThisMonth = startYear === currentYear && startMonth === selectedMonth;
            const started = startDate <= targetEnd;

            let isBillingMonth = false;
            if (started) {
                const diffMonths = (currentYear - startYear) * 12 + (selectedMonth - startMonth);
                const interval = getInterval(aluno.contractType);
                if (diffMonths >= 0 && diffMonths % interval === 0) {
                    isBillingMonth = true;
                }
            }

            const dueDateStr = aluno.paymentDueDate;
            const isPaid = dueDateStr ? new Date(dueDateStr) > targetEnd : false;

            return {
                ...aluno,
                isPaid,
                isBillingMonth,
                started,
                isNewThisMonth
            };
        }).filter(a => a.started); 
    }, [todosAlunosFinanceiro, selectedMonth, currentYear]);

    // 3. Calcula as Métricas
    const metrics = useMemo(() => {
        let entrada = 0; let pendente = 0; let previsao = 0;

        (enrichedStudentList || []).forEach(aluno => {
            if (aluno.isBillingMonth) {
                const valor = parseFloat(aluno.contractValue) || 0;
                if (aluno.isPaid) {
                    entrada += valor; 
                    previsao += valor;
                } else if (aluno.isFinanceActive) {
                    pendente += valor; 
                    previsao += valor;
                }
            }
        });
        return { entrada, pendente, previsao };
    }, [enrichedStudentList]);

    // 4. Constrói a lista visual
    const studentList = useMemo(() => {
        let list = [...(enrichedStudentList || [])];

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
    }, [enrichedStudentList, filterStatus, filterCategory, filterPrazo, searchQuery, theme]);

    // ─── DADOS DO GRÁFICO DE CRESCIMENTO ───
    const totalAtivosNoMes = (enrichedStudentList || []).filter(a => a.isFinanceActive).length;
    const novosNoMes = (enrichedStudentList || []).filter(a => a.isFinanceActive && a.isNewThisMonth).length;
    const retidosNoMes = totalAtivosNoMes - novosNoMes;

    const percNovos = totalAtivosNoMes > 0 ? (novosNoMes / totalAtivosNoMes) * 100 : 0;
    const percRetidos = totalAtivosNoMes > 0 ? (retidosNoMes / totalAtivosNoMes) * 100 : 0;

    const openChargeModal = (aluno) => {
        if (aluno?.isOffline) {
            const msg = "Alunos offline não têm conta no app. Para cobrar via Asaas, o aluno precisa ter cadastro no ELITE FIT.";
            if (Platform.OS === 'web') window.alert(msg);
            else Alert.alert("Aluno offline", msg);
            return;
        }
        setChargeAluno(aluno);
    };

    const handleTogglePagamento = async (aluno) => {
        const isCurrentlyPaid = aluno.isPaid;
        const msg = isCurrentlyPaid ? `Deseja CANCELAR o pagamento de ${aluno.name}?` : `Deseja REGISTRAR o pagamento de ${aluno.name}?`;

        const confirmAction = async () => {
            setLoadingId(aluno.id);
            try {
                const tipoContrato = aluno.contractType || 'Mensal';
                const dataBase = aluno.paymentDueDate ? aluno.paymentDueDate : new Date().toISOString();
                const novaDataISO = isCurrentlyPaid ? calcularDataAnterior(dataBase, tipoContrato) : calcularProximaData(dataBase, tipoContrato);
                const updatedData = { paymentDueDate: novaDataISO };

                if (aluno.isOffline) {
                    const newList = offlineClients.map(a => a.id === aluno.id ? { ...a, ...updatedData } : a);
                    setOfflineClients([...newList]);
                    await AsyncStorage.setItem('@offline_clients', JSON.stringify(newList));
                } else {
                    setLocalAlunos(prev => prev.map(a => a.id === aluno.id ? { ...a, ...updatedData } : a));
                }

                const parentRef = (alunos || []).find(a => a.id === aluno.id);
                if (parentRef) Object.assign(parentRef, updatedData);

                setRenderTrigger(prev => prev + 1);

                await fetch('https://fitos-final.onrender.com/api/admin/update-contract', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: aluno.id, contractType: tipoContrato, contractValue: parseFloat(aluno.contractValue) || 0, paymentDueDate: novaDataISO, financeCategory: aluno.financeCategory || 'Consultoria Online', isFinanceActive: aluno.isFinanceActive !== undefined ? aluno.isFinanceActive : true }),
                });

                if (Platform.OS === 'web') window.alert(isCurrentlyPaid ? "Pagamento estornado!" : "Pagamento registrado!");
            } catch (error) {
                console.error("Erro:", error);
                if (Platform.OS === 'web') window.alert("Erro ao processar.");
            } finally { setLoadingId(null); }
        };

        if (Platform.OS === 'web') { if (window.confirm(msg)) confirmAction(); } 
        else { Alert.alert(isCurrentlyPaid ? "Estornar" : "Confirmar", msg, [{ text: "Cancelar", style: "cancel" }, { text: "Sim", style: isCurrentlyPaid ? 'destructive' : 'default', onPress: confirmAction }]); }
    };

    const openWhatsApp = (phone, name) => {
        if (!phone) return;
        const message = `Olá ${name}, tudo bem? Estou entrando em contato para falar sobre sua consultoria...`;
        const url = `whatsapp://send?phone=+55${phone.replace(/\D/g, '')}&text=${encodeURIComponent(message)}`;
        Linking.openURL(url).catch(() => {
            if (Platform.OS === 'web') window.alert("Instale o WhatsApp.");
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
        setEditPhotoUrl(aluno.photoUrl || ''); 
    };

    const closeEditModal = () => {
        setEditingAluno(null); setContractType('Mensal'); setContractValue('0'); setStartDateEdit(''); setPaymentDueDate(''); setFinanceCategoryEdit('Consultoria Online'); setIsFinanceActiveEdit(true); setEditPhotoUrl('');
    };

    const handleUploadR2 = async (uri) => {
        try {
            const response = await fetch(uri);
            const blob = await response.blob();

            let ext = 'jpg';
            if (blob.type) {
                const mimeExt = blob.type.split('/')[1];
                if (['jpg', 'jpeg', 'png', 'webp'].includes(mimeExt)) {
                    ext = mimeExt === 'jpeg' ? 'jpg' : mimeExt;
                }
            }
            const fileName = `upload_${Date.now()}.${ext}`;
            const formData = new FormData();

            if (Platform.OS === 'web') formData.append('file', blob, fileName);
            else formData.append('file', { uri, name: fileName, type: blob.type || 'image/jpeg' });

            const res = await fetch('https://fitos-final.onrender.com/api/upload-image', { method: 'POST', body: formData });
            if (!res.ok) throw new Error("Erro no servidor");

            const data = await res.json();
            return data.url; 
        } catch (error) { throw error; }
    };

    const handlePickEditImage = async () => {
        try {
            let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.5 });
            if (!result.canceled && result.assets[0].uri) {
                setIsUploadingEditPhoto(true);
                const url = await handleUploadR2(result.assets[0].uri);
                setEditPhotoUrl(url); 
            }
        } catch (error) { if (Platform.OS === 'web') window.alert("Erro no upload."); } 
        finally { setIsUploadingEditPhoto(false); }
    };

    const handlePickImage = async () => {
        try {
            let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.5 });
            if (!result.canceled && result.assets[0].uri) {
                setUploadingPhoto(true);
                const url = await handleUploadR2(result.assets[0].uri);
                setNewPhotoUrl(url);
            }
        } catch (error) { if (Platform.OS === 'web') window.alert("Erro no upload."); } 
        finally { setUploadingPhoto(false); }
    };

    const handleSaveModalContract = async () => {
        if (!editingAluno) return;
        setIsSavingContract(true);
        try {
            const parsedValue = parseFloat(String(contractValue).replace(',', '.')) || 0;
            const formatarDataParaISO = (dataStr) => {
                if (!dataStr) return null;
                if (dataStr.includes('-')) return forceMiddayUTC(dataStr);
                const [d, m, y] = dataStr.split('/');
                if (y && m && d) return forceMiddayUTC(`${y}-${m}-${d}`);
                return null;
            };

            const updatedData = {
                userId: editingAluno.id, 
                contractType, 
                contractValue: parsedValue,
                paymentDueDate: formatarDataParaISO(paymentDueDate), 
                startDate: formatarDataParaISO(startDateEdit),       
                financeCategory: financeCategoryEdit, 
                isFinanceActive: isFinanceActiveEdit,
                ...(editingAluno.isOffline ? { photoUrl: editPhotoUrl } : {})
            };

            if (editingAluno.isOffline) {
                const newList = offlineClients.map(a => a.id === editingAluno.id ? { ...a, ...updatedData } : a);
                setOfflineClients([...newList]);
                await AsyncStorage.setItem('@offline_clients', JSON.stringify(newList));
            } else {
                setLocalAlunos(prev => prev.map(a => a.id === editingAluno.id ? { ...a, ...updatedData } : a));
            }

            const parentRef = (alunos || []).find(a => a.id === editingAluno.id);
            if (parentRef) Object.assign(parentRef, updatedData);

            setRenderTrigger(prev => prev + 1);

            await fetch('https://fitos-final.onrender.com/api/admin/update-contract', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatedData),
            });

            if (Platform.OS === 'web') window.alert("Sucesso!");
            closeEditModal();
        } catch (error) { if (Platform.OS === 'web') window.alert("Erro ao salvar."); } 
        finally { setIsSavingContract(false); }
    };

    const handleReverterPagamento = async () => {
        if (!editingAluno) return;
        const confirmRevert = async () => {
            setIsSavingContract(true);
            try {
                const parsedValue = parseFloat(String(contractValue).replace(',', '.')) || 0;
                const formatarDataParaISO = (dataStr) => {
                    if (!dataStr) return null;
                    if (dataStr.includes('-')) return forceMiddayUTC(dataStr);
                    const [d, m, y] = dataStr.split('/');
                    if (y && m && d) return forceMiddayUTC(`${y}-${m}-${d}`);
                    return null;
                };

                const updatedData = {
                    userId: editingAluno.id, contractType, contractValue: parsedValue,
                    paymentDueDate: null, startDate: formatarDataParaISO(startDateEdit),
                    financeCategory: financeCategoryEdit, isFinanceActive: isFinanceActiveEdit,
                    ...(editingAluno.isOffline ? { photoUrl: editPhotoUrl } : {})
                };

                if (editingAluno.isOffline) {
                    const newList = offlineClients.map(a => a.id === editingAluno.id ? { ...a, ...updatedData } : a);
                    setOfflineClients([...newList]);
                    await AsyncStorage.setItem('@offline_clients', JSON.stringify(newList));
                } else {
                    setLocalAlunos(prev => prev.map(a => a.id === editingAluno.id ? { ...a, ...updatedData } : a));
                }

                const parentRef = (alunos || []).find(a => a.id === editingAluno.id);
                if (parentRef) Object.assign(parentRef, updatedData);

                setRenderTrigger(prev => prev + 1);

                await fetch('https://fitos-final.onrender.com/api/admin/update-contract', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatedData),
                });

                if (Platform.OS === 'web') window.alert("Pagamento Revertido!");
                closeEditModal();
            } catch (error) { if (Platform.OS === 'web') window.alert("Erro ao reverter."); } 
            finally { setIsSavingContract(false); }
        };

        if (Platform.OS === 'web') { if (window.confirm(`Tem certeza que deseja REVERTER?`)) confirmRevert(); } 
        else { Alert.alert("Reverter", `Tem certeza?`, [{ text: "Cancelar", style: "cancel" }, { text: "Sim", style: 'destructive', onPress: confirmRevert }]); }
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
                id: `offline_${Date.now()}`, name: newName, phone: newPhone, plan: newCategory,
                financeCategory: newCategory, contractType: newDuration, contractValue: parsedOfflineValue,
                startDate: forceMiddayUTC(newStartDate), paymentDueDate: forceMiddayUTC(newDueDate),
                photoUrl: newPhotoUrl, isOffline: true, isFinanceActive: true, assignedCoach: coachFilter,
                coachId: coachFilter === 'ADRI' ? 'b7c0c181-41fd-4156-b8fe-963a267759a3' : '3c82f763-66b4-48da-836e-16817d4f57c0'
            };

            const newList = [...offlineClients, newClient];
            setOfflineClients(newList);
            await AsyncStorage.setItem('@offline_clients', JSON.stringify(newList));

            setRenderTrigger(prev => prev + 1);

            try {
                await fetch('https://fitos-final.onrender.com/api/admin/offline-clients', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newClient)
                });
            } catch (err) { console.error("Erro ao salvar no banco", err); }

            if (Platform.OS === 'web') window.alert("Aluno offline cadastrado com sucesso.");
            setIsAddModalVisible(false);
            setNewName(''); setNewPhone(''); setNewCategory('Consultoria Online'); setNewDuration('Mensal'); setNewValue('');
            setNewStartDate(new Date().toISOString().split('T')[0]); setNewDueDate(''); setNewPhotoUrl('');
        } catch (error) { console.error(error); } 
        finally { setIsSavingNew(false); }
    };

    const handleDeleteOfflineClient = async (id) => {
        const confirmAction = async () => {
            try {
                const newList = offlineClients.filter(client => client.id !== id);
                setOfflineClients(newList);
                await AsyncStorage.setItem('@offline_clients', JSON.stringify(newList));

                setRenderTrigger(prev => prev + 1);

                const res = await fetch('https://fitos-final.onrender.com/api/admin/offline-clients', {
                    method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id })
                });

                if (!res.ok) throw new Error("Falha ao excluir no servidor");

                if (Platform.OS === 'web') window.alert("Aluno excluído com sucesso!");
                if (editingAluno && editingAluno.id === id) closeEditModal();
            } catch (error) {
                console.error("Erro ao excluir aluno:", error);
                if (Platform.OS === 'web') window.alert("Erro ao excluir aluno. Tente novamente.");
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm("Tem certeza que deseja excluir este aluno permanentemente?")) confirmAction();
        } else {
            Alert.alert("Excluir Aluno", "Tem certeza que deseja excluir este aluno permanentemente?", [
                { text: "Cancelar", style: "cancel" }, { text: "Excluir", style: "destructive", onPress: confirmAction }
            ]);
        }
    };

    return (
        <View style={{ flex: 1, paddingHorizontal: 20 }}>
            
            {/* 🚀 NOVO: CHAVEADOR DE SAAS EXCLUSIVO PARA MASTERS */}
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
                theme={theme} isWebPC={isWebPC} searchQuery={searchQuery} setSearchQuery={setSearchQuery} 
                selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth} 
                filterStatus={filterStatus} setFilterStatus={setFilterStatus} 
                filterPrazo={filterPrazo} setFilterPrazo={setFilterPrazo} 
                filterCategory={filterCategory} setFilterCategory={setFilterCategory} 
            />

            <AsaasPaymentsPanel theme={theme} isWebPC={isWebPC} />

            <FinanceStudentList 
                theme={theme} isWebPC={isWebPC} studentList={studentList} loadingId={loadingId} 
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
    // 🚀 Estilos do Toggle (Chaveador SaaS)
    toggleContainer: {
        flexDirection: 'row',
        borderRadius: 12,
        padding: 4,
        marginBottom: 16,
        borderWidth: 1,
    },
    toggleBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 8,
        gap: 8,
    },
    toggleText: {
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    // Estilos do Gráfico
    growthCard: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 16,
    },
    growthTitle: {
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    barContainer: {
        width: '100%',
        height: 12,
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 8,
        flexDirection: 'row',
        overflow: 'hidden',
    },
    barSegment: {
        height: '100%',
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    }
});
