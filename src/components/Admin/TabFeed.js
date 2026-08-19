import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const isSameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

// "HOJE" / "ONTEM" / "DD/MM/AAAA" — cabeçalho de cada grupo de dia
const getDayLabel = (date) => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (isSameDay(date, now)) return 'HOJE';
    if (isSameDay(date, yesterday)) return 'ONTEM';
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// "há 5 min" pros eventos bem recentes, senão só o horário
const formatItemTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMin = Math.floor((now - date) / 60000);
    if (diffMin < 1) return 'agora mesmo';
    if (diffMin < 60) return `há ${diffMin} min`;
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

export default function TabFeed({
    theme, filteredFeed, visibleCountFeed, setVisibleCountFeed, handleDeleteLog,
    navigation, alunosAtivos = [], alunosInativos = [],
}) {
    const allAlunos = useMemo(() => [...alunosAtivos, ...alunosInativos], [alunosAtivos, alunosInativos]);

    // Agrupa os itens já visíveis (respeitando o "carregar mais") por dia,
    // preservando a ordem que já vem do backend (mais recentes primeiro).
    const groupedFeed = useMemo(() => {
        const groups = [];
        filteredFeed.slice(0, visibleCountFeed).forEach(item => {
            const label = getDayLabel(new Date(item.date));
            let group = groups[groups.length - 1]?.label === label ? groups[groups.length - 1] : null;
            if (!group) { group = { label, items: [] }; groups.push(group); }
            group.items.push(item);
        });
        return groups;
    }, [filteredFeed, visibleCountFeed]);

    const handlePressItem = (item) => {
        if (!navigation) return;
        const uid = item.userId || item.user?.id;
        const aluno = allAlunos.find(a => a.id === uid) || item.user || null;
        if (!aluno) return;
        navigation.navigate('AdminAlunoOptions', { aluno, alunoId: aluno.id });
    };

    const renderFeedItem = (item) => (
        <TouchableOpacity
            key={item.id}
            activeOpacity={0.7}
            onPress={() => handlePressItem(item)}
            style={[styles.feedCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
            <View style={[styles.iconBox, { backgroundColor: theme.accent + '22' }]}><MaterialCommunityIcons name="check-bold" size={20} color={theme.accent} /></View>
            <View style={{flex: 1}}>
                <View style={{flexDirection:'row', justifyContent:'space-between'}}>
                    <Text style={[styles.feedUser, { color: theme.text }]} numberOfLines={1}>{item.user?.name || "Aluno"}</Text>
                    <Text style={styles.feedTime}>{formatItemTime(item.date)}</Text>
                </View>
                <Text style={styles.feedAction}>Concluiu <Text style={{color: theme.accent, fontWeight:'bold'}}>{item.workoutName ? item.workoutName.toUpperCase() : "TREINO"}</Text></Text>
            </View>
            <TouchableOpacity
                onPress={(e) => { if (e?.stopPropagation) e.stopPropagation(); handleDeleteLog(item.id); }}
                style={{padding:5, marginLeft:5}}
            >
                <MaterialCommunityIcons name="close" size={16} color={theme.textSecondary} />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    return (
        <>
            {filteredFeed.length === 0 ? <Text style={styles.empty}>Nada recente.</Text> : groupedFeed.map(group => (
                <View key={group.label} style={{ marginBottom: 8 }}>
                    <Text style={[styles.dayHeader, { color: theme.textSecondary, borderBottomColor: theme.border }]}>{group.label}</Text>
                    {group.items.map(renderFeedItem)}
                </View>
            ))}
            {visibleCountFeed < filteredFeed.length && (
                <TouchableOpacity style={[styles.loadMoreBtn, { borderColor: theme.accent, backgroundColor: theme.accent + '15' }]} onPress={() => setVisibleCountFeed(p => p + 10)}>
                    <Text style={[styles.loadMoreText, { color: theme.accent }]}>CARREGAR MAIS</Text>
                </TouchableOpacity>
            )}
        </>
    );
}

const styles = StyleSheet.create({
    empty: { color: '#888', textAlign: 'center', marginTop: 50, fontWeight: '600' },
    dayHeader: { fontSize: 11, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase', paddingBottom: 8, marginBottom: 10, borderBottomWidth: 1 },
    feedCard: { padding: 16, borderRadius: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'flex-start', borderWidth: 1 },
    iconBox: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    feedUser: { fontWeight: '900', fontSize: 14 }, feedTime: { color: '#888', fontSize: 10, fontWeight:'700' }, feedAction: { color: '#888', fontSize: 13, marginTop: 4 },
    loadMoreBtn: { padding: 16, marginVertical: 20, borderRadius: 14, borderWidth: 1, alignItems: 'center' },
    loadMoreText: { fontWeight: '900', fontSize: 12, letterSpacing: 1 }
});