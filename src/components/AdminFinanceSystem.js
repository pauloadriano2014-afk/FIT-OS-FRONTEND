// src/components/AdminFinanceSystem.js — v2
// v2: aba COACHES para masters (única mudança em relação ao original)
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Switch,
  Platform,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CoachBillingModal from './Admin/CoachBillingModal'; // ← v2

const BASE_URL = 'https://fitos-final.onrender.com';

const MASTER_IDS = [
  '3c82f763-66b4-48da-836e-16817d4f57c0',
  'b7c0c181-41fd-4156-b8fe-963a267759a3',
];

// ─── PLAN MONTHLY PRICES (coaches) ← v2 ──────────────────────────────────────
const PLAN_MONTHLY = {
  PERSONAL_MONTHLY:97,    PERSONAL_QUARTERLY:91,  PERSONAL_SEMIANNUAL:85, PERSONAL_ANNUAL:79,    PERSONAL_LAUNCH:69.9,
  NUTRI_MONTHLY:97,       NUTRI_QUARTERLY:91,     NUTRI_SEMIANNUAL:85,    NUTRI_ANNUAL:79,       NUTRI_LAUNCH:69.9,
  ELITE_MONTHLY:147,      ELITE_QUARTERLY:138,    ELITE_SEMIANNUAL:129,   ELITE_ANNUAL:119,      ELITE_LAUNCH:109.9,
};

const BILLING_STATUS_COLORS = {
  ACTIVE:    '#34C759',
  PENDING:   '#FF9500',
  OVERDUE:   '#FF3B30',
  CANCELLED: '#8E8E93',
};
const BILLING_STATUS_LABELS = {
  ACTIVE:    'ATIVO',
  PENDING:   'PENDENTE',
  OVERDUE:   'INADIMPLENTE',
  CANCELLED: 'CANCELADO',
};

const formatDateCoach = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
};

const daysUntilCoach = (iso) => {
  if (!iso) return null;
  const due = new Date(iso); due.setHours(0,0,0,0);
  const today = new Date(); today.setHours(0,0,0,0);
  return Math.round((due - today) / (1000 * 3600 * 24));
};

// ─── ABA COACHES ← v2 ────────────────────────────────────────────────────────
function CoachesFinanceTab({ coaches, loading, theme, onBilling }) {
  const active    = coaches.filter(c => c.coachBillingStatus === 'ACTIVE');
  const pending   = coaches.filter(c => c.coachBillingStatus === 'PENDING' || !c.coachBillingStatus);
  const overdue   = coaches.filter(c => c.coachBillingStatus === 'OVERDUE');
  const cancelled = coaches.filter(c => c.coachBillingStatus === 'CANCELLED');
  const mrr = active.reduce((sum, c) => sum + (PLAN_MONTHLY[c.coachBillingPlan] ?? 0), 0);

  if (loading) {
    return <View style={{ padding:40, alignItems:'center' }}><ActivityIndicator size="large" color={theme.accent} /></View>;
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom:40 }}>
      {/* Cards de resumo */}
      <View style={{ flexDirection:'row', gap:8, marginBottom:16 }}>
        {[
          { label:'MRR',        value:`R$${mrr.toFixed(0)}`,   color:theme.accent, icon:'cash-multiple'        },
          { label:'ATIVOS',     value:String(active.length),   color:'#34C759',    icon:'check-circle-outline' },
          { label:'INADIMPL.',  value:String(overdue.length),  color:'#FF3B30',    icon:'alert-circle-outline' },
          { label:'PENDENTES',  value:String(pending.length),  color:'#FF9500',    icon:'clock-outline'        },
        ].map(({ label, value, color, icon }) => (
          <View key={label} style={{ flex:1, alignItems:'center', padding:12, borderRadius:14, borderWidth:1, backgroundColor:theme.surface, borderColor:color+'40' }}>
            <MaterialCommunityIcons name={icon} size={18} color={color} />
            <Text style={{ color, fontWeight:'900', fontSize:18, marginTop:4 }}>{value}</Text>
            <Text style={{ color:theme.textSecondary, fontSize:9, fontWeight:'800', letterSpacing:0.5 }}>{label}</Text>
          </View>
        ))}
      </View>

      {[
        { list:overdue,   title:'🔴 INADIMPLENTES', color:'#FF3B30' },
        { list:pending,   title:'🟡 PENDENTES',     color:'#FF9500' },
        { list:active,    title:'🟢 ATIVOS',        color:'#34C759' },
        { list:cancelled, title:'⚫ CANCELADOS',    color:'#8E8E93' },
      ].map(({ list, title }) => list.length === 0 ? null : (
        <View key={title} style={{ marginTop:16 }}>
          <Text style={{ color:theme.textSecondary, fontSize:11, fontWeight:'900', letterSpacing:0.5, marginBottom:8 }}>{title}</Text>
          {list.map(coach => {
            const days      = daysUntilCoach(coach.coachBillingEnd);
            const statusClr = BILLING_STATUS_COLORS[coach.coachBillingStatus] ?? '#8E8E93';
            const planLabel = (coach.coachBillingPlan ?? '—').replace(/_/g,' ');
            return (
              <View key={coach.id} style={{ borderRadius:16, borderWidth:1, padding:14, marginBottom:10, backgroundColor:theme.surface, borderColor:theme.border }}>
                <View style={{ flexDirection:'row', alignItems:'center', gap:10, marginBottom:8 }}>
                  <View style={{ width:36, height:36, borderRadius:10, alignItems:'center', justifyContent:'center', backgroundColor:statusClr+'20' }}>
                    <MaterialCommunityIcons name="account-tie" size={18} color={statusClr} />
                  </View>
                  <View style={{ flex:1 }}>
                    <Text style={{ color:theme.text, fontWeight:'900', fontSize:14 }} numberOfLines={1}>{coach.name}</Text>
                    <Text style={{ color:theme.textSecondary, fontSize:11 }} numberOfLines={1}>{coach.email}</Text>
                  </View>
                  <View style={{ paddingHorizontal:8, paddingVertical:3, borderRadius:8, borderWidth:1, backgroundColor:statusClr+'20', borderColor:statusClr+'50' }}>
                    <Text style={{ fontSize:9, fontWeight:'900', color:statusClr }}>{BILLING_STATUS_LABELS[coach.coachBillingStatus] ?? 'SEM PLANO'}</Text>
                  </View>
                </View>
                <View style={{ flexDirection:'row', gap:16, marginBottom:10, flexWrap:'wrap' }}>
                  <View style={{ flexDirection:'row', alignItems:'center', gap:4 }}>
                    <MaterialCommunityIcons name="tag-outline" size={12} color={theme.textSecondary} />
                    <Text style={{ color:theme.textSecondary, fontSize:11 }}>{planLabel}</Text>
                  </View>
                  {coach.coachBillingEnd && (
                    <View style={{ flexDirection:'row', alignItems:'center', gap:4 }}>
                      <MaterialCommunityIcons name="calendar-outline" size={12} color={theme.textSecondary} />
                      <Text style={{ color: days !== null && days < 7 ? '#FF3B30' : theme.textSecondary, fontSize:11, fontWeight: days !== null && days < 7 ? '900' : '400' }}>
                        {days !== null && days < 0 ? `Venceu há ${Math.abs(days)}d` : days === 0 ? 'Vence hoje' : `Vence em ${days}d (${formatDateCoach(coach.coachBillingEnd)})`}
                      </Text>
                    </View>
                  )}
                  <View style={{ flexDirection:'row', alignItems:'center', gap:4 }}>
                    <MaterialCommunityIcons name="account-group" size={12} color={theme.textSecondary} />
                    <Text style={{ color:theme.textSecondary, fontSize:11 }}>{coach._count?.students ?? 0} alunos</Text>
                  </View>
                </View>
                <View style={{ flexDirection:'row', gap:8 }}>
                  <TouchableOpacity
                    style={{ flexDirection:'row', alignItems:'center', gap:4, paddingHorizontal:10, paddingVertical:7, borderRadius:10, borderWidth:1, backgroundColor:theme.accent+'18', borderColor:theme.accent+'40' }}
                    onPress={() => onBilling(coach)}
                  >
                    <MaterialCommunityIcons name="cash-multiple" size={13} color={theme.accent} />
                    <Text style={{ fontSize:11, fontWeight:'900', color:theme.accent }}>BILLING</Text>
                  </TouchableOpacity>
                  {coach.phone && (
                    <TouchableOpacity
                      style={{ flexDirection:'row', alignItems:'center', gap:4, paddingHorizontal:10, paddingVertical:7, borderRadius:10, borderWidth:1, backgroundColor:'#25D36620', borderColor:'#25D36640' }}
                      onPress={() => {
                        const msg = `Fala, ${coach.name.split(' ')[0]}! Tudo certo com seu plano ELITE FIT?`;
                        Linking.openURL(`whatsapp://send?phone=+55${coach.phone.replace(/\D/g,'')}&text=${encodeURIComponent(msg)}`).catch(() => {});
                      }}
                    >
                      <MaterialCommunityIcons name="whatsapp" size={13} color="#25D366" />
                      <Text style={{ fontSize:11, fontWeight:'900', color:'#25D366' }}>ZAPP</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      ))}

      {coaches.length === 0 && !loading && (
        <View style={{ alignItems:'center', padding:48 }}>
          <MaterialCommunityIcons name="account-tie-outline" size={48} color={theme.textSecondary} />
          <Text style={{ color:theme.textSecondary, marginTop:16, fontSize:14, textAlign:'center' }}>Nenhum coach cadastrado ainda.</Text>
        </View>
      )}
    </ScrollView>
  );
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export default function AdminFinanceSystem({ theme, alunos, coachFilter, getLogCoach, isWeb, adminId }) {

  const isMaster = MASTER_IDS.includes(adminId);

  const [activeTab, setActiveTab] = useState('ativos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [offlineClients, setOfflineClients] = useState([]);
  const [isOfflineModalVisible, setIsOfflineModalVisible] = useState(false);
  const [selectedOfflineClient, setSelectedOfflineClient] = useState(null);
  const [isAddingOffline, setIsAddingOffline] = useState(false);

  // Campos do modal de edição
  const [contractType, setContractType] = useState('');
  const [contractValue, setContractValue] = useState('');
  const [paymentDueDate, setPaymentDueDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [isFinanceActive, setIsFinanceActive] = useState(true);
  const [financeCategory, setFinanceCategory] = useState('Consultoria Online');
  const [isSaving, setIsSaving] = useState(false);

  // Campos do modal offline
  const [offlineName, setOfflineName] = useState('');
  const [offlinePhone, setOfflinePhone] = useState('');
  const [offlineContractType, setOfflineContractType] = useState('Mensal');
  const [offlineContractValue, setOfflineContractValue] = useState('');
  const [offlinePaymentDueDate, setOfflinePaymentDueDate] = useState('');
  const [offlineStartDate, setOfflineStartDate] = useState('');
  const [offlineIsActive, setOfflineIsActive] = useState(true);
  const [offlineFinanceCategory, setOfflineFinanceCategory] = useState('Consultoria Online');
  const [isSavingOffline, setIsSavingOffline] = useState(false);

  // ← v2: coaches
  const [coaches,        setCoaches]        = useState([]);
  const [loadingCoaches, setLoadingCoaches] = useState(false);
  const [billingCoach,   setBillingCoach]   = useState(null);

  // ← v2: carrega coaches quando aba COACHES é selecionada
  useEffect(() => {
    if (activeTab === 'coaches' && isMaster) {
      setLoadingCoaches(true);
      fetch(`${BASE_URL}/api/admin/coaches?t=${Date.now()}`)
        .then(r => r.json())
        .then(data => setCoaches(Array.isArray(data) ? data : []))
        .catch(() => {})
        .finally(() => setLoadingCoaches(false));
    }
  }, [activeTab, isMaster]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  };

  const parseDate = (dateString) => {
    if (!dateString) return null;
    const parts = dateString.split('/');
    if (parts.length !== 3) return null;
    const date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T12:00:00Z`);
    return isNaN(date.getTime()) ? null : date.toISOString();
  };

  const calculateNextDueDate = (currentDueDate, contractType) => {
    const date = currentDueDate ? new Date(currentDueDate) : new Date();
    if (isNaN(date.getTime())) return new Date().toISOString();
    const type = contractType?.toLowerCase() || '';
    if (type.includes('trimestral')) date.setMonth(date.getMonth() + 3);
    else if (type.includes('semestral')) date.setMonth(date.getMonth() + 6);
    else if (type.includes('anual')) date.setFullYear(date.getFullYear() + 1);
    else date.setMonth(date.getMonth() + 1);
    return date.toISOString();
  };

  const getDaysUntilDue = (dateString) => {
    if (!dateString) return null;
    const dueDate = new Date(dateString);
    if (isNaN(dueDate.getTime())) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    return Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
  };

  const getStatusInfo = (user) => {
    if (!user.isFinanceActive) return { color: '#8E8E93', label: 'Inativo', icon: 'pause-circle' };
    const days = getDaysUntilDue(user.paymentDueDate);
    if (days === null) return { color: '#8E8E93', label: 'Sem data', icon: 'calendar-remove' };
    if (days < 0) return { color: '#FF3B30', label: `${Math.abs(days)}d atrasado`, icon: 'alert-circle' };
    if (days === 0) return { color: '#FF9500', label: 'Vence hoje', icon: 'clock-alert' };
    if (days <= 5) return { color: '#FF9500', label: `${days}d restantes`, icon: 'clock-outline' };
    return { color: '#34C759', label: `${days}d restantes`, icon: 'check-circle' };
  };

  const loadOfflineClients = useCallback(async () => {
    try {
      const userJson = await AsyncStorage.getItem('user');
      const coachId = userJson ? JSON.parse(userJson).id : null;
      const url = coachId
        ? `${BASE_URL}/api/admin/offline-clients?coachId=${coachId}`
        : `${BASE_URL}/api/admin/offline-clients`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setOfflineClients(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Erro ao carregar clientes offline:', error);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'offline') loadOfflineClients();
  }, [activeTab, loadOfflineClients]);

  const filteredAlunos = (alunos || []).filter(aluno => {
    if (coachFilter && getLogCoach) {
      if (getLogCoach(aluno) !== coachFilter) return false;
    }
    if (searchQuery) {
      return aluno.name?.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const today = new Date(); today.setHours(0, 0, 0, 0);

  const alunosAtivos = filteredAlunos.filter(a => {
    if (!a.isFinanceActive) return false;
    if (!a.contractValue || a.contractValue <= 0) return false;
    return true;
  });

  const alunosVencendo = alunosAtivos.filter(a => {
    const days = getDaysUntilDue(a.paymentDueDate);
    return days !== null && days >= 0 && days <= 7;
  });

  const alunosInadimplentes = alunosAtivos.filter(a => {
    const days = getDaysUntilDue(a.paymentDueDate);
    return days !== null && days < 0;
  });

  const totalMRR = alunosAtivos.reduce((sum, a) => sum + (parseFloat(a.contractValue) || 0), 0);
  const totalVencendo = alunosVencendo.reduce((sum, a) => sum + (parseFloat(a.contractValue) || 0), 0);

  const openEditModal = (user) => {
    setSelectedUser(user);
    setContractType(user.contractType || 'Mensal');
    setContractValue(user.contractValue ? String(user.contractValue) : '');
    setPaymentDueDate(user.paymentDueDate ? formatDate(user.paymentDueDate) : '');
    setStartDate(user.startDate ? formatDate(user.startDate) : '');
    setIsFinanceActive(user.isFinanceActive !== false);
    setFinanceCategory(user.financeCategory || 'Consultoria Online');
    setIsModalVisible(true);
  };

  const handleRenew = () => {
    const currentDate = parseDate(paymentDueDate);
    const nextDate = calculateNextDueDate(currentDate, contractType);
    setPaymentDueDate(formatDate(nextDate));
  };

  const handleSaveContract = async () => {
    if (!selectedUser) return;
    setIsSaving(true);
    try {
      const userJson = await AsyncStorage.getItem('user');
      const adminId = userJson ? JSON.parse(userJson).id : null;
      const response = await fetch(`${BASE_URL}/api/admin/update-contract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          adminId,
          contractType,
          contractValue: parseFloat(contractValue.replace(',', '.')) || 0,
          paymentDueDate: parseDate(paymentDueDate),
          startDate: parseDate(startDate),
          isFinanceActive,
          financeCategory,
        }),
      });
      if (response.ok) {
        setIsModalVisible(false);
        if (Platform.OS === 'web') window.alert('✅ Contrato atualizado com sucesso!');
        else Alert.alert('Sucesso', 'Contrato atualizado com sucesso!');
      } else {
        throw new Error('Falha ao salvar');
      }
    } catch (error) {
      if (Platform.OS === 'web') window.alert('❌ Erro ao salvar contrato');
      else Alert.alert('Erro', 'Não foi possível salvar o contrato.');
    } finally {
      setIsSaving(false);
    }
  };

  const openOfflineModal = (client = null) => {
    if (client) {
      setSelectedOfflineClient(client);
      setOfflineName(client.name || '');
      setOfflinePhone(client.phone || '');
      setOfflineContractType(client.contractType || 'Mensal');
      setOfflineContractValue(client.contractValue ? String(client.contractValue) : '');
      setOfflinePaymentDueDate(client.paymentDueDate ? formatDate(client.paymentDueDate) : '');
      setOfflineStartDate(client.startDate ? formatDate(client.startDate) : '');
      setOfflineIsActive(client.isFinanceActive !== false);
      setOfflineFinanceCategory(client.financeCategory || 'Consultoria Online');
      setIsAddingOffline(false);
    } else {
      setSelectedOfflineClient(null);
      setOfflineName('');
      setOfflinePhone('');
      setOfflineContractType('Mensal');
      setOfflineContractValue('');
      setOfflinePaymentDueDate('');
      setOfflineStartDate('');
      setOfflineIsActive(true);
      setOfflineFinanceCategory('Consultoria Online');
      setIsAddingOffline(true);
    }
    setIsOfflineModalVisible(true);
  };

  const handleOfflineRenew = () => {
    const currentDate = parseDate(offlinePaymentDueDate);
    const nextDate = calculateNextDueDate(currentDate, offlineContractType);
    setOfflinePaymentDueDate(formatDate(nextDate));
  };

  const handleSaveOfflineClient = async () => {
    if (!offlineName.trim()) {
      if (Platform.OS === 'web') window.alert('Nome é obrigatório');
      else Alert.alert('Erro', 'Nome é obrigatório');
      return;
    }
    setIsSavingOffline(true);
    try {
      const userJson = await AsyncStorage.getItem('user');
      const coachId = userJson ? JSON.parse(userJson).id : null;
      const clientId = selectedOfflineClient?.id || `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const response = await fetch(`${BASE_URL}/api/admin/offline-clients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: clientId,
          name: offlineName.trim(),
          phone: offlinePhone,
          contractType: offlineContractType,
          contractValue: parseFloat(offlineContractValue.replace(',', '.')) || 0,
          paymentDueDate: parseDate(offlinePaymentDueDate),
          startDate: parseDate(offlineStartDate),
          isFinanceActive: offlineIsActive,
          financeCategory: offlineFinanceCategory,
          coachId,
          assignedCoach: coachId,
        }),
      });
      if (response.ok) {
        setIsOfflineModalVisible(false);
        await loadOfflineClients();
        if (Platform.OS === 'web') window.alert('✅ Cliente salvo com sucesso!');
        else Alert.alert('Sucesso', 'Cliente salvo com sucesso!');
      } else {
        throw new Error('Falha ao salvar');
      }
    } catch (error) {
      if (Platform.OS === 'web') window.alert('❌ Erro ao salvar cliente');
      else Alert.alert('Erro', 'Não foi possível salvar o cliente.');
    } finally {
      setIsSavingOffline(false);
    }
  };

  const handleDeleteOfflineClient = async (clientId) => {
    const confirmDelete = async () => {
      try {
        const response = await fetch(`${BASE_URL}/api/admin/offline-clients`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: clientId }),
        });
        if (response.ok) {
          setIsOfflineModalVisible(false);
          await loadOfflineClients();
          if (Platform.OS === 'web') window.alert('✅ Cliente removido');
          else Alert.alert('Sucesso', 'Cliente removido');
        }
      } catch (error) {
        if (Platform.OS === 'web') window.alert('❌ Erro ao remover cliente');
        else Alert.alert('Erro', 'Não foi possível remover o cliente.');
      }
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Remover este cliente offline?')) confirmDelete();
    } else {
      Alert.alert('Remover Cliente', 'Tem certeza que deseja remover este cliente?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Remover', style: 'destructive', onPress: confirmDelete },
      ]);
    }
  };

  const getTabAlunos = () => {
    switch (activeTab) {
      case 'ativos':        return alunosAtivos;
      case 'vencendo':      return alunosVencendo;
      case 'inadimplentes': return alunosInadimplentes;
      default:              return [];
    }
  };

  const tabs = [
    { id: 'ativos',        label: `Ativos (${alunosAtivos.length})`            },
    { id: 'vencendo',      label: `Vencendo (${alunosVencendo.length})`        },
    { id: 'inadimplentes', label: `Inadimpl. (${alunosInadimplentes.length})`  },
    { id: 'offline',       label: 'Offline'                                    },
    // ← v2: aba coaches só para masters
    ...(isMaster ? [{ id: 'coaches', label: '🏆 Coaches' }] : []),
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>

      {/* Header com métricas */}
      <View style={[styles.metricsContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.metricItem}>
          <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>MRR TOTAL</Text>
          <Text style={[styles.metricValue, { color: theme.accent }]}>
            R$ {totalMRR.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </Text>
        </View>
        <View style={[styles.metricDivider, { backgroundColor: theme.border }]} />
        <View style={styles.metricItem}>
          <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>VENCENDO</Text>
          <Text style={[styles.metricValue, { color: '#FF9500' }]}>
            R$ {totalVencendo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </Text>
        </View>
        <View style={[styles.metricDivider, { backgroundColor: theme.border }]} />
        <View style={styles.metricItem}>
          <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>INADIMPL.</Text>
          <Text style={[styles.metricValue, { color: '#FF3B30' }]}>{alunosInadimplentes.length}</Text>
        </View>
      </View>

      {/* Barra de busca */}
      <View style={[styles.searchContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <MaterialCommunityIcons name="magnify" size={20} color={theme.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Buscar aluno..."
          placeholderTextColor={theme.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <MaterialCommunityIcons name="close-circle" size={18} color={theme.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.tabsContainer, { borderColor: theme.border }]}
        contentContainerStyle={styles.tabsContent}
      >
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              { borderColor: theme.border },
              activeTab === tab.id && { backgroundColor: theme.accent, borderColor: theme.accent },
            ]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={[
              styles.tabText,
              { color: activeTab === tab.id ? (theme.isDark ? '#000' : '#FFF') : theme.textSecondary },
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Conteúdo */}
      <View style={{ flex: 1, paddingHorizontal: 15 }}>

        {/* ABA COACHES ← v2 */}
        {activeTab === 'coaches' && isMaster && (
          <CoachesFinanceTab
            coaches={coaches}
            loading={loadingCoaches}
            theme={theme}
            onBilling={(c) => setBillingCoach(c)}
          />
        )}

        {/* ABA OFFLINE */}
        {activeTab === 'offline' && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100, paddingTop: 10 }}>
            <TouchableOpacity
              style={[styles.addOfflineButton, { borderColor: theme.accent, backgroundColor: theme.accent + '15' }]}
              onPress={() => openOfflineModal()}
            >
              <MaterialCommunityIcons name="plus-circle-outline" size={22} color={theme.accent} />
              <Text style={[styles.addOfflineText, { color: theme.accent }]}>Adicionar Cliente Offline</Text>
            </TouchableOpacity>

            {offlineClients.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="account-off-outline" size={50} color={theme.textSecondary} />
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                  Nenhum cliente offline cadastrado
                </Text>
                <Text style={[styles.emptySubText, { color: theme.textSecondary }]}>
                  Adicione clientes que não usam o app
                </Text>
              </View>
            ) : (
              offlineClients.map(client => {
                const statusInfo = getStatusInfo(client);
                return (
                  <TouchableOpacity
                    key={client.id}
                    style={[styles.userCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                    onPress={() => openOfflineModal(client)}
                  >
                    <View style={[styles.statusIndicator, { backgroundColor: statusInfo.color }]} />
                    <View style={styles.userInfo}>
                      <View style={styles.userNameRow}>
                        <Text style={[styles.userName, { color: theme.text }]} numberOfLines={1}>{client.name}</Text>
                        <View style={[styles.offlineBadge, { backgroundColor: theme.accent + '20' }]}>
                          <Text style={[styles.offlineBadgeText, { color: theme.accent }]}>OFFLINE</Text>
                        </View>
                      </View>
                      <Text style={[styles.userCategory, { color: theme.textSecondary }]}>
                        {client.financeCategory || 'Consultoria'} • {client.contractType || 'Mensal'}
                      </Text>
                      <View style={styles.statusRow}>
                        <MaterialCommunityIcons name={statusInfo.icon} size={12} color={statusInfo.color} />
                        <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
                      </View>
                    </View>
                    <View style={styles.userValueContainer}>
                      <Text style={[styles.userValue, { color: theme.accent }]}>
                        R$ {parseFloat(client.contractValue || 0).toFixed(2).replace('.', ',')}
                      </Text>
                      {client.paymentDueDate && (
                        <Text style={[styles.dueDateText, { color: theme.textSecondary }]}>
                          {formatDate(client.paymentDueDate)}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        )}

        {/* ABAS DE ALUNOS */}
        {activeTab !== 'offline' && activeTab !== 'coaches' && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100, paddingTop: 10 }}>
            {getTabAlunos().length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="account-search-outline" size={50} color={theme.textSecondary} />
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                  {activeTab === 'ativos'        ? 'Nenhum aluno ativo com contrato'       : ''}
                  {activeTab === 'vencendo'      ? 'Nenhum vencimento nos próximos 7 dias'  : ''}
                  {activeTab === 'inadimplentes' ? 'Nenhum aluno inadimplente 🎉'           : ''}
                </Text>
              </View>
            ) : (
              getTabAlunos().map(aluno => {
                const statusInfo = getStatusInfo(aluno);
                return (
                  <TouchableOpacity
                    key={aluno.id}
                    style={[styles.userCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                    onPress={() => openEditModal(aluno)}
                  >
                    <View style={[styles.statusIndicator, { backgroundColor: statusInfo.color }]} />
                    <View style={styles.userInfo}>
                      <View style={styles.userNameRow}>
                        <Text style={[styles.userName, { color: theme.text }]} numberOfLines={1}>{aluno.name}</Text>
                      </View>
                      <Text style={[styles.userCategory, { color: theme.textSecondary }]}>
                        {aluno.financeCategory || 'Consultoria'} • {aluno.contractType || 'Mensal'}
                      </Text>
                      <View style={styles.statusRow}>
                        <MaterialCommunityIcons name={statusInfo.icon} size={12} color={statusInfo.color} />
                        <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
                      </View>
                    </View>
                    <View style={styles.userValueContainer}>
                      <Text style={[styles.userValue, { color: theme.accent }]}>
                        R$ {parseFloat(aluno.contractValue || 0).toFixed(2).replace('.', ',')}
                      </Text>
                      {aluno.paymentDueDate && (
                        <Text style={[styles.dueDateText, { color: theme.textSecondary }]}>
                          {formatDate(aluno.paymentDueDate)}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        )}
      </View>

      {/* Modal de edição de contrato */}
      <Modal visible={isModalVisible} animationType="slide" transparent onRequestClose={() => setIsModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme.bg, borderColor: theme.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <View>
                <Text style={[styles.modalTitle, { color: theme.text }]}>{selectedUser?.name}</Text>
                <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>Editar contrato financeiro</Text>
              </View>
              <TouchableOpacity onPress={() => setIsModalVisible(false)} style={styles.closeButton}>
                <MaterialCommunityIcons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>

              {/* Status ativo */}
              <View style={[styles.switchRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View>
                  <Text style={[styles.switchLabel, { color: theme.text }]}>Contrato Ativo</Text>
                  <Text style={[styles.switchSubLabel, { color: theme.textSecondary }]}>
                    {isFinanceActive ? 'Aluno está em dia' : 'Aluno inativo'}
                  </Text>
                </View>
                <Switch
                  value={isFinanceActive}
                  onValueChange={setIsFinanceActive}
                  trackColor={{ false: theme.border, true: theme.accent + '60' }}
                  thumbColor={isFinanceActive ? theme.accent : '#f4f3f4'}
                />
              </View>

              {/* Categoria */}
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>CATEGORIA</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 15 }}>
                {['Consultoria Online', 'Consultoria Presencial', 'Ficha de Treino', 'Nutrição', 'Personal + Nutrição', 'Avulso'].map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.categoryChip, { borderColor: theme.border, backgroundColor: financeCategory === cat ? theme.accent : theme.surface }]}
                    onPress={() => setFinanceCategory(cat)}
                  >
                    <Text style={{ color: financeCategory === cat ? (theme.isDark ? '#000' : '#FFF') : theme.textSecondary, fontSize: 11, fontWeight: '600' }}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Tipo de contrato */}
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>TIPO DE CONTRATO</Text>
              <View style={styles.contractTypeRow}>
                {['Mensal', 'Trimestral', 'Semestral', 'Anual'].map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.contractTypeButton, { borderColor: theme.border, backgroundColor: contractType === type ? theme.accent : theme.surface }]}
                    onPress={() => setContractType(type)}
                  >
                    <Text style={{ color: contractType === type ? (theme.isDark ? '#000' : '#FFF') : theme.textSecondary, fontSize: 12, fontWeight: '600' }}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Valor */}
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>VALOR MENSAL (R$)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                value={contractValue}
                onChangeText={setContractValue}
                placeholder="0,00"
                placeholderTextColor={theme.textSecondary}
                keyboardType="decimal-pad"
              />

              {/* Datas */}
              <View style={styles.dateRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>DATA DE INÍCIO</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                    value={startDate}
                    onChangeText={setStartDate}
                    placeholder="DD/MM/AAAA"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="numeric"
                    maxLength={10}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>VENCIMENTO</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                    value={paymentDueDate}
                    onChangeText={setPaymentDueDate}
                    placeholder="DD/MM/AAAA"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="numeric"
                    maxLength={10}
                  />
                </View>
              </View>

              {/* Botão RENOVOU */}
              <TouchableOpacity style={[styles.renewButton, { backgroundColor: '#34C75920', borderColor: '#34C75950' }]} onPress={handleRenew}>
                <MaterialCommunityIcons name="calendar-check" size={18} color="#34C759" />
                <Text style={[styles.renewButtonText, { color: '#34C759' }]}>RENOVOU — Avançar Vencimento</Text>
              </TouchableOpacity>

              {/* Salvar */}
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: theme.accent }, isSaving && { opacity: 0.7 }]}
                onPress={handleSaveContract}
                disabled={isSaving}
              >
                {isSaving ? <ActivityIndicator color={theme.isDark ? '#000' : '#FFF'} /> : (
                  <>
                    <MaterialCommunityIcons name="content-save-outline" size={20} color={theme.isDark ? '#000' : '#FFF'} />
                    <Text style={[styles.saveButtonText, { color: theme.isDark ? '#000' : '#FFF' }]}>SALVAR CONTRATO</Text>
                  </>
                )}
              </TouchableOpacity>

            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal de cliente offline */}
      <Modal visible={isOfflineModalVisible} animationType="slide" transparent onRequestClose={() => setIsOfflineModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme.bg, borderColor: theme.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <View>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  {isAddingOffline ? 'Novo Cliente Offline' : selectedOfflineClient?.name}
                </Text>
                <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                  {isAddingOffline ? 'Adicionar aluno fora do app' : 'Editar cliente offline'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setIsOfflineModalVisible(false)} style={styles.closeButton}>
                <MaterialCommunityIcons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>

              <View style={[styles.switchRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View>
                  <Text style={[styles.switchLabel, { color: theme.text }]}>Contrato Ativo</Text>
                  <Text style={[styles.switchSubLabel, { color: theme.textSecondary }]}>
                    {offlineIsActive ? 'Cliente ativo' : 'Cliente inativo'}
                  </Text>
                </View>
                <Switch
                  value={offlineIsActive}
                  onValueChange={setOfflineIsActive}
                  trackColor={{ false: theme.border, true: theme.accent + '60' }}
                  thumbColor={offlineIsActive ? theme.accent : '#f4f3f4'}
                />
              </View>

              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>NOME *</Text>
              <TextInput style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]} value={offlineName} onChangeText={setOfflineName} placeholder="Nome completo" placeholderTextColor={theme.textSecondary} />

              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>WHATSAPP</Text>
              <TextInput style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]} value={offlinePhone} onChangeText={setOfflinePhone} placeholder="(00) 00000-0000" placeholderTextColor={theme.textSecondary} keyboardType="phone-pad" />

              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>CATEGORIA</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 15 }}>
                {['Consultoria Online', 'Consultoria Presencial', 'Ficha de Treino', 'Nutrição', 'Personal + Nutrição', 'Avulso'].map(cat => (
                  <TouchableOpacity key={cat} style={[styles.categoryChip, { borderColor: theme.border, backgroundColor: offlineFinanceCategory === cat ? theme.accent : theme.surface }]} onPress={() => setOfflineFinanceCategory(cat)}>
                    <Text style={{ color: offlineFinanceCategory === cat ? (theme.isDark ? '#000' : '#FFF') : theme.textSecondary, fontSize: 11, fontWeight: '600' }}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>TIPO DE CONTRATO</Text>
              <View style={styles.contractTypeRow}>
                {['Mensal', 'Trimestral', 'Semestral', 'Anual'].map(type => (
                  <TouchableOpacity key={type} style={[styles.contractTypeButton, { borderColor: theme.border, backgroundColor: offlineContractType === type ? theme.accent : theme.surface }]} onPress={() => setOfflineContractType(type)}>
                    <Text style={{ color: offlineContractType === type ? (theme.isDark ? '#000' : '#FFF') : theme.textSecondary, fontSize: 12, fontWeight: '600' }}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>VALOR MENSAL (R$)</Text>
              <TextInput style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]} value={offlineContractValue} onChangeText={setOfflineContractValue} placeholder="0,00" placeholderTextColor={theme.textSecondary} keyboardType="decimal-pad" />

              <View style={styles.dateRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>DATA DE INÍCIO</Text>
                  <TextInput style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]} value={offlineStartDate} onChangeText={setOfflineStartDate} placeholder="DD/MM/AAAA" placeholderTextColor={theme.textSecondary} keyboardType="numeric" maxLength={10} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>VENCIMENTO</Text>
                  <TextInput style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]} value={offlinePaymentDueDate} onChangeText={setOfflinePaymentDueDate} placeholder="DD/MM/AAAA" placeholderTextColor={theme.textSecondary} keyboardType="numeric" maxLength={10} />
                </View>
              </View>

              <TouchableOpacity style={[styles.renewButton, { backgroundColor: '#34C75920', borderColor: '#34C75950' }]} onPress={handleOfflineRenew}>
                <MaterialCommunityIcons name="calendar-check" size={18} color="#34C759" />
                <Text style={[styles.renewButtonText, { color: '#34C759' }]}>RENOVOU — Avançar Vencimento</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.accent }, isSavingOffline && { opacity: 0.7 }]} onPress={handleSaveOfflineClient} disabled={isSavingOffline}>
                {isSavingOffline ? <ActivityIndicator color={theme.isDark ? '#000' : '#FFF'} /> : (
                  <><MaterialCommunityIcons name="content-save-outline" size={20} color={theme.isDark ? '#000' : '#FFF'} /><Text style={[styles.saveButtonText, { color: theme.isDark ? '#000' : '#FFF' }]}>SALVAR CLIENTE</Text></>
                )}
              </TouchableOpacity>

              {!isAddingOffline && selectedOfflineClient && (
                <TouchableOpacity style={[styles.saveButton, { backgroundColor: '#FF3B3015', borderWidth: 1, borderColor: '#FF3B3040', marginTop: 8 }]} onPress={() => handleDeleteOfflineClient(selectedOfflineClient.id)}>
                  <MaterialCommunityIcons name="delete-outline" size={20} color="#FF3B30" />
                  <Text style={[styles.saveButtonText, { color: '#FF3B30' }]}>REMOVER CLIENTE</Text>
                </TouchableOpacity>
              )}

            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* CoachBillingModal ← v2 */}
      <CoachBillingModal
        visible={!!billingCoach}
        onClose={() => setBillingCoach(null)}
        coach={billingCoach}
        theme={theme}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container:          { flex: 1 },
  metricsContainer:   { flexDirection: 'row', padding: 15, borderBottomWidth: 1, alignItems: 'center' },
  metricItem:         { flex: 1, alignItems: 'center' },
  metricLabel:        { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, marginBottom: 4 },
  metricValue:        { fontSize: 18, fontWeight: '900' },
  metricDivider:      { width: 1, height: 40, marginHorizontal: 10 },
  searchContainer:    { flexDirection: 'row', alignItems: 'center', margin: 15, padding: 10, borderRadius: 12, borderWidth: 1, gap: 8 },
  searchInput:        { flex: 1, fontSize: 14, outlineStyle: 'none' },
  tabsContainer:      { borderBottomWidth: 1, flexGrow: 0 },
  tabsContent:        { paddingHorizontal: 15, paddingVertical: 10, gap: 8 },
  tab:                { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  tabText:            { fontSize: 12, fontWeight: '700' },
  userCard:           { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  statusIndicator:    { width: 4, height: '100%', borderRadius: 2, marginRight: 10, minHeight: 40 },
  userInfo:           { flex: 1 },
  userNameRow:        { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  userName:           { fontSize: 14, fontWeight: '700', flex: 1 },
  userCategory:       { fontSize: 11, marginBottom: 4 },
  statusRow:          { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusText:         { fontSize: 11, fontWeight: '600' },
  userValueContainer: { alignItems: 'flex-end' },
  userValue:          { fontSize: 16, fontWeight: '900' },
  dueDateText:        { fontSize: 10, marginTop: 2 },
  offlineBadge:       { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  offlineBadgeText:   { fontSize: 9, fontWeight: '800' },
  addOfflineButton:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', marginBottom: 15 },
  addOfflineText:     { fontSize: 14, fontWeight: '700' },
  emptyContainer:     { alignItems: 'center', paddingVertical: 40 },
  emptyText:          { fontSize: 16, fontWeight: '600', marginTop: 12, textAlign: 'center' },
  emptySubText:       { fontSize: 13, marginTop: 4, textAlign: 'center' },
  modalOverlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer:     { borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, maxHeight: '90%' },
  modalHeader:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
  modalTitle:         { fontSize: 18, fontWeight: '900' },
  modalSubtitle:      { fontSize: 12, marginTop: 2 },
  closeButton:        { padding: 4 },
  modalContent:       { padding: 20 },
  switchRow:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderRadius: 12, borderWidth: 1, marginBottom: 20 },
  switchLabel:        { fontSize: 15, fontWeight: '700' },
  switchSubLabel:     { fontSize: 12, marginTop: 2 },
  fieldLabel:         { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 8 },
  input:              { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 15, marginBottom: 15 },
  categoryChip:       { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  contractTypeRow:    { flexDirection: 'row', gap: 8, marginBottom: 15, flexWrap: 'wrap' },
  contractTypeButton: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  dateRow:            { flexDirection: 'row', marginBottom: 5 },
  renewButton:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 15 },
  renewButtonText:    { fontSize: 14, fontWeight: '700' },
  saveButton:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 14, marginBottom: 10 },
  saveButtonText:     { fontSize: 15, fontWeight: '900' },
});