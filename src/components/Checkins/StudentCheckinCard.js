import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image, Platform, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// ── Thumbnail com badge "editada" e botão restaurar ───────────────────────────
const ThumbnailImage = ({ uri, originalUri, checkinId, field, onPress, onRestore, theme, isRestoring }) => {
    const thumbUri = uri && uri.includes('.jpg') ? uri.replace('.jpg', '-thumb.jpg') : uri;
    const [imageUri, setImageUri] = useState(thumbUri);
    const hasEdits = !!originalUri; // tem original salvo = foto foi editada

    useEffect(() => { setImageUri(thumbUri); }, [uri]);

    return (
        <View style={{ width: '100%', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => onPress(uri, checkinId, field)} style={{ width: '100%' }}>
                <Image
                    source={{ uri: imageUri }}
                    style={[styles.photo, { borderColor: hasEdits ? theme.accent : theme.border }]}
                    onError={() => { if (imageUri !== uri) setImageUri(uri); }}
                />
                {/* Badge verde quando foto tem marcações */}
                {hasEdits && (
                    <View style={[styles.editBadge, { backgroundColor: theme.accent }]}>
                        <MaterialCommunityIcons name="pencil" size={10} color="#000" />
                    </View>
                )}
            </TouchableOpacity>

            {/* Botão restaurar — só aparece se houver foto original */}
            {hasEdits && (
                <TouchableOpacity
                    onPress={() => onRestore(checkinId, field)}
                    disabled={isRestoring}
                    style={[styles.restoreBtn, { borderColor: '#FF9500' }]}
                >
                    {isRestoring ? (
                        <ActivityIndicator size={10} color="#FF9500" />
                    ) : (
                        <>
                            <MaterialCommunityIcons name="restore" size={11} color="#FF9500" />
                            <Text style={{ color: '#FF9500', fontSize: 9, fontWeight: '900' }}>RESTAURAR</Text>
                        </>
                    )}
                </TouchableOpacity>
            )}
        </View>
    );
};

export default function StudentCheckinCard({ item, isOldest, isEvaluated, theme, hookData }) {
    const {
        safeDate, handleDelete, openEvaluationPanel,
        handleResolveSilently, isResolving, openPhoto,
        restoreCheckinPhoto,
    } = hookData;

    const [restoringField, setRestoringField] = useState(null);
    const itemDate = safeDate(item.date || item.createdAt);

    const handleRestore = async (checkinId, field) => {
        const confirm = () => {
            setRestoringField(field);
            restoreCheckinPhoto(checkinId, field).finally(() => setRestoringField(null));
        };
        if (Platform.OS === 'web') {
            if (window.confirm('Remover as marcações e restaurar a foto original?')) confirm();
        } else {
            Alert.alert('Restaurar foto', 'Remover as marcações e restaurar a foto original?', [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Restaurar', onPress: confirm },
            ]);
        }
    };

    const photos = [
        { field: 'photoFront', uri: item.photoFront, originalUri: item.photoFrontOriginal, label: 'FRENTE' },
        { field: 'photoSide',  uri: item.photoSide,  originalUri: item.photoSideOriginal,  label: 'LADO'   },
        { field: 'photoBack',  uri: item.photoBack,  originalUri: item.photoBackOriginal,  label: 'COSTA'  },
    ];

    return (
        <View style={[styles.card, {
            backgroundColor: theme.surface,
            borderColor: isEvaluated ? theme.border : '#FF3B30',
            borderWidth: isEvaluated ? 1 : 2,
        }]}>
            <View style={styles.cardHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <MaterialCommunityIcons name="calendar-check" size={16} color={theme.accent} />
                    <Text style={[styles.dateText, { color: theme.text }]}>
                        {itemDate.toLocaleDateString('pt-BR')} às {itemDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ padding: 5 }}>
                    <MaterialCommunityIcons name="trash-can-outline" size={20} color="#FF3B30" />
                </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15, flexWrap: 'wrap', gap: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <View style={[styles.badge, { backgroundColor: isOldest ? '#FF950022' : theme.accent + '22', borderColor: isOldest ? '#FF9500' : theme.accent }]}>
                        <Text style={[styles.badgeText, { color: isOldest ? '#FF9500' : theme.accent }]}>
                            {isOldest ? 'PONTO DE PARTIDA' : 'CHECK-IN'}
                        </Text>
                    </View>
                    {isEvaluated ? (
                        <View style={[styles.badge, { backgroundColor: '#34C75922', borderColor: '#34C759' }]}>
                            <MaterialCommunityIcons name="check" size={10} color="#34C759" style={{ marginRight: 2 }} />
                            <Text style={[styles.badgeText, { color: '#34C759' }]}>AVALIADO</Text>
                        </View>
                    ) : (
                        <View style={[styles.badge, { backgroundColor: '#FF3B3022', borderColor: '#FF3B30' }]}>
                            <MaterialCommunityIcons name="alert-circle" size={10} color="#FF3B30" style={{ marginRight: 2 }} />
                            <Text style={[styles.badgeText, { color: '#FF3B30' }]}>AGUARDANDO AVALIAÇÃO</Text>
                        </View>
                    )}
                </View>
                {item.allowMarketing && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <MaterialCommunityIcons name="instagram" size={14} color="#BF5AF2" />
                        <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#BF5AF2' }}>AUTORIZADO</Text>
                    </View>
                )}
            </View>

            {item.weight ? (
                <View style={styles.dataRow}>
                    <Text style={[styles.dataLabel, { color: theme.textSecondary }]}>Peso Relatado:</Text>
                    <Text style={[styles.dataValue, { color: theme.text }]}>{item.weight} kg</Text>
                </View>
            ) : null}

            <Text style={[styles.dataLabel, { color: theme.textSecondary, marginTop: 10, marginBottom: 10 }]}>Fotos Base:</Text>

            <View style={styles.photoGrid}>
                {photos.map(p => p.uri ? (
                    <View key={p.field} style={styles.photoThumb}>
                        <ThumbnailImage
                            uri={p.uri}
                            originalUri={p.originalUri}
                            checkinId={item.id}
                            field={p.field}
                            onPress={openPhoto}
                            onRestore={handleRestore}
                            isRestoring={restoringField === p.field}
                            theme={theme}
                        />
                        <Text style={[styles.photoLabel, { color: theme.textSecondary }]}>{p.label}</Text>
                    </View>
                ) : null)}
            </View>

            <View style={{ marginTop: 15 }}>
                <TouchableOpacity
                    style={[styles.aiButton, {
                        backgroundColor: isEvaluated ? theme.surface : theme.accent,
                        borderColor: isEvaluated ? theme.border : theme.accent,
                        width: '100%',
                    }]}
                    onPress={() => openEvaluationPanel(item, isOldest ? 'initial' : 'comparison')}
                >
                    <MaterialCommunityIcons name={isEvaluated ? "pencil" : "robot-outline"} size={18} color={isEvaluated ? theme.text : (theme.isDark ? '#000' : '#FFF')} />
                    <Text style={[styles.aiButtonText, { color: isEvaluated ? theme.text : (theme.isDark ? '#000' : '#FFF') }]}>
                        {isEvaluated ? "EDITAR AVALIAÇÃO COM IA" : "AVALIAR COM LABORATÓRIO IA"}
                    </Text>
                </TouchableOpacity>

                {!isEvaluated && (
                    <TouchableOpacity
                        style={[styles.silentResolveBtn, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]}
                        onPress={() => handleResolveSilently(item.id)}
                        disabled={isResolving}
                    >
                        {isResolving ? <ActivityIndicator size="small" color={theme.text} /> : (
                            <>
                                <MaterialCommunityIcons name="check-all" size={18} color={theme.text} />
                                <Text style={[styles.silentResolveText, { color: theme.text }]}>MARCAR COMO AVALIADO (REMOVER ALERTA)</Text>
                            </>
                        )}
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card:             { padding: 20, borderRadius: 16, marginBottom: 15, borderWidth: 1, elevation: 2 },
    cardHeader:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(128,128,128,0.2)', paddingBottom: 10 },
    dateText:         { fontWeight: 'bold', fontSize: 13 },
    badge:            { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
    badgeText:        { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
    dataRow:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
    dataLabel:        { fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
    dataValue:        { fontSize: 16, fontWeight: '900' },
    photoGrid:        { flexDirection: 'row', gap: 10 },
    photoThumb:       { flex: 1, alignItems: 'center' },
    photo:            { width: '100%', aspectRatio: 9 / 16, borderRadius: 12, borderWidth: 1, backgroundColor: '#000' },
    photoLabel:       { fontSize: 9, fontWeight: 'bold', marginTop: 4 },
    editBadge:        { position: 'absolute', top: 6, right: 6, width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
    restoreBtn:       { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
    aiButton:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, borderWidth: 1, gap: 8 },
    aiButtonText:     { fontSize: 12, fontWeight: '900', letterSpacing: 1 },
    silentResolveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, gap: 8, marginTop: 10 },
    silentResolveText:{ fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
});