import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function AdminAddContent({ navigation }) {
    const [form, setForm] = useState({ title: '', subtitle: '', category: 'TÉCNICA', videoUrl: '', thumbUrl: '', duration: '' });
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        if (!form.title || !form.videoUrl || !form.thumbUrl) return Alert.alert("Erro", "Preencha Título, Vídeo e Capa.");

        setLoading(true);
        try {
            const res = await fetch('https://fitos-final.onrender.com/api/contents', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(form)
            });

            if (res.ok) {
                Alert.alert("Sucesso", "Vídeo publicado!");
                navigation.goBack();
            } else {
                Alert.alert("Erro", "Falha ao publicar.");
            }
        } catch (error) {
            Alert.alert("Erro", "Verifique conexão.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}><MaterialCommunityIcons name="arrow-left" size={24} color="#FFF"/></TouchableOpacity>
                <Text style={styles.title}>NOVO CONTEÚDO PA FLIX</Text>
                <View style={{width:24}}/>
            </View>

            <ScrollView contentContainerStyle={{padding:20}}>
                <Text style={styles.label}>TÍTULO</Text>
                <TextInput style={styles.input} value={form.title} onChangeText={t=>setForm({...form, title:t})} placeholder="Ex: Agachamento Livre" placeholderTextColor="#555"/>

                <Text style={styles.label}>SUBTÍTULO</Text>
                <TextInput style={styles.input} value={form.subtitle} onChangeText={t=>setForm({...form, subtitle:t})} placeholder="Ex: Aprenda a técnica correta" placeholderTextColor="#555"/>

                <Text style={styles.label}>CATEGORIA (TÉCNICA, MINDSET, NUTRIÇÃO)</Text>
                <TextInput style={styles.input} value={form.category} onChangeText={t=>setForm({...form, category:t.toUpperCase()})} placeholderTextColor="#555"/>

                <Text style={styles.label}>LINK DO VÍDEO (.mp4 ou .m3u8)</Text>
                <TextInput style={styles.input} value={form.videoUrl} onChangeText={t=>setForm({...form, videoUrl:t})} placeholder="https://..." placeholderTextColor="#555" autoCapitalize='none'/>

                <Text style={styles.label}>LINK DA CAPA (Imagem)</Text>
                <TextInput style={styles.input} value={form.thumbUrl} onChangeText={t=>setForm({...form, thumbUrl:t})} placeholder="https://..." placeholderTextColor="#555" autoCapitalize='none'/>

                <Text style={styles.label}>DURAÇÃO (Texto)</Text>
                <TextInput style={styles.input} value={form.duration} onChangeText={t=>setForm({...form, duration:t})} placeholder="Ex: 12 min" placeholderTextColor="#555"/>

                <TouchableOpacity style={styles.btn} onPress={handleCreate} disabled={loading}>
                    {loading ? <ActivityIndicator color="#000"/> : <Text style={styles.btnText}>PUBLICAR VÍDEO</Text>}
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    header: { padding: 20, paddingTop: 50, flexDirection:'row', justifyContent:'space-between', alignItems:'center', borderBottomWidth:1, borderBottomColor:'#222' },
    title: { color: '#FFF', fontWeight: 'bold' },
    label: { color: '#CCFF00', fontSize: 10, fontWeight: 'bold', marginTop: 15, marginBottom: 5 },
    input: { backgroundColor: '#111', color: '#FFF', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#333' },
    btn: { backgroundColor: '#CCFF00', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 30 },
    btnText: { fontWeight: '900' }
});