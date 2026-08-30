// src/hooks/useAdminFinance.js
import { useState, useMemo, useEffect } from 'react';
import { Platform, Linking, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { calcularProximaData, calcularDataAnterior, getDueDateStatus, forceMiddayUTC } from '../utils/financeUtils';
import { PAULO_ID, ADRI_ID } from '../constants/masterIds';
import { authHeaders } from '../utils/authToken';

const getInterval = (type) => {
    const t = (type || '').toLowerCase();
    if (t.includes('trimestral')) return 3;
    if (t.includes('semestral')) return 6;
    if (t.includes('anual')) return 12;
    if (t.includes('bimestral')) return 2;
    return 1; 
};

export default function useAdminFinance(alunos, coachFilter, getLogCoach, theme) {
    const currentMonthIndex = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const [viewMode, setViewMode] = useState('ALUNOS'); 
    const [currentUserId, setCurrentUserId] = useState(null);

    const [selectedMonth, setSelectedMonth] = useState(currentMonthIndex);
    const [filterStatus, setFilterStatus] = useState('ATIVOS'); 
    const [filterCategory, setFilterCategory] = useState('TODOS'); 
    const [filterPrazo, setFilterPrazo] = useState('TODOS'); 
    const [searchQuery, setSearchQuery] = useState(''); 

    const [localAlunos, setLocalAlunos] = useState([]);
    const [offlineClients, setOfflineClients] = useState([]); 
    const [coachesData, setCoachesData] = useState([]); 
    const [loadingId, setLoadingId] = useState(null);

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

    useEffect(() => {
        AsyncStorage.getItem('user').then(u => {
            if (u) setCurrentUserId(JSON.parse(u).id);
        });
    }, []);
    
    const isMaster = currentUserId === PAULO_ID || currentUserId === ADRI_ID;

    // 🔥 BUSCA ANTI-CACHE ALTERADA PARA FILTRAR APENAS ALUNOS ATIVOS DA PLATAFORMA
    useEffect(() => {
        if (alunos) {
            // Inicializa apenas com os alunos que não foram inativados no sistema geral
            const ativosIniciais = alunos.filter(u => u.accountStatus === 'ACTIVE' || u.active !== false);
            setLocalAlunos(ativosIniciais);
        }

        if (currentUserId) {
            (async () => {
                fetch(`https://fitos-final.onrender.com/api/admin/user?adminId=${currentUserId}&t=${Date.now()}`, {
                    headers: { ...(await authHeaders()) },
                })
                    .then(res => res.json())
                    .then(data => {
                        if (Array.isArray(data)) {
                            // 🔥 TRAVA: Além de remover Coach/Admin, remove contas bloqueadas ou inativas do sistema
                            const alunosOnly = data.filter(u =>
                                (u.role || u.type || '').toUpperCase() !== 'COACH' &&
                                (u.role || u.type || '').toUpperCase() !== 'ADMIN' &&
                                u.accountStatus === 'ACTIVE' &&
                                u.active !== false
                            );
                            setLocalAlunos(alunosOnly);
                        }
                    })
                    .catch(e => console.error("Erro no anti-cache de alunos:", e));
            })();
        }
    }, [alunos, currentUserId]);

    // 🔥 BUSCA ANTI-CACHE DOS COACHES
    useEffect(() => {
        if (isMaster) {
            (async () => {
                fetch('https://fitos-final.onrender.com/api/admin/coaches?t=' + Date.now(), {
                    headers: { ...(await authHeaders()) },
                })
                    .then(res => {
                        if (!res.ok) throw new Error("Falha na API: " + res.status);
                        return res.json();
                    })
                    .then(data => {
                        if (Array.isArray(data)) setCoachesData(data);
                    })
                    .catch(e => console.error("Erro ao buscar dados dos coaches:", e));
            })();
        }
    }, [isMaster]);

    // 🔥 BUSCA ANTI-CACHE DOS ALUNOS OFFLINE
    // 🔒 offline-clients/get é master-only no backend (não tem como filtrar por
    // coach nessa tabela) — coach parceiro nem deve chamar essa rota. Antes essa
    // trava não existia (rota não tinha proteção nenhuma), então nunca dava erro
    // aqui; agora que tem, sem esse "if (isMaster)" o coach parceiro recebe um
    // 403 e o corpo de erro (um objeto, não array) ia parar em setOfflineClients,
    // quebrando o .map() mais abaixo. Também passou a checar res.ok antes de usar
    // a resposta, por segurança.
    useEffect(() => {
        if (!isMaster) { setOfflineClients([]); return; }
        (async () => {
            fetch('https://fitos-final.onrender.com/api/admin/offline-clients/get?t=' + Date.now(), {
                headers: { ...(await authHeaders()) },
            })
                .then(res => {
                    if (!res.ok) throw new Error("Falha na API: " + res.status);
                    return res.json();
                })
                .then(data => setOfflineClients(Array.isArray(data) ? data : []))
                .catch(e => console.error("Erro ao buscar offline:", e));
        })();
    }, [isMaster]);

    const updateCoachLocal = (id, data) => {
        setCoachesData(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
    };

    const todosAlunosFinanceiro = useMemo(() => {
        if (viewMode === 'COACHES') {
            return (coachesData || []).map(coach => ({
                ...coach,
                financeCategory: coach.coachPlan || 'PERSONAL',
                isFinanceActive: coach.accountStatus !== 'REJECTED', 
                contractType: coach.contractType || (coach.coachBillingPlan?.includes('ANUAL') ? 'Anual' : (coach.coachBillingPlan?.includes('SEMESTRAL') ? 'Semestral' : 'Mensal')),
                paymentDueDate: coach.paymentDueDate || coach.coachBillingEnd || null,
                startDate: coach.startDate || coach.coachBillingStart || coach.createdAt || new Date().toISOString(),
                contractValue: coach.contractValue !== undefined && coach.contractValue !== null ? coach.contractValue : 0
            }));
        }

        const mix = [...(localAlunos || []).map(a => ({...a})), ...(offlineClients || []).map(a => ({...a}))];
        return mix.filter(a => {
            const r = (a.role || a.type || '').toUpperCase();
            if (r === 'COACH' || r === 'ADMIN') return false; 
            if (a.isOffline) return a.assignedCoach === coachFilter;
            return getLogCoach(a) === coachFilter;
        }).map(aluno => ({
            ...aluno,
            financeCategory: aluno.financeCategory || (aluno.isOffline ? aluno.plan : 'Consultoria Online'),
            isFinanceActive: aluno.isFinanceActive !== undefined ? aluno.isFinanceActive : true
        }));
    }, [localAlunos, offlineClients, coachesData, coachFilter, getLogCoach, viewMode]);

    const enrichedStudentList = useMemo(() => {
        const targetStart = new Date(currentYear, selectedMonth, 1);
        const targetEnd = new Date(currentYear, selectedMonth + 1, 0, 23, 59, 59, 999);

        return (todosAlunosFinanceiro || []).map(aluno => {
            const startDate = new Date(aluno.startDate || aluno.createdAt || new Date().toISOString());
            const startMonth = startDate.getMonth();
            const startYear = startDate.getFullYear();

            const isNewThisMonth = startYear === currentYear && startMonth === selectedMonth;
            const started = startDate <= targetEnd;

            let isBillingMonth = false;
            if (started) {
                const diffMonths = (currentYear - startYear) * 12 + (selectedMonth - startMonth);
                const interval = getInterval(aluno.contractType);
                if (diffMonths >= 0 && diffMonths % interval === 0) isBillingMonth = true;
            }

            const isPaid = aluno.paymentDueDate ? new Date(aluno.paymentDueDate) > targetEnd : false;
            return { ...aluno, isPaid, isBillingMonth, started, isNewThisMonth };
        }).filter(a => a.started); 
    }, [todosAlunosFinanceiro, selectedMonth, currentYear]);

    const metrics = useMemo(() => {
        let entrada = 0; let pendente = 0; let previsao = 0;
        (enrichedStudentList || []).forEach(aluno => {
            if (aluno.isBillingMonth) {
                const valor = parseFloat(aluno.contractValue) || 0;
                if (aluno.isPaid) { entrada += valor; previsao += valor; } 
                // 🔥 TRAVA: As métricas de previsão e pendentes ignoram totalmente quem está desativado no financeiro
                else if (aluno.isFinanceActive) { pendente += valor; previsao += valor; }
            }
        });
        return { entrada, pendente, previsao };
    }, [enrichedStudentList]);

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

    // 🔥 TRAVA: O contador do topo e os percentuais agora são calculados com base na lista final filtrada por padrão
    const listagemExibida = useMemo(() => {
        return (enrichedStudentList || []).filter(a => a.isFinanceActive);
    }, [enrichedStudentList]);

    const totalAtivosNoMes = listagemExibida.length;
    const novosNoMes = listagemExibida.filter(a => a.isNewThisMonth).length;
    const retidosNoMes = totalAtivosNoMes - novosNoMes;
    const percNovos = totalAtivosNoMes > 0 ? (novosNoMes / totalAtivosNoMes) * 100 : 0;
    const percRetidos = totalAtivosNoMes > 0 ? (retidosNoMes / totalAtivosNoMes) * 100 : 0;

    const openChargeModal = (aluno) => {
        if (aluno?.isOffline) {
            if (Platform.OS === 'web') window.alert("Alunos offline não têm conta no app.");
            else Alert.alert("Aluno offline", "Alunos offline não têm conta no app.");
            return;
        }
        setChargeAluno(aluno);
    };

    // 🔥 Resolve o id REAL do coach dono da tela financeira atual. Pro time
    // master, coachFilter guarda só o sentinel 'PAULO'/'ADRI' (ver
    // useAdminDashboard.js); pro coach parceiro logado, coachFilter já é o
    // próprio id dele. Usado pra saber de QUEM é o recebimento manual.
    const resolveCoachId = (filter) => {
        if (filter === 'ADRI') return ADRI_ID;
        if (filter === 'PAULO') return PAULO_ID;
        return filter;
    };

    // Só avança/recua a data de vencimento (comportamento original, sem
    // registro nenhum) — usado pra reverter pagamento e pra alunos/coaches
    // que pagam pela Asaas (o pagamento em si já vira um Payment sozinho).
    const applyDueDateShift = async (aluno, isCurrentlyPaid) => {
        setLoadingId(aluno.id);
        try {
            const tipoContrato = aluno.contractType || 'Mensal';
            const dataBase = aluno.paymentDueDate ? aluno.paymentDueDate : new Date().toISOString();
            const novaDataISO = isCurrentlyPaid ? calcularDataAnterior(dataBase, tipoContrato) : calcularProximaData(dataBase, tipoContrato);
            const updatedData = { paymentDueDate: novaDataISO };

            if (viewMode === 'COACHES') {
                setCoachesData(prev => prev.map(c => c.id === aluno.id ? { ...c, paymentDueDate: novaDataISO } : c));
            } else if (aluno.isOffline) {
                const newList = offlineClients.map(a => a.id === aluno.id ? { ...a, ...updatedData } : a);
                setOfflineClients([...newList]);
                await AsyncStorage.setItem('@offline_clients', JSON.stringify(newList));
            } else {
                setLocalAlunos(prev => prev.map(a => a.id === aluno.id ? { ...a, ...updatedData } : a));
            }

            if (viewMode === 'COACHES') {
                await fetch('https://fitos-final.onrender.com/api/admin/coaches', {
                    method: 'PATCH', headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
                    body: JSON.stringify({ coachId: aluno.id, action: 'SET_PLAN', coachBillingEnd: novaDataISO, paymentDueDate: novaDataISO }),
                });
            } else {
                await fetch('https://fitos-final.onrender.com/api/admin/update-contract', {
                    method: 'POST', headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
                    body: JSON.stringify({ userId: aluno.id, contractType: tipoContrato, contractValue: parseFloat(aluno.contractValue) || 0, paymentDueDate: novaDataISO, financeCategory: aluno.financeCategory || 'Consultoria Online', isFinanceActive: aluno.isFinanceActive !== undefined ? aluno.isFinanceActive : true }),
                });
            }
        } finally { setLoadingId(null); }
    };

    // 🔥 Aluno/coach pendente de confirmação no FinanceManualReceiptModal —
    // só é setado quando estamos MARCANDO como pago (não ao reverter) e fora
    // da view COACHES (assinatura do coach com a plataforma não é renda dele).
    const [manualReceiptAluno, setManualReceiptAluno] = useState(null);
    const [isSavingManualReceipt, setIsSavingManualReceipt] = useState(false);

    const handleTogglePagamento = async (aluno) => {
        const isCurrentlyPaid = aluno.isPaid;

        // Marcando como PAGO e é um aluno de verdade (não a assinatura do
        // coach parceiro com a plataforma) → confirma valor/data/forma antes,
        // pra esse recebimento entrar no relatório de Imposto de Renda.
        if (!isCurrentlyPaid && viewMode !== 'COACHES') {
            setManualReceiptAluno(aluno);
            return;
        }

        const msg = isCurrentlyPaid ? `Deseja CANCELAR o pagamento de ${aluno.name}?` : `Deseja REGISTRAR o pagamento de ${aluno.name}?`;
        const confirmAction = async () => {
            try {
                await applyDueDateShift(aluno, isCurrentlyPaid);
                if (Platform.OS === 'web') window.alert(isCurrentlyPaid ? "Pagamento estornado!" : "Pagamento registrado!");
            } catch (error) {
                if (Platform.OS === 'web') window.alert("Erro ao processar.");
            }
        };

        if (Platform.OS === 'web') { if (window.confirm(msg)) confirmAction(); }
        else { Alert.alert(isCurrentlyPaid ? "Estornar" : "Confirmar", msg, [{ text: "Cancelar", style: "cancel" }, { text: "Sim", style: isCurrentlyPaid ? 'destructive' : 'default', onPress: confirmAction }]); }
    };

    const closeManualReceiptModal = () => setManualReceiptAluno(null);

    // Confirmação do FinanceManualReceiptModal: avança a data de vencimento
    // igual sempre e, além disso, registra o ManualReceipt (valor/data/forma)
    // que entra no Relatório Financeiro.
    const confirmManualReceipt = async ({ value, method, receivedAt, note }) => {
        const aluno = manualReceiptAluno;
        if (!aluno) return;
        setIsSavingManualReceipt(true);
        try {
            await applyDueDateShift(aluno, false);
            await fetch('https://fitos-final.onrender.com/api/finance/manual-receipt', {
                method: 'POST', headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
                body: JSON.stringify({
                    coachId: resolveCoachId(coachFilter),
                    studentId: aluno.isOffline ? null : aluno.id,
                    studentName: aluno.name,
                    value, method, receivedAt, note,
                }),
            });
            if (Platform.OS === 'web') window.alert("Pagamento registrado!");
            setManualReceiptAluno(null);
        } catch (error) {
            if (Platform.OS === 'web') window.alert("Erro ao registrar pagamento.");
        } finally { setIsSavingManualReceipt(false); }
    };

    const openWhatsApp = (phone, name) => {
        if (!phone) return;
        const message = viewMode === 'COACHES' ? `Olá ${name}, tudo bem? Estou entrando em contato sobre a parceria no app...` : `Olá ${name}, tudo bem? Estou entrando em contato para falar sobre sua consultoria...`;
        const url = `whatsapp://send?phone=+55${phone.replace(/\D/g, '')}&text=${encodeURIComponent(message)}`;
        Linking.openURL(url).catch(() => {
            if (Platform.OS === 'web') window.alert("Instale o WhatsApp.");
            else Alert.alert("Erro", "Não foi possível abrir o WhatsApp.");
        });
    };

    const openEditModal = (aluno) => {
        setEditingAluno(aluno);
        setContractType(aluno.contractType || 'Mensal');
        setContractValue(aluno.contractValue !== undefined && aluno.contractValue !== null ? String(aluno.contractValue) : '0');
        setStartDateEdit(aluno.startDate ? aluno.startDate.split('T')[0] : (aluno.createdAt ? new Date(aluno.createdAt).toISOString().split('T')[0] : ''));
        setPaymentDueDate(aluno.paymentDueDate ? aluno.paymentDueDate.split('T')[0] : '');
        setFinanceCategoryEdit(aluno.financeCategory || (viewMode === 'COACHES' ? 'PERSONAL' : 'Consultoria Online'));
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
                if (['jpg', 'jpeg', 'png', 'webp'].includes(mimeExt)) ext = mimeExt === 'jpeg' ? 'jpg' : mimeExt;
            }
            const fileName = `upload_${Date.now()}.${ext}`;
            const formData = new FormData();
            if (Platform.OS === 'web') formData.append('file', blob, fileName);
            else formData.append('file', { uri, name: fileName, type: blob.type || 'image/jpeg' });

            const res = await fetch('https://fitos-final.onrender.com/api/upload-image', { method: 'POST', body: formData, headers: { ...(await authHeaders()) } });
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

            if (viewMode === 'COACHES') {
                updateCoachLocal(editingAluno.id, { 
                    paymentDueDate: updatedData.paymentDueDate, 
                    coachBillingEnd: updatedData.paymentDueDate, 
                    coachBillingStart: updatedData.startDate, 
                    startDate: updatedData.startDate, 
                    contractValue: updatedData.contractValue, 
                    contractType: updatedData.contractType, 
                    isFinanceActive: updatedData.isFinanceActive 
                });
                
                await fetch('https://fitos-final.onrender.com/api/admin/coaches', {
                    method: 'PATCH', headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
                    body: JSON.stringify({
                        coachId: editingAluno.id,
                        action: 'SET_PLAN',
                        contractValue: updatedData.contractValue,
                        coachBillingEnd: updatedData.paymentDueDate,
                        paymentDueDate: updatedData.paymentDueDate,
                        coachBillingStart: updatedData.startDate,
                        startDate: updatedData.startDate,
                        contractType: updatedData.contractType,
                        isFinanceActive: updatedData.isFinanceActive
                    }),
                });
            } else if (editingAluno.isOffline) {
                const newList = offlineClients.map(a => a.id === editingAluno.id ? { ...a, ...updatedData } : a);
                setOfflineClients([...newList]);
                await AsyncStorage.setItem('@offline_clients', JSON.stringify(newList));
                await fetch('https://fitos-final.onrender.com/api/admin/update-contract', {
                    method: 'POST', headers: { 'Content-Type': 'application/json', ...(await authHeaders()) }, body: JSON.stringify(updatedData),
                });
            } else {
                setLocalAlunos(prev => prev.map(a => a.id === editingAluno.id ? { ...a, ...updatedData } : a));

                await fetch('https://fitos-final.onrender.com/api/admin/update-contract', {
                    method: 'POST', headers: { 'Content-Type': 'application/json', ...(await authHeaders()) }, body: JSON.stringify(updatedData),
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

                if (viewMode === 'COACHES') {
                    updateCoachLocal(editingAluno.id, { paymentDueDate: null, coachBillingEnd: null });
                    await fetch('https://fitos-final.onrender.com/api/admin/coaches', {
                        method: 'PATCH', headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
                        body: JSON.stringify({
                            coachId: editingAluno.id,
                            action: 'SET_PLAN',
                            paymentDueDate: null,
                            coachBillingEnd: null 
                        }),
                    });
                } else if (editingAluno.isOffline) {
                    const newList = offlineClients.map(a => a.id === editingAluno.id ? { ...a, ...updatedData } : a);
                    setOfflineClients([...newList]);
                    await AsyncStorage.setItem('@offline_clients', JSON.stringify(newList));
                    await fetch('https://fitos-final.onrender.com/api/admin/update-contract', {
                        method: 'POST', headers: { 'Content-Type': 'application/json', ...(await authHeaders()) }, body: JSON.stringify(updatedData),
                    });
                } else {
                    setLocalAlunos(prev => prev.map(a => a.id === editingAluno.id ? { ...a, ...updatedData } : a));
                    await fetch('https://fitos-final.onrender.com/api/admin/update-contract', {
                        method: 'POST', headers: { 'Content-Type': 'application/json', ...(await authHeaders()) }, body: JSON.stringify(updatedData),
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
                coachId: coachFilter === 'ADRI' ? ADRI_ID : PAULO_ID
            };

            const newList = [...offlineClients, newClient];
            setOfflineClients(newList);
            await AsyncStorage.setItem('@offline_clients', JSON.stringify(newList));

            try {
                await fetch('https://fitos-final.onrender.com/api/admin/offline-clients', {
                    method: 'POST', headers: { 'Content-Type': 'application/json', ...(await authHeaders()) }, body: JSON.stringify(newClient)
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

                const res = await fetch('https://fitos-final.onrender.com/api/admin/offline-clients', {
                    method: 'DELETE', headers: { 'Content-Type': 'application/json', ...(await authHeaders()) }, body: JSON.stringify({ id })
                });

                if (!res.ok) throw new Error("Falha ao excluir no servidor");

                if (Platform.OS === 'web') window.alert("Aluno excluído com sucesso!");
                if (editingAluno && editingAluno.id === id) closeEditModal();
            } catch (error) {
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

    return {
        viewMode, setViewMode, currentUserId, isMaster,
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
        openChargeModal, updateCoachLocal,
        manualReceiptAluno, closeManualReceiptModal, confirmManualReceipt, isSavingManualReceipt
    };
}