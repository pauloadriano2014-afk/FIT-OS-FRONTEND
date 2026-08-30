// src/components/AdminFinance/FinanceFiscalConfigModal.js
// 🧾 CONFIGURAÇÃO FISCAL (NFS-e via Asaas) -- mostra se a conta já tem os
// dados fiscais cadastrados na Asaas (prefeitura, inscrição municipal,
// certificado/usuário etc. -- isso em si se configura direto no painel da
// Asaas, varia demais por município pra ter um formulário genérico aqui) e
// deixa escolher o "serviço padrão" (descrição + serviço municipal +
// alíquota de ISS) usado em toda nota emitida pelo botão "Emitir Nota".
import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, Modal, TouchableOpacity, TextInput,
    ActivityIndicator, ScrollView, Platform, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getFiscalConfig, saveFiscalConfig, getMunicipalServices } from '../../utils/financeInvoiceUtils';

export default function FinanceFiscalConfigModal({ theme, isWebPC, visible, onClose }) {
    const isDark = theme === 'dark';
    const c = {
        bg: isDark ? '#1E1E1E' : '#F9F9F9',
        bg2: isDark ? '#2A2A2A' : '#FFF',
        text: isDark ? '#FFF' : '#333',
        sub: '#888',
        border: isDark ? '#444' : '#DDD',
        primary: '#8B5CF6',
        green: '#8BC34A',
        red: '#F44336',
    };

    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState(null); // { configured, fiscalInfo, defaultService, error }
    const [saving, setSaving] = useState(false);

    const [serviceDescription, setServiceDescription] = useState('');
    const [issRate, setIssRate] = useState('');
    const [selectedService, setSelectedService] = useState(null); // { id, code, name }

    const [search, setSearch] = useState('');
    const [searching, setSearching] = useState(false);
    const [results, setResults] = useState([]);

    const notify = (msg) => {
        if (Platform.OS === 'web') window.alert(msg);
        else require('react-native').Alert.alert('', msg);
    };

    const load = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getFiscalConfig();
            setStatus(data);
            if (data?.defaultService) {
                setServiceDescription(data.defaultService.serviceDescription || '');
                setIssRate(data.defaultService.issRate != null ? String(data.defaultService.issRate) : '');
                setSelectedService({
                    id: data.defaultService.municipalServiceId,
                    code: data.defaultService.municipalServiceCode,
                    name: data.defaultService.municipalServiceName,
                });
            }
        } catch (e) {
            setStatus({ configured: null, error: e.message });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { if (visible) load(); }, [visible, load]);

    const runSearch = async () => {
        try {
            setSearching(true);
            const services = await getMunicipalServices(search);
            setResults(services);
        } catch (e) {
            notify(e.message || 'Erro ao buscar serviços.');
        } finally {
            setSearching(false);
        }
    };

    const pickService = (svc) => {
        setSelectedService({ id: svc.id, code: svc.code, name: svc.description || svc.name });
        setResults([]);
        setSearch('');
    };

    const handleSave = async () => {
        if (!serviceDescription.trim() || !selectedService?.name) {
            notify('Escolha um serviço municipal e preencha a descrição do serviço.');
            return;
        }
        try {
            setSaving(true);
            await saveFiscalConfig({
                municipalServiceId: selectedService.id,
                municipalServiceCode: selectedService.code,
                municipalServiceName: selectedService.name,
                serviceDescription: serviceDescription.trim(),
                issRate: issRate ? parseFloat(String(issRate).replace(',', '.')) : null,
            });
            notify('Configuração salva!');
        } catch (e) {
            notify(e.message || 'Erro ao salvar.');
        } finally {
            setSaving(false);
        }
    };

    const labelStyle = { fontSize: 12, fontWeight: 'bold', color: c.sub, marginBottom: 5, marginTop: 15, textTransform: 'uppercase' };
    const inputStyle = { backgroundColor: c.bg2, color: c.text, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: c.border, fontSize: 14, fontWeight: 'bold' };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
                <View style={{
                    width: isWebPC ? 480 : '92%',
                    maxHeight: '90%',
                    backgroundColor: c.bg,
                    borderRadius: 15,
                    padding: 20,
                }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: isDark ? '#333' : '#E0E0E0', paddingBottom: 10 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={{ backgroundColor: 'rgba(139,92,246,0.15)', padding: 8, borderRadius: 20, marginRight: 10 }}>
                                <Ionicons name="document-text-outline" size={20} color={c.primary} />
                            </View>
                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: c.text }}>Configuração Fiscal</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={{ padding: 5 }}>
                            <Ionicons name="close" size={24} color="#888" />
                        </TouchableOpacity>
                    </View>

                    {loading ? (
                        <ActivityIndicator color={c.primary} style={{ paddingVertical: 30 }} />
                    ) : (
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {/* STATUS */}
                            {status?.configured === true && (
                                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(139,195,74,0.12)', borderWidth: 1, borderColor: c.green, borderRadius: 10, padding: 12 }}>
                                    <Ionicons name="checkmark-circle" size={20} color={c.green} />
                                    <Text style={{ color: c.text, fontSize: 12.5, marginLeft: 8, flex: 1 }}>
                                        Dados fiscais configurados na Asaas{status.fiscalInfo?.municipalInscription ? ` — inscrição ${status.fiscalInfo.municipalInscription}` : ''}.
                                    </Text>
                                </View>
                            )}
                            {status?.configured === false && (
                                <View style={{ backgroundColor: 'rgba(255,149,0,0.12)', borderWidth: 1, borderColor: '#FF9500', borderRadius: 10, padding: 12 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Ionicons name="alert-circle" size={20} color="#FF9500" />
                                        <Text style={{ color: c.text, fontSize: 12.5, marginLeft: 8, flex: 1, fontWeight: 'bold' }}>
                                            Ainda não configurado na Asaas
                                        </Text>
                                    </View>
                                    <Text style={{ color: c.sub, fontSize: 11.5, marginTop: 6, lineHeight: 16 }}>
                                        Isso se cadastra direto no painel da Asaas (Configurações → Notas Fiscais) — inscrição municipal, CNAE, certificado ou usuário da prefeitura. Depois de configurar lá, feche e reabra essa tela pra confirmar.
                                    </Text>
                                    <TouchableOpacity onPress={() => Linking.openURL('https://www.asaas.com/')} style={{ marginTop: 8 }}>
                                        <Text style={{ color: c.primary, fontSize: 12, fontWeight: 'bold' }}>Abrir Asaas →</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                            {(status?.configured === null) && (
                                <View style={{ backgroundColor: 'rgba(244,67,54,0.1)', borderWidth: 1, borderColor: c.red, borderRadius: 10, padding: 12 }}>
                                    <Text style={{ color: c.text, fontSize: 12 }}>Não deu pra confirmar o status agora: {status?.error || 'erro desconhecido'}.</Text>
                                </View>
                            )}
                            <TouchableOpacity onPress={load} style={{ alignSelf: 'flex-end', marginTop: 6 }}>
                                <Text style={{ color: c.sub, fontSize: 11 }}>↻ verificar de novo</Text>
                            </TouchableOpacity>

                            {/* SERVIÇO PADRÃO */}
                            <Text style={{ fontSize: 13, fontWeight: '900', color: c.text, marginTop: 15 }}>Serviço padrão da nota</Text>
                            <Text style={{ fontSize: 11, color: c.sub, marginTop: 2 }}>
                                Usado toda vez que você clicar em "Emitir Nota" — evita preencher de novo a cada vez.
                            </Text>

                            <Text style={labelStyle}>Serviço Municipal</Text>
                            {selectedService?.name ? (
                                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: c.bg2, borderRadius: 8, borderWidth: 1, borderColor: c.primary, padding: 12 }}>
                                    <Text style={{ color: c.text, fontSize: 13, flex: 1 }} numberOfLines={2}>{selectedService.name}</Text>
                                    <TouchableOpacity onPress={() => setSelectedService(null)} style={{ padding: 4 }}>
                                        <Ionicons name="close-circle" size={18} color={c.sub} />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <>
                                    <View style={{ flexDirection: 'row', gap: 8 }}>
                                        <TextInput
                                            style={[inputStyle, { flex: 1 }]}
                                            value={search}
                                            onChangeText={setSearch}
                                            placeholder="Buscar (ex: consultoria, personal trainer)"
                                            placeholderTextColor={c.sub}
                                            onSubmitEditing={runSearch}
                                        />
                                        <TouchableOpacity onPress={runSearch} style={{ backgroundColor: c.primary, borderRadius: 8, paddingHorizontal: 16, justifyContent: 'center' }}>
                                            {searching ? <ActivityIndicator size="small" color="#FFF" /> : <Ionicons name="search" size={18} color="#FFF" />}
                                        </TouchableOpacity>
                                    </View>
                                    {results.length > 0 && (
                                        <View style={{ marginTop: 8, borderWidth: 1, borderColor: c.border, borderRadius: 8, overflow: 'hidden' }}>
                                            {results.slice(0, 8).map((svc, i) => (
                                                <TouchableOpacity
                                                    key={svc.id || i}
                                                    onPress={() => pickService(svc)}
                                                    style={{ padding: 10, borderTopWidth: i > 0 ? 1 : 0, borderTopColor: c.border, backgroundColor: c.bg2 }}
                                                >
                                                    <Text style={{ color: c.text, fontSize: 12 }} numberOfLines={2}>{svc.description || svc.name}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    )}
                                </>
                            )}

                            <Text style={labelStyle}>Descrição do Serviço (na nota)</Text>
                            <TextInput
                                style={[inputStyle, { fontWeight: 'normal' }]}
                                value={serviceDescription}
                                onChangeText={setServiceDescription}
                                placeholder="Ex: Consultoria em treinamento físico personalizado"
                                placeholderTextColor={c.sub}
                                multiline
                            />

                            <Text style={labelStyle}>Alíquota de ISS (%) — opcional</Text>
                            <TextInput
                                style={[inputStyle, { textAlign: 'center' }]}
                                value={issRate}
                                onChangeText={setIssRate}
                                keyboardType="numeric"
                                placeholder="Ex: 2"
                                placeholderTextColor={c.sub}
                            />

                            <TouchableOpacity
                                style={{ backgroundColor: c.primary, padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 20, marginBottom: 10 }}
                                onPress={handleSave}
                                disabled={saving}
                            >
                                {saving
                                    ? <ActivityIndicator color="#FFF" />
                                    : <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 15 }}>SALVAR CONFIGURAÇÃO</Text>
                                }
                            </TouchableOpacity>
                        </ScrollView>
                    )}
                </View>
            </View>
        </Modal>
    );
}
