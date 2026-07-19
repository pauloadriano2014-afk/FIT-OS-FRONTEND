// src/components/AdminFinanceSystem.js — v2
// v2: aba COACHES para masters — MRR, status de billing, acesso ao CoachBillingModal
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput,
  Modal, Switch, Platform, Alert, ActivityIndicator, FlatList, Linking,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CoachBillingModal from './Admin/CoachBillingModal'; // ← v2

const BASE_URL = 'https://fitos-final.onrender.com';

const MASTER_IDS = [
  '3c82f763-66b4-48da-836e-16817d4f57c0',
  'b7c0c181-41fd-4156-b8fe-963a267759a3',
];

// ─── UTILS ───────────────────────────────────────────────────────────────────
const fmt = (v) =>
  `R$ ${Number(v || 0)
    .toFixed(2)
    .replace('.', ',')
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;

const parseBRDate = (str) => {
  if (!str || str.length < 10) return null;
  const [d, m, y] = str.split('/');
  if (!d || !m || !y) return null;
  return new Date(`${y}-${m}-${d}T12:00:00Z`);
};

const toBRDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return '';
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

const daysUntilDue = (iso) => {
  if (!iso) return null;
  const due = new Date(iso);
  due.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((due - today) / (1000 * 3600 * 24));
};

const getStatusColor = (days, isActive) => {
  if (!isActive) return '#8E8E93';
  if (days === null) return '#8E8E93';
  if (days < 0) return '#FF3B30';
  if (days <= 7) return '#FF9500';
  return '#34C759';
};

const getStatusLabel = (days, isActive) => {
  if (!isActive) return 'INATIVO';
  if (days === null) return 'SEM DATA';
  if (days < 0) return `VENCIDO ${Math.abs(days)}d`;
  if (days === 0) return 'VENCE HOJE';
  if (days <= 7) return `VENCE EM ${days}d`;
  return 'EM DIA';
};

const calcNextDueDate = (current, contractType) => {
  const base = current ? new Date(current) : new Date();
  if (isNaN(base)) return new Date();
  const type = (contractType || '').toLowerCase();
  if (type.includes('trimestral') || type.includes('trimestre')) {
    base.setMonth(base.getMonth() + 3);
  } else if (type.includes('semestral') || type.includes('semestre')) {
    base.setMonth(base.getMonth() + 6);
  } else if (type.includes('anual') || type.includes('ano')) {
    base.setFullYear(base.getFullYear() + 1);
  } else {
    base.setMonth(base.getMonth() + 1);
  }
  return base;
};

// ─── BILLING STATUS (coaches) ─────────────────────────────────────────────────
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

const formatDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
};

const daysUntilCoach = (iso) => {
  if (!iso) return null;
  const due = new Date(iso);
  due.setHours(0,0,0,0);
  const today = new Date();
  today.setHours(0,0,0,0);
  return Math.round((due - today) / (1000 * 3600 * 24));
};

// ─── PLAN MONTHLY PRICES (coaches) ───────────────────────────────────────────
const PLAN_MONTHLY = {
  PERSONAL_MONTHLY:97,    PERSONAL_QUARTERLY:91,  PERSONAL_SEMIANNUAL:85, PERSONAL_ANNUAL:79,    PERSONAL_LAUNCH:69.9,
  NUTRI_MONTHLY:97,       NUTRI_QUARTERLY:91,     NUTRI_SEMIANNUAL:85,    NUTRI_ANNUAL:79,       NUTRI_LAUNCH:69.9,
  ELITE_MONTHLY:147,      ELITE_QUARTERLY:138,    ELITE_SEMIANNUAL:129,   ELITE_ANNUAL:119,      ELITE_LAUNCH:109.9,
};

// ─── FINANCE EDIT MODAL ───────────────────────────────────────────────────────
function FinanceEditModal({ visible, user, onClose, onSaved, theme }) {
  const [contractType,     setContractType]     = useState('');
  const [contractValue,    setContractValue]    = useState('');
  const [paymentDueDate,   setPaymentDueDate]   = useState('');
  const [startDate,        setStartDate]        = useState('');
  const [financeCategory,  setFinanceCategory]  = useState('Consultoria Online');
  const [isFinanceActive,  setIsFinanceActive]  = useState(true);
  const [saving,           setSaving]           = useState(false);

  useEffect(() => {
    if (user) {
      setContractType(user.contractType    || 'Mensal');
      setContractValue(user.contractValue  ? String(user.contractValue) : '');
      setPaymentDueDate(user.paymentDueDate ? toBRDate(user.paymentDueDate) : '');
      setStartDate(user.startDate          ? toBRDate(user.startDate)       : '');
      setFinanceCategory(user.financeCategory || 'Consultoria Online');
      setIsFinanceActive(user.isFinanceActive !== false);
    }
  }, [user]);

  const handleRenew = () => {
    const currentDue = parseBRDate(paymentDueDate);
    const next = calcNextDueDate(currentDue, contractType);
    setPaymentDueDate(toBRDate(next.toISOString()));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const body = {
        userId:         user.id,
        contractType,
        contractValue:  parseFloat(String(contractValue).replace(',', '.')) || 0,
        paymentDueDate: parseBRDate(paymentDueDate)?.toISOString() || null,
        startDate:      parseBRDate(startDate)?.toISOString()      || null,
        financeCategory,
        isFinanceActive,
      };
      const res = await fetch(`${BASE_URL}/api/admin/update-contract`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      onSaved({ ...user, ...body, paymentDueDate: body.paymentDueDate, startDate: body.startDate });
      onClose();
      if (Platform.OS === 'web') window.alert('Contrato atualizado!');
      else Alert.alert('Sucesso', 'Contrato atualizado!');
    } catch {
      if (Platform.OS === 'web') window.alert('Erro ao salvar.');
      else Alert.alert('Erro', 'Falha ao salvar contrato.');
    } finally { setSaving(false); }
  };

  if (!user) return null;

  const categories = [
    'Consultoria Online', 'Consultoria Presencial', 'Ficha de Treino',
    'Nutrição', 'Personal + Nutrição', 'Avulso',
  ];
  const types = ['Mensal', 'Trimestral', 'Semestral', 'Anual'];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalBox, { backgroundColor: theme.bg, borderColor: theme.border }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <View>
              <Text style={{ color: theme.text, fontWeight: '900', fontSize: 16 }}>{user.name}</Text>
              <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 2 }}>Editar contrato financeiro</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} showsVerticalScrollIndicator={false}>
            {/* Status ativo */}
            <View style={[styles.row, { justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.surface, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: theme.border }]}>
              <View>
                <Text style={{ color: theme.text, fontWeight: '800', fontSize: 14 }}>Contrato ativo</Text>
                <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 2 }}>
                  {isFinanceActive ? 'Aluno está ativo no financeiro' : 'Aluno inativo no financeiro'}
                </Text>
              </View>
              <Switch
                value={isFinanceActive}
                onValueChange={setIsFinanceActive}
                trackColor={{ false: theme.border, true: theme.accent + '60' }}
                thumbColor={isFinanceActive ? theme.accent : theme.textSecondary}
              />
            </View>

            {/* Categoria */}
            <View>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>CATEGORIA</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {categories.map(cat => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.chip, { backgroundColor: financeCategory === cat ? theme.accent : theme.surface, borderColor: financeCategory === cat ? theme.accent : theme.border }]}
                      onPress={() => setFinanceCategory(cat)}
                    >
                      <Text style={{ color: financeCategory === cat ? '#000' : theme.textSecondary, fontSize: 11, fontWeight: '800' }}>{cat}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Tipo de contrato */}
            <View>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>TIPO DE CONTRATO</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                {types.map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.chip, { backgroundColor: contractType === t ? theme.accent : theme.surface, borderColor: contractType === t ? theme.accent : theme.border }]}
                    onPress={() => setContractType(t)}
                  >
                    <Text style={{ color: contractType === t ? '#000' : theme.textSecondary, fontSize: 11, fontWeight: '800' }}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Valor */}
            <View>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>VALOR MENSAL (R$)</Text>
              <TextInput
                style={[styles.fieldInput, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                value={contractValue}
                onChangeText={setContractValue}
                placeholder="0,00"
                placeholderTextColor={theme.textSecondary}
                keyboardType="decimal-pad"
              />
            </View>

            {/* Datas */}
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>INÍCIO</Text>
                <TextInput
                  style={[styles.fieldInput, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
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
                  style={[styles.fieldInput, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
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
            <TouchableOpacity
              style={[styles.renewBtn, { backgroundColor: '#34C75920', borderColor: '#34C75950' }]}
              onPress={handleRenew}
            >
              <MaterialCommunityIcons name="refresh" size={16} color="#34C759" />
              <Text style={{ color: '#34C759', fontWeight: '900', fontSize: 13 }}>RENOVOU — Avançar vencimento</Text>
            </TouchableOpacity>

            {/* Salvar */}
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: theme.accent }, saving && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator color="#000" />
                : <><MaterialCommunityIcons name="content-save-outline" size={18} color="#000" /><Text style={{ color: '#000', fontWeight: '900', fontSize: 14 }}>SALVAR CONTRATO</Text></>
              }
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── OFFLINE CLIENT MODAL ─────────────────────────────────────────────────────
function OfflineClientModal({ visible, client, onClose, onSaved, onDeleted, theme }) {
  const [name,            setName]            = useState('');
  const [phone,           setPhone]           = useState('');
  const [plan,            setPlan]            = useState('Consultoria');
  const [financeCategory, setFinanceCategory] = useState('Consultoria Online');
  const [contractType,    setContractType]    = useState('Mensal');
  const [contractValue,   setContractValue]   = useState('');
  const [startDate,       setStartDate]       = useState('');
  const [paymentDueDate,  setPaymentDueDate]  = useState('');
  const [isFinanceActive, setIsFinanceActive] = useState(true);
  const [saving,          setSaving]          = useState(false);
  const [coachId,         setCoachId]         = useState('');

  useEffect(() => {
    AsyncStorage.getItem('user').then(json => {
      if (json) setCoachId(JSON.parse(json).id ?? '');
    });
    if (client) {
      setName(client.name || '');
      setPhone(client.phone || '');
      setPlan(client.plan || 'Consultoria');
      setFinanceCategory(client.financeCategory || 'Consultoria Online');
      setContractType(client.contractType    || 'Mensal');
      setContractValue(client.contractValue  ? String(client.contractValue) : '');
      setStartDate(client.startDate          ? toBRDate(client.startDate)       : '');
      setPaymentDueDate(client.paymentDueDate ? toBRDate(client.paymentDueDate) : '');
      setIsFinanceActive(client.isFinanceActive !== false);
    } else {
      setName(''); setPhone(''); setPlan('Consultoria');
      setFinanceCategory('Consultoria Online'); setContractType('Mensal');
      setContractValue(''); setStartDate(''); setPaymentDueDate('');
      setIsFinanceActive(true);
    }
  }, [client, visible]);

  const handleRenew = () => {
    const currentDue = parseBRDate(paymentDueDate);
    const next = calcNextDueDate(currentDue, contractType);
    setPaymentDueDate(toBRDate(next.toISOString()));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      if (Platform.OS === 'web') window.alert('Nome obrigatório.');
      else Alert.alert('Atenção', 'Nome obrigatório.');
      return;
    }
    setSaving(true);
    try {
      const id = client?.id || `offline_${Date.now()}`;
      const body = {
        id, name: name.trim(), phone, plan, financeCategory, contractType,
        contractValue: parseFloat(String(contractValue).replace(',', '.')) || 0,
        startDate:      parseBRDate(startDate)?.toISOString()      || null,
        paymentDueDate: parseBRDate(paymentDueDate)?.toISOString() || null,
        isFinanceActive,
        assignedCoach: coachId,
        coachId,
      };
      const res = await fetch(`${BASE_URL}/api/admin/offline-clients`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      onSaved(data.client || body);
      onClose();
      if (Platform.OS === 'web') window.alert('Cliente salvo!');
      else Alert.alert('Sucesso', 'Cliente salvo!');
    } catch {
      if (Platform.OS === 'web') window.alert('Erro ao salvar.');
      else Alert.alert('Erro', 'Falha ao salvar cliente.');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!client?.id) return;
    const run = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/admin/offline-clients`, {
          method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: client.id }),
        });
        if (!res.ok) throw new Error();
        onDeleted(client.id);
        onClose();
        if (Platform.OS === 'web') window.alert('Cliente removido.');
        else Alert.alert('Removido', 'Cliente offline removido.');
      } catch {
        if (Platform.OS === 'web') window.alert('Erro ao remover.');
        else Alert.alert('Erro', 'Falha ao remover.');
      }
    };
    if (Platform.OS === 'web') { if (window.confirm('Remover este cliente offline?')) run(); }
    else Alert.alert('Remover', 'Remover este cliente offline?', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Remover', style: 'destructive', onPress: run }]);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalBox, { backgroundColor: theme.bg, borderColor: theme.border }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <View>
              <Text style={{ color: theme.text, fontWeight: '900', fontSize: 16 }}>
                {client ? 'Editar Cliente Offline' : 'Novo Cliente Offline'}
              </Text>
              <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 2 }}>Aluno fora do app</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }} showsVerticalScrollIndicator={false}>
            {[
              { label:'NOME *',       value:name,          setter:setName,         placeholder:'Nome completo'    },
              { label:'WHATSAPP',     value:phone,         setter:setPhone,        placeholder:'(00) 00000-0000', keyboard:'phone-pad' },
              { label:'CATEGORIA',    value:financeCategory,setter:setFinanceCategory,placeholder:'Consultoria Online' },
              { label:'TIPO',         value:contractType,  setter:setContractType, placeholder:'Mensal'           },
              { label:'VALOR (R$)',   value:contractValue, setter:setContractValue,placeholder:'0,00',            keyboard:'decimal-pad' },
              { label:'INÍCIO',       value:startDate,     setter:setStartDate,    placeholder:'DD/MM/AAAA',      keyboard:'numeric', max:10 },
              { label:'VENCIMENTO',   value:paymentDueDate,setter:setPaymentDueDate,placeholder:'DD/MM/AAAA',     keyboard:'numeric', max:10 },
            ].map(({ label, value, setter, placeholder, keyboard, max }) => (
              <View key={label}>
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{label}</Text>
                <TextInput
                  style={[styles.fieldInput, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                  value={value} onChangeText={setter} placeholder={placeholder}
                  placeholderTextColor={theme.textSecondary} keyboardType={keyboard} maxLength={max}
                />
              </View>
            ))}
            <View style={[styles.row, { justifyContent: 'space-between', alignItems: 'center' }]}>
              <Text style={{ color: theme.text, fontWeight: '700' }}>Ativo</Text>
              <Switch value={isFinanceActive} onValueChange={setIsFinanceActive}
                trackColor={{ false: theme.border, true: theme.accent + '60' }}
                thumbColor={isFinanceActive ? theme.accent : theme.textSecondary} />
            </View>
            <TouchableOpacity style={[styles.renewBtn, { backgroundColor: '#34C75920', borderColor: '#34C75950' }]} onPress={handleRenew}>
              <MaterialCommunityIcons name="refresh" size={16} color="#34C759" />
              <Text style={{ color: '#34C759', fontWeight: '900', fontSize: 13 }}>RENOVOU — Avançar vencimento</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.accent }, saving && { opacity: 0.7 }]} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color="#000" />
                : <><MaterialCommunityIcons name="content-save-outline" size={18} color="#000" /><Text style={{ color: '#000', fontWeight: '900', fontSize: 14 }}>SALVAR</Text></>}
            </TouchableOpacity>
            {client && (
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: '#FF3B3018', borderWidth: 1, borderColor: '#FF3B3040' }]} onPress={handleDelete}>
                <MaterialCommunityIcons name="delete-outline" size={18} color="#FF3B30" />
                <Text style={{ color: '#FF3B30', fontWeight: '900', fontSize: 14 }}>REMOVER CLIENTE</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── OFFLINE CLIENT CARD ──────────────────────────────────────────────────────
function OfflineClientCard({ client, onPress, theme }) {
  const days  = daysUntilDue(client.paymentDueDate);
  const color = getStatusColor(days, client.isFinanceActive);
  const label = getStatusLabel(days, client.isFinanceActive);
  return (
    <TouchableOpacity
      style={[styles.userCard, { backgroundColor: theme.surface, borderColor: color + '40' }]}
      onPress={onPress} activeOpacity={0.75}
    >
      <View style={[styles.offlineBadge, { backgroundColor: theme.accent + '18' }]}>
        <MaterialCommunityIcons name="account-off-outline" size={18} color={theme.accent} />
      </View>
      <View style={{ flex: 1, paddingLeft: 10 }}>
        <View style={styles.row}>
          <Text style={{ color: theme.text, fontWeight: '900', fontSize: 14, flex: 1 }} numberOfLines={1}>{client.name}</Text>
          <View style={[styles.statusPill, { backgroundColor: color + '20', borderColor: color + '50' }]}>
            <Text style={{ fontSize: 9, fontWeight: '900', color }}>{label}</Text>
          </View>
        </View>
        <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 2 }}>
          {client.financeCategory || 'Offline'} · {client.contractType || '—'}
        </Text>
        {client.paymentDueDate && (
          <Text style={{ color: color, fontSize: 11, marginTop: 2, fontWeight: days !== null && days <= 7 ? '900' : '400' }}>
            Venc. {toBRDate(client.paymentDueDate)}
          </Text>
        )}
      </View>
      <Text style={{ color: theme.accent, fontWeight: '900', fontSize: 16 }}>{fmt(client.contractValue)}</Text>
    </TouchableOpacity>
  );
}

// ─── ABA COACHES — v2 ─────────────────────────────────────────────────────────
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
      <View style={styles.summaryRow}>
        {[
          { label:'MRR',        value:`R$${mrr.toFixed(0)}`,   color:theme.accent, icon:'cash-multiple'        },
          { label:'ATIVOS',     value:String(active.length),   color:'#34C759',    icon:'check-circle-outline' },
          { label:'INADIMPL.',  value:String(overdue.length),  color:'#FF3B30',    icon:'alert-circle-outline' },
          { label:'PENDENTES',  value:String(pending.length),  color:'#FF9500',    icon:'clock-outline'        },
        ].map(({ label, value, color, icon }) => (
          <View key={label} style={[styles.summaryCard, { backgroundColor:theme.surface, borderColor:color+'40' }]}>
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
      ].map(({ list, title, color }) => list.length === 0 ? null : (
        <View key={title} style={{ marginTop:16 }}>
          <Text style={{ color:theme.textSecondary, fontSize:11, fontWeight:'900', letterSpacing:0.5, marginBottom:8 }}>{title}</Text>
          {list.map(coach => {
            const days      = daysUntilCoach(coach.coachBillingEnd);
            const statusClr = BILLING_STATUS_COLORS[coach.coachBillingStatus] ?? '#8E8E93';
            const planLabel = (coach.coachBillingPlan ?? '—').replace(/_/g,' ');
            return (
              <View key={coach.id} style={[styles.coachCard, { backgroundColor:theme.surface, borderColor:theme.border }]}>
                <View style={{ flexDirection:'row', alignItems:'center', gap:10, marginBottom:8 }}>
                  <View style={[styles.coachAvatar, { backgroundColor:statusClr+'20' }]}>
                    <MaterialCommunityIcons name="account-tie" size={18} color={statusClr} />
                  </View>
                  <View style={{ flex:1 }}>
                    <Text style={{ color:theme.text, fontWeight:'900', fontSize:14 }} numberOfLines={1}>{coach.name}</Text>
                    <Text style={{ color:theme.textSecondary, fontSize:11 }} numberOfLines={1}>{coach.email}</Text>
                  </View>
                  <View style={[styles.statusPill, { backgroundColor:statusClr+'20', borderColor:statusClr+'50' }]}>
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
                        {days !== null && days < 0
                          ? `Venceu há ${Math.abs(days)}d`
                          : days === 0 ? 'Vence hoje'
                          : `Vence em ${days}d (${formatDate(coach.coachBillingEnd)})`}
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
                    style={[styles.coachActionBtn, { backgroundColor:theme.accent+'18', borderColor:theme.accent+'40' }]}
                    onPress={() => onBilling(coach)}
                  >
                    <MaterialCommunityIcons name="cash-multiple" size={13} color={theme.accent} />
                    <Text style={{ fontSize:11, fontWeight:'900', color:theme.accent }}>BILLING</Text>
                  </TouchableOpacity>
                  {coach.phone && (
                    <TouchableOpacity
                      style={[styles.coachActionBtn, { backgroundColor:'#25D36620', borderColor:'#25D36640' }]}
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
export default function AdminFinanceSystem({ theme, alunos = [], coachFilter, getLogCoach, isWeb, adminId }) {
  const isMaster = MASTER_IDS.includes(adminId);

  const [activeTab,        setActiveTab]        = useState('ATIVOS');
  const [search,           setSearch]           = useState('');
  const [offlineClients,   setOfflineClients]   = useState([]);
  const [loadingOffline,   setLoadingOffline]   = useState(false);
  const [editingUser,      setEditingUser]      = useState(null);
  const [financeModalOpen, setFinanceModalOpen] = useState(false);
  const [offlineModalOpen, setOfflineModalOpen] = useState(false);
  const [editingOffline,   setEditingOffline]   = useState(null);

  // ← v2: coaches
  const [coaches,        setCoaches]        = useState([]);
  const [loadingCoaches, setLoadingCoaches] = useState(false);
  const [billingCoach,   setBillingCoach]   = useState(null);

  // Carrega clientes offline
  useEffect(() => {
    if (activeTab === 'OFFLINE') {
      setLoadingOffline(true);
      const url = `${BASE_URL}/api/admin/offline-clients${adminId ? `?coachId=${adminId}` : ''}`;
      fetch(url)
        .then(r => r.json())
        .then(data => setOfflineClients(Array.isArray(data) ? data : []))
        .catch(() => {})
        .finally(() => setLoadingOffline(false));
    }
  }, [activeTab, adminId]);

  // ← v2: carrega coaches quando aba COACHES é selecionada
  useEffect(() => {
    if (activeTab === 'COACHES' && isMaster) {
      setLoadingCoaches(true);
      fetch(`${BASE_URL}/api/admin/coaches?t=${Date.now()}`)
        .then(r => r.json())
        .then(data => setCoaches(Array.isArray(data) ? data : []))
        .catch(() => {})
        .finally(() => setLoadingCoaches(false));
    }
  }, [activeTab, isMaster]);

  // Filtra alunos
  const filtered = useMemo(() => {
    let list = alunos;
    if (coachFilter && getLogCoach) list = list.filter(a => getLogCoach(a) === coachFilter);
    if (search) list = list.filter(a => (a.name || '').toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [alunos, coachFilter, getLogCoach, search]);

  const today = new Date(); today.setHours(0, 0, 0, 0);

  const ativos   = filtered.filter(a => a.isFinanceActive && Number(a.contractValue) > 0);
  const vencendo = ativos.filter(a => { const d = daysUntilDue(a.paymentDueDate); return d !== null && d >= 0 && d <= 7; });
  const inativos = filtered.filter(a => !a.isFinanceActive || !Number(a.contractValue));

  const totalMRR       = ativos.reduce((s, a)   => s + Number(a.contractValue || 0), 0);
  const totalVencendo  = vencendo.reduce((s, a) => s + Number(a.contractValue || 0), 0);
  const totalInadimpl  = ativos.filter(a => { const d = daysUntilDue(a.paymentDueDate); return d !== null && d < 0; });

  // Abas
  const TABS = [
    { id:'ATIVOS',   label:`Ativos (${ativos.length})`    },
    { id:'VENCENDO', label:`Vencendo (${vencendo.length})` },
    { id:'INATIVOS', label:`Inativos (${inativos.length})` },
    { id:'OFFLINE',  label:'Offline'                       },
    ...(isMaster ? [{ id:'COACHES', label:'Coaches' }] : []),
  ];

  const listForTab = activeTab === 'ATIVOS'   ? ativos
                   : activeTab === 'VENCENDO' ? vencendo
                   : activeTab === 'INATIVOS' ? inativos
                   : [];

  const openFinanceEdit = (user) => { setEditingUser(user); setFinanceModalOpen(true); };

  const handleUserSaved = (updatedUser) => {
    // Atualiza a lista local (o refresh completo virá no próximo fetchData)
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>

      {/* Métricas */}
      <View style={[styles.metricsRow, { borderBottomColor: theme.border }]}>
        <View style={[styles.metricCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={{ color: theme.textSecondary, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 }}>MRR</Text>
          <Text style={{ color: theme.accent, fontWeight: '900', fontSize: 20, marginTop: 4 }}>{fmt(totalMRR)}</Text>
        </View>
        <View style={[styles.metricCard, { backgroundColor: theme.surface, borderColor: '#FF950040' }]}>
          <Text style={{ color: '#FF9500', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 }}>VENCENDO</Text>
          <Text style={{ color: '#FF9500', fontWeight: '900', fontSize: 20, marginTop: 4 }}>{fmt(totalVencendo)}</Text>
          <Text style={{ color: theme.textSecondary, fontSize: 10 }}>{vencendo.length} alunos</Text>
        </View>
        <View style={[styles.metricCard, { backgroundColor: theme.surface, borderColor: '#FF3B3040' }]}>
          <Text style={{ color: '#FF3B30', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 }}>INADIMPL.</Text>
          <Text style={{ color: '#FF3B30', fontWeight: '900', fontSize: 20, marginTop: 4 }}>{totalInadimpl.length}</Text>
          <Text style={{ color: theme.textSecondary, fontSize: 10 }}>alunos</Text>
        </View>
      </View>

      {/* Busca */}
      {activeTab !== 'COACHES' && (
        <View style={[styles.searchRow, { borderBottomColor: theme.border }]}>
          <View style={[styles.searchBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <MaterialCommunityIcons name="magnify" size={16} color={theme.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Buscar aluno..."
              placeholderTextColor={theme.textSecondary}
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <MaterialCommunityIcons name="close-circle" size={16} color={theme.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Abas */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={[styles.tabsScroll, { borderBottomColor: theme.border }]}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingVertical: 10 }}
      >
        {TABS.map(tab => {
          const isActive    = activeTab === tab.id;
          const isCoachTab  = tab.id === 'COACHES';
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, {
                backgroundColor: isActive ? theme.accent : theme.surface,
                borderColor:     isActive ? theme.accent : (isCoachTab ? theme.accent + '50' : theme.border),
                borderWidth:     isCoachTab ? 1.5 : 1,
              }]}
              onPress={() => setActiveTab(tab.id)}
            >
              {isCoachTab && <MaterialCommunityIcons name="account-tie" size={12} color={isActive ? '#000' : theme.accent} />}
              <Text style={{ color: isActive ? '#000' : (isCoachTab ? theme.accent : theme.text), fontWeight: '800', fontSize: 11 }}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Conteúdo */}
      <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 8 }}>

        {/* ABA COACHES ← v2 */}
        {activeTab === 'COACHES' && isMaster && (
          <CoachesFinanceTab coaches={coaches} loading={loadingCoaches} theme={theme} onBilling={(c) => setBillingCoach(c)} />
        )}

        {/* ABA OFFLINE */}
        {activeTab === 'OFFLINE' && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
            <TouchableOpacity
              style={[styles.addOfflineBtn, { backgroundColor: theme.accent + '18', borderColor: theme.accent + '40' }]}
              onPress={() => { setEditingOffline(null); setOfflineModalOpen(true); }}
            >
              <MaterialCommunityIcons name="plus-circle-outline" size={18} color={theme.accent} />
              <Text style={{ color: theme.accent, fontWeight: '900', fontSize: 13 }}>ADICIONAR CLIENTE OFFLINE</Text>
            </TouchableOpacity>
            {loadingOffline ? (
              <ActivityIndicator color={theme.accent} style={{ marginTop: 20 }} />
            ) : offlineClients.length === 0 ? (
              <View style={{ alignItems: 'center', padding: 48 }}>
                <MaterialCommunityIcons name="account-off-outline" size={48} color={theme.textSecondary} />
                <Text style={{ color: theme.textSecondary, marginTop: 16, fontSize: 14, textAlign: 'center' }}>
                  Nenhum cliente offline ainda.{'\n'}Adicione alunos que pagam fora do app.
                </Text>
              </View>
            ) : (
              offlineClients.map(client => (
                <OfflineClientCard
                  key={client.id}
                  client={client}
                  theme={theme}
                  onPress={() => { setEditingOffline(client); setOfflineModalOpen(true); }}
                />
              ))
            )}
          </ScrollView>
        )}

        {/* ABAS DE ALUNOS */}
        {activeTab !== 'COACHES' && activeTab !== 'OFFLINE' && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
            {listForTab.length === 0 ? (
              <View style={{ alignItems: 'center', padding: 48 }}>
                <MaterialCommunityIcons name="cash-remove" size={48} color={theme.textSecondary} />
                <Text style={{ color: theme.textSecondary, marginTop: 16, fontSize: 14, textAlign: 'center' }}>
                  {activeTab === 'ATIVOS'   ? 'Nenhum aluno ativo no financeiro.' : ''}
                  {activeTab === 'VENCENDO' ? 'Nenhum vencimento nos próximos 7 dias.' : ''}
                  {activeTab === 'INATIVOS' ? 'Nenhum aluno inativo.' : ''}
                </Text>
              </View>
            ) : listForTab.map(user => {
              const days  = daysUntilDue(user.paymentDueDate);
              const color = getStatusColor(days, user.isFinanceActive);
              const label = getStatusLabel(days, user.isFinanceActive);
              return (
                <TouchableOpacity
                  key={user.id}
                  style={[styles.userCard, { backgroundColor: theme.surface, borderColor: color + '40' }]}
                  onPress={() => openFinanceEdit(user)}
                  activeOpacity={0.75}
                >
                  <View style={{ flex: 1 }}>
                    <View style={styles.row}>
                      <Text style={{ color: theme.text, fontWeight: '900', fontSize: 14, flex: 1 }} numberOfLines={1}>
                        {user.name}
                      </Text>
                      <View style={[styles.statusPill, { backgroundColor: color + '20', borderColor: color + '50' }]}>
                        <Text style={{ fontSize: 9, fontWeight: '900', color }}>{label}</Text>
                      </View>
                    </View>
                    <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 2 }}>
                      {user.financeCategory || 'Consultoria'} · {user.contractType || '—'}
                    </Text>
                    {user.paymentDueDate && (
                      <Text style={{ color, fontSize: 11, marginTop: 2, fontWeight: days !== null && days <= 7 ? '900' : '400' }}>
                        Venc. {toBRDate(user.paymentDueDate)}
                      </Text>
                    )}
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 6 }}>
                    <Text style={{ color: theme.accent, fontWeight: '900', fontSize: 18 }}>
                      {fmt(user.contractValue)}
                    </Text>
                    <MaterialCommunityIcons name="pencil-outline" size={14} color={theme.textSecondary} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* Modais */}
      <FinanceEditModal
        visible={financeModalOpen}
        user={editingUser}
        onClose={() => setFinanceModalOpen(false)}
        onSaved={handleUserSaved}
        theme={theme}
      />
      <OfflineClientModal
        visible={offlineModalOpen}
        client={editingOffline}
        onClose={() => setOfflineModalOpen(false)}
        onSaved={(saved) => {
          setOfflineClients(prev => {
            const idx = prev.findIndex(c => c.id === saved.id);
            if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next; }
            return [...prev, saved];
          });
        }}
        onDeleted={(id) => setOfflineClients(prev => prev.filter(c => c.id !== id))}
        theme={theme}
      />

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
  container:     { flex: 1 },
  metricsRow:    { flexDirection: 'row', gap: 10, padding: 16, borderBottomWidth: 1 },
  metricCard:    { flex: 1, borderRadius: 14, borderWidth: 1, padding: 12 },
  searchRow:     { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  searchBox:     { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 12, borderWidth: 1 },
  searchInput:   { flex: 1, fontSize: 13, outlineStyle: 'none' },
  tabsScroll:    { flexGrow: 0, borderBottomWidth: 1 },
  tab:           { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  userCard:      { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 10 },
  statusPill:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  offlineBadge:  { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  addOfflineBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', marginBottom: 14 },
  row:           { flexDirection: 'row', gap: 8 },
  // Modais
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end', alignItems: 'center' },
  modalBox:      { width: '100%', maxWidth: 480, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderBottomWidth: 0, maxHeight: '90%', overflow: 'hidden' },
  modalHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderBottomWidth: 1 },
  fieldLabel:    { fontSize: 10, fontWeight: '800', letterSpacing: 0.5, marginBottom: 6 },
  fieldInput:    { borderWidth: 1, borderRadius: 12, padding: 13, fontSize: 14 },
  chip:          { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  renewBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, borderRadius: 12, borderWidth: 1 },
  saveBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 14 },
  // Coaches
  summaryRow:    { flexDirection: 'row', gap: 8, marginBottom: 16 },
  summaryCard:   { flex: 1, alignItems: 'center', padding: 12, borderRadius: 14, borderWidth: 1 },
  coachCard:     { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 10 },
  coachAvatar:   { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  coachActionBtn:{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, borderWidth: 1 },
});
