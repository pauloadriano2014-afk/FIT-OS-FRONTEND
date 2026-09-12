// src/components/MontarTreino/Modals/TecnicaModal.js
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCoachTechGuide } from './coachTechGuideData';
import TechGuideModal from '../../Training/TechGuideModal';
import { authHeaders } from '../../../utils/authToken';

export default function TecnicaModal({
    visible, onClose, theme, isWeb,
    modalTitle, options,
    onSelectOption, getCurrentTechnique,
    listaTecnicas = [],
}) {
    const isCardio = modalTitle === 'Intensidade';

    // 🔥 NOVO: botão de informação em cada técnica, pra coach que não conhece
    // o método entender o que é e quando usar antes de aplicar no aluno.
    // Texto escrito pro COACH (não pro aluno) -- ver coachTechGuideData.js.
    const [guideTech, setGuideTech] = useState(null);

    // 🔥 Vídeos das técnicas avançadas: mesmo endpoint que o Paulo já usa em
    // AdminTechniquesScreen.js pra cadastrar um vídeo por técnica fixa do
    // sistema. Só aparece a aba de vídeo no guia se a técnica tiver um
    // vídeo cadastrado -- se não tiver, a aba simplesmente não existe (não
    // quebra nada, TechGuideModal já trata isso via hasVideo).
    const [videoMap, setVideoMap] = useState({});
    const fetchedVideosRef = useRef(false);

    useEffect(() => {
        if (!visible || isCardio || fetchedVideosRef.current) return;
        fetchedVideosRef.current = true;

        (async () => {
            try {
                const stored = await AsyncStorage.getItem('user');
                if (!stored) return;
                const user = JSON.parse(stored);
                const coachIdToUse = user.coachId || user.id;
                const hdrs = await authHeaders();
                const res = await fetch(`https://fitos-final.onrender.com/api/admin/system-technique-videos?coachId=${coachIdToUse}`, { headers: { ...hdrs } });
                if (res.ok) {
                    const videos = await res.json();
                    const map = {};
                    videos.forEach(v => { if (v.videoUrl) map[v.key] = v.videoUrl; });
                    setVideoMap(map);
                }
            } catch (e) {
                // Silencioso de propósito: vídeo é um extra no guia, nunca deve
                // travar o seletor de técnica se a busca falhar.
            }
        })();
    }, [visible, isCardio]);

    const techGuide = useMemo(() => {
        if (isCardio || !theme) return {};
        const guide = getCoachTechGuide(theme);
        Object.keys(guide).forEach(key => {
            if (videoMap[key]) guide[key] = { ...guide[key], videoUrl: videoMap[key] };
        });
        return guide;
    }, [theme, isCardio, videoMap]);

    // 1. Garante que as suas opções antigas NUNCA sumam
    const opcoesAntigas = Array.isArray(options) ? options : [];

    // 2. Transforma as técnicas do laboratório no formato do botão
    const opcoesLaboratorio = listaTecnicas.map(t => ({
        id: t.id,
        title: `🧪 ${t.name}`, // Ícone para você saber que é a sua técnica inteligente
        isCustomId: true
    }));

    // 3. Junta tudo (se for cardio, mantém só as de intensidade)
    const listaParaRenderizar = isCardio
        ? opcoesAntigas
        : [...opcoesAntigas, ...opcoesLaboratorio];

    return (
        <>
            <Modal visible={visible} transparent animationType="fade">
                <View style={S.overlay}>
                    <View style={[S.box, { backgroundColor: theme.surface }]}>
                        <Text style={[S.title, { color: theme.text }]}>{modalTitle}</Text>

                        <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
                            {listaParaRenderizar.map((t, index) => {
                                const guideKey = t.id || 'NORMAL';
                                const hasGuide = !t.isCustomId && !!techGuide[guideKey];

                                return (
                                    <View
                                        key={t.id || `fallback_${index}`}
                                        style={[S.optionRow, { borderBottomColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}
                                    >
                                        <TouchableOpacity
                                            style={S.optionMain}
                                            onPress={() => onSelectOption(t.id, t.isCustomId)}
                                        >
                                            <Text style={[
                                                S.optionText,
                                                { color: theme.text },
                                                getCurrentTechnique() === t.id && { color: theme.accent, fontWeight: '900' }
                                            ]}>
                                                {t.title}
                                            </Text>
                                        </TouchableOpacity>

                                        {hasGuide && (
                                            <TouchableOpacity
                                                style={S.infoBtn}
                                                onPress={() => setGuideTech(guideKey)}
                                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                            >
                                                <MaterialCommunityIcons name="information-outline" size={20} color={theme.textSecondary} />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                );
                            })}
                        </ScrollView>

                        <TouchableOpacity style={[S.cancelBtn, { marginTop: 10 }]} onPress={onClose}>
                            <Text style={[S.cancelText, { color: theme.textSecondary }]}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <TechGuideModal
                visible={!!guideTech}
                onClose={() => setGuideTech(null)}
                theme={theme}
                selectedTech={guideTech}
                TECH_GUIDE={techGuide}
                isPlayingTechVoice={false}
                handlePlayTechVoice={() => {}}
                isWeb={!!isWeb}
                closeLabel="ENTENDI"
            />
        </>
    );
}

const S = StyleSheet.create({
    overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 24 },
    box:        { borderRadius: 20, padding: 24, width: '100%', maxWidth: 400, alignSelf: 'center' },
    title:      { fontSize: 17, fontWeight: '900', textAlign: 'center', marginBottom: 20 },
    optionRow:  { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1 },
    optionMain: { flex: 1, paddingVertical: 14 },
    optionText: { fontWeight: '600', textAlign: 'center', fontSize: 14 },
    infoBtn:    { paddingVertical: 14, paddingLeft: 10 },
    cancelBtn:  { padding: 12, alignItems: 'center' },
    cancelText: { fontWeight: '600' },
});
