// src/components/AdminFinanceSystem.js

import React, { useState, useMemo, useEffect } from 'react';
import { View, Platform, Linking, Alert, useWindowDimensions } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Utilitários
import { calcularProximaData, calcularDataAnterior, getDueDateStatus, forceMiddayUTC } from '../utils/financeUtils';

// Componentes Filhos
import FinanceHeaderMetrics from './AdminFinance/FinanceHeaderMetrics';
import FinanceFilters from './AdminFinance/FinanceFilters';
import FinanceStudentList from './AdminFinance/FinanceStudentList';
import FinanceEditModal from './AdminFinance/FinanceEditModal';
import FinanceAddModal from './AdminFinance/FinanceAddModal';

export default function AdminFinanceSystem({ theme, alunos, coachFilter, getLogCoach }) {
    const { width } = useWindowDimensions();
    const isWebPC = Platform.OS === 'web' && width > 768;

    const currentMonthIndex = new Date().getMonth();
    const currentYear = new Date().getFullYear();

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

    // Estados do Modal de Edição
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

    // Estados do Modal de Novo Aluno
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

    // Efeitos (Migração e Carregamento)
    useEffect(() => {
        const migrateOfflineClients = async () => {
            try {
                const cachedOffline = await AsyncStorage.getItem('@offline_clients');
                if (cachedOffline) {
                    const clients = JSON.parse(cachedOffline);
                    if (clients.length > 0) {
                        for (const client of clients) {
                            await fetch('https://fitos-final.onrender.com/api/admin/offline-clients', {
                                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(client)
                            });
                        }
                        await AsyncStorage.removeItem('@offline_clients');
                        Alert.alert("Sucesso", "Seus alunos offline foram migrados para a nuvem!");
                    }
                }
            } catch (e) { console.error("Erro na migração:", e); }
        };
        migrateOfflineClients();
    }, []);

    useEffect(() => {
        fetch('https://fitos-final.onrender.com/api/admin/offline-clients/get')
            .then(res => res.json())
            .then(data => setOfflineClients(data))
            .catch(e => console.error("Erro ao buscar offline:", e));
    }, []);

    useEffect(() => { setLocalAlunos(alunos); }, [alunos]);

    useEffect(() => {
        const loadOfflineClients = async () => {
            try {
                const saved = await AsyncStorage.getItem('@offline_clients');
                if (saved) setOfflineClients(JSON.parse(saved));
            } catch (e) { console.error("Erro ao carregar offline", e); }
        };
        loadOfflineClients();
    }, []);

    // Cálculos (useMemo)
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
        let entrada = 0; let pendente = 0; let previsao = 0;
        const endOfSelectedMonth = new Date(currentYear, selectedMonth + 1, 0);
        endOfSelectedMonth.setHours(23, 59, 59, 999);

        todosAlunosFinanceiro.forEach(aluno => {
            const valor = parseFloat(aluno.contractValue) || 0;
            const isPaid = aluno.paymentDueDate ? new Date(aluno.paymentDueDate) > endOfSelectedMonth : false;
            if (isPaid) { entrada += valor; previsao += valor; } 
            else if (aluno.isFinanceActive) { pendente += valor; previsao += valor; }
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

    // Funções de Ação
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

                setLocalAlunos(prev => prev.map(a => a.id === aluno.id ? { ...a, ...updatedData } : a));
                const parentRef = alunos.find(a => a.id === aluno.id);
                if (parentRef) Object.assign(parentRef, updatedData);

                if (aluno.isOffline) {
                    const newList = offlineClients.map(a => a.id === aluno.id ? { ...a, ...updatedData } : a);
                    setOfflineClients(newList);
                    await AsyncStorage.setItem('@offline_clients', JSON.stringify(newList));
                } else {
                    await fetch('https://fitos-final.onrender.com/api/admin/update-contract', {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: aluno.id, contractType: tipoContrato, contractValue: parseFloat(aluno.contractValue) || 0, paymentDueDate: novaDataISO, financeCategory: aluno.financeCategory || 'Consultoria Online', isFinanceActive: aluno.isFinanceActive !== undefined ? aluno.isFinanceActive : true }),
                    });
                }
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

        // Garante que a extensão será sempre válida, mesmo se o navegador falhar
        let ext = 'jpg';
        if (blob.type) {
            const mimeExt = blob.type.split('/')[1];
            if (['jpg', 'jpeg', 'png', 'webp'].includes(mimeExt)) {
                ext = mimeExt === 'jpeg' ? 'jpg' : mimeExt;
            }
        }
        const fileName = `upload_${Date.now()}.${ext}`;

        const formData = new FormData();

        if (Platform.OS === 'web') {
            // Forma mais segura e universal de enviar arquivos na Web
            formData.append('file', blob, fileName);
        } else {
            formData.append('file', { uri, name: fileName, type: blob.type || 'image/jpeg' });
        }

        const res = await fetch('https://fitos-final.onrender.com/api/upload-image', { 
            method: 'POST', 
            body: formData 
        });

        if (!res.ok) {
            // Tenta ler o erro exato que o backend mandou
            const errorData = await res.json().catch(() => ({}));
            console.error("Erro do Backend:", errorData);
            throw new Error(errorData.error || `Erro no servidor: Status ${res.status}`);
        }

        const data = await res.json();
        return data.url; 
    } catch (error) {
        console.error("Falha no upload:", error);
        throw error;
    }
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
            const updatedData = {
                userId: editingAluno.id, contractType, contractValue: parsedValue,
                paymentDueDate: forceMiddayUTC(paymentDueDate), startDate: forceMiddayUTC(startDateEdit), 
                financeCategory: financeCategoryEdit, isFinanceActive: isFinanceActiveEdit,
                ...(editingAluno.isOffline ? { photoUrl: editPhotoUrl } : {})
            };

            setLocalAlunos(prev => prev.map(a => a.id === editingAluno.id ? { ...a, ...updatedData } : a));
            const parentRef = alunos.find(a => a.id === editingAluno.id);
            if (parentRef) Object.assign(parentRef, updatedData);

            if (editingAluno.isOffline) {
                const newList = offlineClients.map(a => a.id === editingAluno.id ? { ...a, ...updatedData } : a);
                setOfflineClients(newList);
                await AsyncStorage.setItem('@offline_clients', JSON.stringify(newList));
            } else {
                await fetch('https://fitos-final.onrender.com/api/admin/update-contract', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatedData),
                });
            }
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
                const updatedData = {
                    userId: editingAluno.id, contractType, contractValue: parsedValue,
                    paymentDueDate: null, startDate: forceMiddayUTC(startDateEdit),
                    financeCategory: financeCategoryEdit, isFinanceActive: isFinanceActiveEdit,
                    ...(editingAluno.isOffline ? { photoUrl: editPhotoUrl } : {})
                };

                setLocalAlunos(prev => prev.map(a => a.id === editingAluno.id ? { ...a, ...updatedData } : a));
                const parentRef = alunos.find(a => a.id === editingAluno.id);
                if (parentRef) Object.assign(parentRef, updatedData);

                if (editingAluno.isOffline) {
                    const newList = offlineClients.map(a => a.id === editingAluno.id ? { ...a, ...updatedData } : a);
                    setOfflineClients(newList);
                    await AsyncStorage.setItem('@offline_clients', JSON.stringify(newList));
                } else {
                    await fetch('https://fitos-final.onrender.com/api/admin/update-contract', {
                        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatedData),
                    });
                }
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

            // 🔥 NOVO: Envia direto para o banco de dados no backend
            try {
                await fetch('https://fitos-final.onrender.com/api/admin/offline-clients', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newClient)
                });
            } catch (err) {
                console.error("Erro ao salvar no banco, mas salvo no cache:", err);
            }

            if (Platform.OS === 'web') window.alert("Aluno offline cadastrado com sucesso.");
            setIsAddModalVisible(false);
            setNewName(''); setNewPhone(''); setNewCategory('Consultoria Online'); setNewDuration('Mensal'); setNewValue('');
            setNewStartDate(new Date().toISOString().split('T')[0]); setNewDueDate(''); setNewPhotoUrl('');
        } catch (error) { console.error(error); } 
        finally { setIsSavingNew(false); }
    };

    return (
        <View style={{ flex: 1, paddingHorizontal: 20 }}>
            <FinanceHeaderMetrics 
                theme={theme} selectedMonth={selectedMonth} currentYear={currentYear} 
                metrics={metrics} setIsAddModalVisible={setIsAddModalVisible} isWebPC={isWebPC} 
            />

            <FinanceFilters 
                theme={theme} isWebPC={isWebPC} searchQuery={searchQuery} setSearchQuery={setSearchQuery} 
                selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth} 
                filterStatus={filterStatus} setFilterStatus={setFilterStatus} 
                filterPrazo={filterPrazo} setFilterPrazo={setFilterPrazo} 
                filterCategory={filterCategory} setFilterCategory={setFilterCategory} 
            />

            <FinanceStudentList 
                theme={theme} isWebPC={isWebPC} studentList={studentList} loadingId={loadingId} 
                openEditModal={openEditModal} handleTogglePagamento={handleTogglePagamento} openWhatsApp={openWhatsApp} 
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
            />

            <FinanceAddModal 
                theme={theme} isWebPC={isWebPC} isAddModalVisible={isAddModalVisible} setIsAddModalVisible={setIsAddModalVisible}
                newName={newName} setNewName={setNewName} newCategory={newCategory} setNewCategory={setNewCategory}
                newPhone={newPhone} setNewPhone={setNewPhone} newDuration={newDuration} setNewDuration={setNewDuration}
                newValue={newValue} setNewValue={setNewValue} newStartDate={newStartDate} setNewStartDate={setNewStartDate}
                newDueDate={newDueDate} setNewDueDate={setNewDueDate} uploadingPhoto={uploadingPhoto} newPhotoUrl={newPhotoUrl}
                handlePickImage={handlePickImage} handleSaveNewOfflineClient={handleSaveNewOfflineClient} isSavingNew={isSavingNew}
            />
        </View>
    );
}