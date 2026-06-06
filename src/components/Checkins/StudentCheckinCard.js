import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// ✅ ATUALIZADO: recebe `checkinId` e `field` para passar ao openPhoto
const ThumbnailImage = ({ originalUri, checkinId, field, onPress, theme }) => {
    const thumbUri = originalUri && originalUri.includes('.jpg') 
        ? originalUri.replace('.jpg', '-thumb.jpg') 
        : originalUri;

    const [imageUri, setImageUri] = useState(thumbUri);

    // ✅ NOVO: quando a URI original mudar (ex: depois de salvar uma edição),
    //    atualiza a imagem exibida automaticamente sem recarregar a tela
    useEffect(() => {
        setImageUri(thumbUri);
    }, [originalUri]);

    return (
        <TouchableOpacity
            // ✅ ATUALIZADO: passa checkinId e field para o editor saber qual foto atualizar
            onPress={() => onPress(originalUri, checkinId, field)}
            style={{ width: '100%', alignItems: 'center' }}
        >
            <Image 
                source={{ uri: imageUri }} 
                style={[styles.photo, { borderColor: theme.border }]} 
                onError={() => {
                    if (imageUri !== originalUri) setImageUri(originalUri);
                }}
            />
        </TouchableOpacity>
    );
};

export default function StudentCheckinCard({ item, isOldest, isEvaluated, theme, hookData }) {
    const { 
        safeDate, handleDelete, openEvaluationPanel, 
        handleResolveSilently, isResolving, openPhoto 
    } = hookData;

    const itemDate = safeDate(item.date || item.createdAt);

    return (
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: isEvaluated ? theme.border : '#FF3B30', borderWidth: isEvaluated ? 1 : 2 }]}>
            
            <View style={styles.cardHeader}>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                    <MaterialCommunityIcons name="calendar-check" size={16} color={theme.accent} />
                    <Text style={[styles.dateText, { color: theme.text }]}>
                        {itemDate.toLocaleDateString('pt-BR')} às {itemDate.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                    </Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(item.id)} style={{padding: 5}}>
                    <MaterialCommunityIcons name="trash-can-outline" size={20} color="#FF3B30" />
                </TouchableOpacity>
            </View>

            <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15, flexWrap: 'wrap', gap: 10}}>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap'}}>
                    <View style={[styles.badge, { backgroundColor: isOldest ? '#FF950022' : theme.accent + '22', borderColor: isOldest ? '#FF9500' : theme.accent }]}>
                        <Text style={[styles.badgeText, { color: isOldest ? '#FF9500' : theme.accent }]}>
                            {isOldest ? 'PONTO DE PARTIDA' : 'CHECK-IN'}
                        </Text>
                    </View>
                    
                    {isEvaluated ? (
                        <View style={[styles.badge, { backgroundColor: '#34C75922', borderColor: '#34C759' }]}>
                            <MaterialCommunityIcons name="check" size={10} color="#34C759" style={{marginRight: 2}} />
                            <Text style={[styles.badgeText, { color: '#34C759' }]}>AVALIADO</Text>
                        </View>
                    ) : (
                        <View style={[styles.badge, { backgroundColor: '#FF3B3022', borderColor: '#FF3B30' }]}>
                            <MaterialCommunityIcons name="alert-circle" size={10} color="#FF3B30" style={{marginRight: 2}} />
                            <Text style={[styles.badgeText, { color: '#FF3B30' }]}>AGUARDANDO AVALIAÇÃO</Text>
                        </View>
                    )}
                </View>

                {item.allowMarketing && (
                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
                        <MaterialCommunityIcons name="instagram" size={14} color="#BF5AF2" />
                        <Text style={{fontSize: 9, fontWeight: 'bold', color: '#BF5AF2'}}>AUTORIZADO</Text>
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
                {/* ✅ ATUALIZADO: passa checkinId e field corretos para cada foto */}
                {item.photoFront ? (
                    <View style={styles.photoThumb}>
                        <ThumbnailImage
                            originalUri={item.photoFront}
                            checkinId={item.id}
                            field="photoFront"
                            onPress={openPhoto}
                            theme={theme}
                        />
                        <Text style={[styles.photoLabel, { color: theme.textSecondary }]}>FRENTE</Text>
                    </View>
                ) : null}
                
                {item.photoSide ? (
                    <View style={styles.photoThumb}>
                        <ThumbnailImage
                            originalUri={item.photoSide}
                            checkinId={item.id}
                            field="photoSide"
                            onPress={openPhoto}
                            theme={theme}
                        />
                        <Text style={[styles.photoLabel, { color: theme.textSecondary }]}>LADO</Text>
                    </View>
                ) : null}
                
                {item.photoBack ? (
                    <View style={styles.photoThumb}>
                        <ThumbnailImage
                            originalUri={item.photoBack}
                            checkinId={item.id}
                            field="photoBack"
                            onPress={openPhoto}
                            theme={theme}
                        />
                        <Text style={[styles.photoLabel, { color: theme.textSecondary }]}>COSTA</Text>
                    </View>
                ) : null}
            </View>

            <View style={{marginTop: 15}}>
                <TouchableOpacity 
                    style={[styles.aiButton, { backgroundColor: isEvaluated ? theme.surface : theme.accent, borderColor: isEvaluated ? theme.border : theme.accent, width: '100%' }]} 
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
  card: { padding: 20, borderRadius: 16, marginBottom: 15, borderWidth: 1, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(128,128,128,0.2)', paddingBottom: 10 },
  dateText: { fontWeight: 'bold', fontSize: 13 },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  badgeText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  dataRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  dataLabel: { fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
  dataValue: { fontSize: 16, fontWeight: '900' },
  photoGrid: { flexDirection: 'row', gap: 10 },
  photoThumb: { flex: 1, alignItems: 'center' },
  photo: { width: '100%', aspectRatio: 9/16, borderRadius: 12, borderWidth: 1, backgroundColor: '#000' },
  photoLabel: { fontSize: 9, fontWeight: 'bold', marginTop: 8 },
  aiButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, borderWidth: 1, gap: 8 },
  aiButtonText: { fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  silentResolveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, gap: 8, marginTop: 10 },
  silentResolveText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
});