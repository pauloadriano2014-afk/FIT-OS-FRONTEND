// src/components/ImportDietModal.js
import React, { useState } from 'react';
import { 
    View, Text, StyleSheet, Modal, TouchableOpacity, 
    ActivityIndicator, Platform, Alert 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { authHeaders } from '../utils/authToken';

export default function ImportDietModal({ visible, onClose, theme, onImportSuccess }) {
    const [isLoading, setIsLoading] = useState(false);
    const [statusText, setStatusText] = useState('');

    const handleSelectPDF = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/pdf',
                copyToCacheDirectory: true
            });

            if (result.canceled) return;

            const file = result.assets[0];
            await uploadAndParsePDF(file);

        } catch (error) {
            console.error("Erro ao selecionar arquivo:", error);
            Alert.alert("Erro", "Não foi possível selecionar o PDF.");
        }
    };

    const uploadAndParsePDF = async (file) => {
        setIsLoading(true);
        setStatusText('Lendo PDF com Inteligência Artificial...\nIsso pode levar de 10 a 30 segundos.');

        try {
            const formData = new FormData();
            
            // Tratamento para Web e Mobile
            if (Platform.OS === 'web') {
                const res = await fetch(file.uri);
                const blob = await res.blob();
                formData.append('file', blob, file.name);
            } else {
                formData.append('file', {
                    uri: file.uri,
                    name: file.name,
                    type: file.mimeType || 'application/pdf'
                });
            }

            // Manda pro seu backend processar com a IA (Rota atualizada)
            const response = await fetch('https://fitos-final.onrender.com/api/admin/import-diet-pdf', {
                method: 'POST',
                headers: { ...(await authHeaders()) },
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Falha ao processar o PDF com a IA.");
            }

            const data = await response.json();
            
            if (data.meals && data.meals.length > 0) {
                // Passa as refeições formatadas de volta para o AdminDietScreen
                onImportSuccess(data.meals);
            } else {
                Alert.alert("Aviso", "A IA não conseguiu identificar as refeições neste arquivo.");
                onClose();
            }

        } catch (error) {
            console.error("Erro no upload do PDF:", error);
            Alert.alert("Erro Técnico", "Falha na comunicação com o Cérebro da IA.");
            onClose();
        } finally {
            setIsLoading(false);
            setStatusText('');
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={[styles.modalBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    
                    <TouchableOpacity style={styles.closeBtn} onPress={onClose} disabled={isLoading}>
                        <MaterialCommunityIcons name="close" size={24} color={theme.textSecondary} />
                    </TouchableOpacity>

                    <View style={styles.iconWrap}>
                        <MaterialCommunityIcons name="file-pdf-box" size={48} color="#FF3B30" />
                    </View>
                    
                    <Text style={[styles.title, { color: theme.text }]}>IMPORTAR DIETA</Text>
                    <Text style={[styles.desc, { color: theme.textSecondary }]}>
                        Envie um PDF do Nutrium ou do seu modelo padrão. A IA irá ler o documento e preencher a Mesa de Operações automaticamente.
                    </Text>

                    {isLoading ? (
                        <View style={styles.loadingBox}>
                            <ActivityIndicator size="large" color={theme.accent} />
                            <Text style={[styles.loadingText, { color: theme.accent }]}>{statusText}</Text>
                        </View>
                    ) : (
                        <TouchableOpacity style={[styles.uploadBtn, { backgroundColor: theme.accent }]} onPress={handleSelectPDF}>
                            <MaterialCommunityIcons name="upload" size={20} color={theme.isDark ? '#000' : '#FFF'} />
                            <Text style={[styles.uploadBtnText, { color: theme.isDark ? '#000' : '#FFF' }]}>SELECIONAR ARQUIVO PDF</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalBox: { width: '100%', maxWidth: 400, borderRadius: 24, padding: 30, borderWidth: 1, alignItems: 'center', position: 'relative' },
    closeBtn: { position: 'absolute', top: 20, right: 20, padding: 5 },
    iconWrap: { width: 80, height: 80, borderRadius: 24, backgroundColor: '#FF3B3015', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
    title: { fontSize: 20, fontWeight: '900', letterSpacing: 1, marginBottom: 10 },
    desc: { fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 30 },
    uploadBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 16, paddingHorizontal: 24, borderRadius: 16, width: '100%', justifyContent: 'center' },
    uploadBtnText: { fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },
    loadingBox: { alignItems: 'center', marginTop: 10 },
    loadingText: { fontSize: 12, fontWeight: 'bold', textAlign: 'center', marginTop: 15, lineHeight: 18 }
});