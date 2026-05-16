// src/components/MontarTreino/Modals/VideoAccessModal.js
import React from 'react';
import { 
    View, Text, StyleSheet, Modal, TouchableOpacity, FlatList, 
    ActivityIndicator, Switch, Platform 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function VideoAccessModal({
    visible, onClose, theme, selectedContent, loadingAccess,
    allStudents, contentAccessList, toggleStudentAccess
}) {
    const renderStudentAccessItem = ({ item }) => {
        const hasAccess = contentAccessList.includes(item.id);
        
        return (
            <View style={[styles.studentAccessRow, { borderBottomColor: theme.border }]}>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                    <View style={[styles.studentAvatar, { backgroundColor: theme.border }]}>
                        <Text style={{ color: theme.text, fontWeight: 'bold' }}>{item.name.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View>
                        <Text style={[styles.studentName, { color: theme.text }]}>{item.name}</Text>
                        <Text style={styles.studentEmail}>{item.email}</Text>
                    </View>
                </View>
                <Switch 
                    value={hasAccess} 
                    onValueChange={() => toggleStudentAccess(item.id, hasAccess)} 
                    trackColor={{ false: theme.border, true: theme.accent }}
                    thumbColor={Platform.OS === 'ios' ? '#FFF' : (hasAccess ? (theme.isDark ? '#000' : '#FFF') : '#f4f3f4')}
                />
            </View>
        );
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                        <View>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>LIBERAR ACESSO VIP</Text>
                            <Text style={{ color: theme.accent, fontSize: 12, fontWeight: 'bold' }} numberOfLines={1}>
                                {selectedContent?.title}
                            </Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={{ padding: 5 }}>
                            <MaterialCommunityIcons name="close" size={24} color={theme.text}/>
                        </TouchableOpacity>
                    </View>
                    
                    {loadingAccess ? (
                        <View style={{ padding: 40, alignItems: 'center' }}>
                            <ActivityIndicator size="large" color={theme.accent} />
                        </View>
                    ) : (
                        <FlatList 
                            data={allStudents}
                            keyExtractor={item => item.id}
                            renderItem={renderStudentAccessItem}
                            contentContainerStyle={{ paddingBottom: 20 }}
                            ListEmptyComponent={
                                <Text style={{ color: theme.textSecondary, textAlign: 'center', padding: 20 }}>Nenhum aluno encontrado no sistema.</Text>
                            }
                        />
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%', borderWidth: 1, width: '100%', maxWidth: 480, alignSelf: 'center', flex: 1 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
    modalTitle: { fontWeight: '900', fontSize: 16, letterSpacing: 1 },
    studentAccessRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1 },
    studentAvatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    studentName: { fontWeight: 'bold', fontSize: 14 },
    studentEmail: { color: '#888', fontSize: 12 }
});