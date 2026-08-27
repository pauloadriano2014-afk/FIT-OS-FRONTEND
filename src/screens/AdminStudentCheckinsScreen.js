// src/screens/AdminStudentCheckinsScreen.js — v3
// v3: isMaster passado pro EvaluationModal, sem outros deps novos, com Blindagem Tripla

import React from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, ScrollView,
    TouchableOpacity, ActivityIndicator, Platform, StatusBar, Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage'; // 🔥 Adicionado para o cache check
import { useTheme } from '../contexts/ThemeContext';
import { useAdminCheckins } from '../hooks/useAdminCheckins';
import StudentCheckinCard from '../components/Checkins/StudentCheckinCard';
import EvaluationModal from '../components/Checkins/EvaluationModal';
import PhotoEditorModal from '../components/Checkins/PhotoEditorModal';
import { MASTER_IDS } from '../constants/masterIds';
import { authHeaders } from '../utils/authToken';

async function uploadEditedPhoto({ mode, checkinId, photoField, imageBase64, compareCheckinId }) {
    const res = await fetch('https://fitos-final.onrender.com/api/checkin/update-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify({ mode, checkinId, photoField, imageBase64, compareCheckinId }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Falha ao salvar.');
    return data;
}

export default function AdminStudentCheckinsScreen({ route, navigation }) {
    const { theme } = useTheme();

    const rawId        = route.params?.alunoId   || route.params?.aluno?.id   || '';
    const rawName      = route.params?.alunoName  || route.params?.aluno?.name || 'ALUNO';
    const alunoCoachId = route.params?.aluno?.coachId;
    const aluno        = { id: rawId, name: rawName, coachId: alunoCoachId };

    const hookData = useAdminCheckins(aluno);
    
    // Substituímos o hook original hasPermission para fazermos o override blindado aqui mesmo
    const {
        loading: hookLoading, checkins, visibleCount, setVisibleCount,
        modalVisible, setModalVisible, selectedPhoto,
        selectedCheckinId, selectedPhotoField,
        fetchCheckins, updateCheckinPhoto, updateCheckinFeedback,
        isMaster,   // ← v3
    } = hookData;

    const [hasPermission, setHasPermission] = React.useState(false);
    const [loadingAuth, setLoadingAuth] = React.useState(true);

    const loading = hookLoading || loadingAuth;

    React.useEffect(() => {
        checkPermissionAndFetch();
    }, [aluno.id]);

    const checkPermissionAndFetch = async () => {
        try {
            setLoadingAuth(true);
            const userJson = await AsyncStorage.getItem('user');
            if (userJson) {
                const userObj = JSON.parse(userJson);
                const adminId = userObj.id;
                const adminEmail = userObj.email?.toLowerCase() || '';
                const adminRole = userObj.role?.toUpperCase() || '';
                
                // 🔥 OS DEUSES DO OLIMPO: PAULO E ADRI
                let realCoachId = aluno.coachId;
                const cachedData = await AsyncStorage.getItem('@dashboard_cache');
                if (cachedData) {
                    const { cacheAtivos, cacheInativos } = JSON.parse(cachedData);
                    const allUsers = [...(cacheAtivos || []), ...(cacheInativos || [])];
                    const foundUser = allUsers.find(u => u.id === aluno.id);
                    if (foundUser && foundUser.coachId) {
                        realCoachId = foundUser.coachId;
                    }
                }

                // 🔥 BLINDAGEM TRIPLA: Se for Admin por Role, por Email ou por ID, o acesso é garantido!
                let isMyStudent = false;
                if (
                    adminRole === 'ADMIN' ||
                    MASTER_IDS.includes(adminId) ||
                    adminEmail === 'adri.personal@hotmail.com'
                ) {
                    isMyStudent = true;
                } else {
                    isMyStudent = (realCoachId === adminId);
                }

                setHasPermission(isMyStudent);

                if (isMyStudent && aluno.id) {
                    await fetchCheckins();
                }
            }
        } catch (e) {
            console.log("Erro ao checar auth:", e);
        } finally {
            setLoadingAuth(false);
        }
    };


    const isWeb      = Platform.OS === 'web';
    const webOuterBg = theme.isDark ? '#0a0a0a' : '#E5E5EA';
    const RootComponent = isWeb ? View : SafeAreaView;

    const handleGoBack = () => {
        if (navigation.canGoBack()) navigation.goBack();
        else navigation.navigate('AdminDashboard');
    };

    const handlePhotoSave = async ({ mode, uri, compareCheckinId: cmpId }) => {
        setModalVisible(false);
        if (!selectedCheckinId) {
            const msg = 'Não foi possível identificar o check-in.';
            Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Erro', msg);
            return;
        }
        try {
            const result = await uploadEditedPhoto({
                mode:             mode ?? 'single',
                checkinId:        selectedCheckinId,
                photoField:       selectedPhotoField,
                imageBase64:      uri,
                compareCheckinId: cmpId ?? null,
            });
            if (mode === 'single') {
                updateCheckinPhoto(selectedCheckinId, selectedPhotoField, result.newUrl);
            } else {
                updateCheckinFeedback(selectedCheckinId, result.updatedFeedback);
            }
            const msg = mode === 'compare'
                ? 'Comparação salva! O aluno poderá ver no relatório.'
                : 'Marcação salva com sucesso!';
            Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Sucesso', msg);
        } catch (err) {
            const msg = `Erro ao salvar: ${err.message}`;
            Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Erro', msg);
        }
    };

    return (
        <RootComponent style={[
            styles.container,
            {
                backgroundColor: isWeb ? webOuterBg : theme.bg,
                ...(isWeb ? { height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' } : {})
            }
        ]}>
            <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} />

            <View style={{
                flex: 1, minHeight: 0, width: '100%',
                maxWidth: isWeb ? 960 : '100%', alignSelf: 'center',
                backgroundColor: theme.bg, overflow: 'hidden',
                ...(isWeb ? { display: 'flex', flexDirection: 'column', borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border } : {})
            }}>
                {/* ── Header ── */}
                <View style={[styles.header, { borderBottomColor: theme.border }]}>
                    <TouchableOpacity
                        onPress={handleGoBack}
                        style={{ padding: 8, backgroundColor: theme.surface, borderRadius: 8, borderWidth: 1, borderColor: theme.border, flexShrink: 0 }}
                    >
                        <MaterialCommunityIcons name="arrow-left" size={24} color={theme.text} />
                    </TouchableOpacity>
                    <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 15 }}>
                        <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>CHECK-INS DE</Text>
                        <Text style={{ color: theme.accent, fontSize: 12, fontWeight: 'bold' }} numberOfLines={1}>
                            {aluno.name.toUpperCase()}
                        </Text>
                    </View>
                    <TouchableOpacity onPress={checkPermissionAndFetch} style={{ padding: 8, flexShrink: 0 }}>
                        <MaterialCommunityIcons name="refresh" size={24} color={theme.accent} />
                    </TouchableOpacity>
                </View>

                {/* ── Lista ── */}
                <View style={{ flex: 1, position: 'relative' }}>
                    <ScrollView
                        style={isWeb
                            ? { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflowY: 'auto' }
                            : { flex: 1 }
                        }
                        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
                    >
                        {loading ? (
                            <ActivityIndicator color={theme.accent} size="large" style={{ marginTop: 50 }} />

                        ) : !hasPermission ? (
                            <View style={{ marginTop: 80, alignItems: 'center', paddingHorizontal: 30 }}>
                                <MaterialCommunityIcons name="shield-lock" size={80} color={theme.border} />
                                <Text style={{ color: theme.text, fontSize: 18, fontWeight: '900', marginTop: 20, textAlign: 'center' }}>
                                    ACESSO RESTRITO
                                </Text>
                                <Text style={{ color: theme.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 10, lineHeight: 22 }}>
                                    Por questões de privacidade, este check-in só pode ser visualizado pelo Coach responsável.
                                </Text>
                            </View>

                        ) : checkins.length === 0 ? (
                            <View style={[styles.emptyBox, { borderColor: theme.border }]}>
                                <MaterialCommunityIcons name="camera-off" size={48} color={theme.textSecondary} />
                                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                                    Este aluno ainda não enviou nenhum check-in.
                                </Text>
                            </View>

                        ) : (
                            <>
                                {checkins.slice(0, visibleCount).map((item) => {
                                    const globalIndex = checkins.findIndex(c => c.id === item.id);
                                    return (
                                        <StudentCheckinCard
                                            key={item.id}
                                            item={item}
                                            isOldest={globalIndex === checkins.length - 1}
                                            isEvaluated={!!item.coachFeedback}
                                            theme={theme}
                                            hookData={hookData}
                                        />
                                    );
                                })}

                                {visibleCount < checkins.length && (
                                    <TouchableOpacity
                                        style={[styles.loadMoreBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                                        onPress={() => setVisibleCount(prev => prev + 3)}
                                    >
                                        <MaterialCommunityIcons name="history" size={20} color={theme.text} />
                                        <Text style={[styles.loadMoreText, { color: theme.text }]}>Carregar Mais Antigos</Text>
                                    </TouchableOpacity>
                                )}
                            </>
                        )}
                    </ScrollView>
                </View>
            </View>

            {/* ── Modais ── */}
            <EvaluationModal theme={theme} hookData={hookData} />

            <PhotoEditorModal
                visible={modalVisible}
                photoUri={selectedPhoto}
                theme={theme}
                onClose={() => setModalVisible(false)}
                onSave={handlePhotoSave}
                checkins={checkins}
                selectedCheckinId={selectedCheckinId}
                selectedPhotoField={selectedPhotoField}
            />
        </RootComponent>
    );
}

const styles = StyleSheet.create({
    container:    { flex: 1, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 0 },
    header:       { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 20, paddingTop: Platform.OS === 'android' ? 10 : 20, alignItems: 'center', borderBottomWidth: 1, flexShrink: 0 },
    headerTitle:  { fontWeight: '900', fontSize: 14, letterSpacing: 1 },
    emptyBox:     { alignItems: 'center', padding: 40, borderStyle: 'dashed', borderWidth: 1, borderRadius: 16, marginVertical: 20 },
    emptyText:    { textAlign: 'center', marginTop: 15, fontWeight: 'bold', lineHeight: 22 },
    loadMoreBtn:  { flexDirection: 'row', padding: 15, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 10, marginBottom: 20 },
    loadMoreText: { fontWeight: 'bold', fontSize: 13 },
});