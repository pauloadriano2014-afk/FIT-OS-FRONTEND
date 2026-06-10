// src/components/MontarTreino/MainAreaHeader.js
import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function MainAreaHeader({
    theme,
    selectedWorkoutTab, workoutTabsLength,
    editingTabName, editingTabValue, setEditingTabValue,
    onStartRename, onConfirmRename,
    onDuplicate, onDelete, onAutoFill, onCollapse, onClear,
}) {
    return (
        <View style={[S.header, { borderBottomColor: theme.border, backgroundColor: theme.bg }]}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                {editingTabName === selectedWorkoutTab ? (
                    <TextInput
                        style={[S.renameInput, { color: theme.text, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: theme.accent, flex: 1, marginRight: 10 }]}
                        value={editingTabValue}
                        onChangeText={setEditingTabValue}
                        autoFocus
                        onSubmitEditing={() => onConfirmRename(selectedWorkoutTab)}
                        onBlur={() => onConfirmRename(selectedWorkoutTab)}
                    />
                ) : (
                    <Text style={[S.title, { color: theme.text }]} numberOfLines={1}>
                        Editando: <Text style={{ color: theme.accent }}>{selectedWorkoutTab}</Text>
                    </Text>
                )}
            </View>

            <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                {!editingTabName && (
                    <TouchableOpacity style={[S.btn, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]} onPress={onStartRename}>
                        <MaterialCommunityIcons name="pencil" size={14} color={theme.textSecondary} />
                        <Text style={[S.btnText, { color: theme.textSecondary }]}>Renomear</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity style={[S.btn, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]} onPress={onDuplicate}>
                    <MaterialCommunityIcons name="content-copy" size={14} color={theme.textSecondary} />
                    <Text style={[S.btnText, { color: theme.textSecondary }]}>Duplicar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[S.btn, { backgroundColor: 'rgba(255,59,48,0.1)' }]} onPress={onDelete} disabled={workoutTabsLength <= 1}>
                    <MaterialCommunityIcons name="trash-can" size={14} color={workoutTabsLength <= 1 ? theme.textSecondary : '#FF3B30'} />
                    <Text style={[S.btnText, { color: workoutTabsLength <= 1 ? theme.textSecondary : '#FF3B30' }]}>Excluir</Text>
                </TouchableOpacity>

                <View style={{ width: 1, height: 20, backgroundColor: theme.border, marginHorizontal: 4 }} />

                <TouchableOpacity style={[S.btn, { backgroundColor: theme.accent + '15' }]} onPress={onAutoFill}>
                    <MaterialCommunityIcons name="swap-horizontal" size={14} color={theme.accent} />
                    <Text style={[S.btnText, { color: theme.accent }]}>Auto Sub.</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[S.btn, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]} onPress={onCollapse}>
                    <MaterialCommunityIcons name="format-list-bulleted" size={14} color={theme.textSecondary} />
                    <Text style={[S.btnText, { color: theme.textSecondary }]}>Minimizar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[S.btn, { backgroundColor: 'rgba(255,59,48,0.1)' }]} onPress={onClear}>
                    <MaterialCommunityIcons name="delete-sweep" size={14} color="#FF3B30" />
                    <Text style={[S.btnText, { color: '#FF3B30' }]}>Limpar</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const S = StyleSheet.create({
    header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, zIndex: 5 },
    title:      { fontSize: 18, fontWeight: '900' },
    renameInput:{ padding: 10, borderRadius: 8, borderWidth: 1, fontSize: 16, fontWeight: '700', outlineStyle: 'none' },
    btn:        { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8, borderRadius: 8 },
    btnText:    { fontSize: 11, fontWeight: 'bold' },
});
