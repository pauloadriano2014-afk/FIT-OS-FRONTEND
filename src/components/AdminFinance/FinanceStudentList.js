// src/components/AdminFinance/FinanceStudentList.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getDueDateStatus, formatCurrency } from '../../utils/financeUtils';

export default function FinanceStudentList({ theme, isWebPC, studentList, loadingId, openEditModal, handleTogglePagamento, openWhatsApp }) {
    return (
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
                                <View style={[styles.avatar, { overflow: 'hidden' }]}><img src={aluno.photoUrl} onError={(e) => { e.target.onerror = null; e.target.src = ''; }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Avatar" /></View>
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
                                <Image source={{ uri: aluno.photoUrl }} onError={(e) => { e.target.onerror = null; e.target.src = ''; }} style={styles.mobileAvatar} />
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
    );
}

const styles = StyleSheet.create({
    listContainer: { borderRadius: 16, borderWidth: 1, padding: 10, marginBottom: 50 },
    listHeader: { flexDirection: 'row', padding: 15, borderBottomWidth: 1 },
    listHeaderTitle: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
    listItem: { padding: 15, borderBottomWidth: 1, gap: 0 },
    dueDateBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, marginTop: 8, alignSelf: 'flex-start', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
    mobileCard: { borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1, elevation: 3, shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.1, shadowRadius: 6 },
    mobileCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    mobileAvatar: { width: 48, height: 48, borderRadius: 24 },
    mobileAvatarPlaceholder: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
    mobileCardInfo: { flex: 1, marginLeft: 15 },
    mobileStudentName: { fontSize: 16, fontWeight: '900', textTransform: 'uppercase' },
    mobileStudentCategory: { color: '#888', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', marginTop: 2 },
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
});