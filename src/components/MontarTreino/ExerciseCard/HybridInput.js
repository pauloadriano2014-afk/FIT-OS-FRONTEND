// src/components/MontarTreino/ExerciseCard/HybridInput.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function HybridInput({
    inputRef, label, value, onChangeText, options, theme,
    isCardio, keyboardType = 'default', nextFocusRef,
    onBlurAction, onDeleteOption, onSubmitEditing, flex = 1
}) {
    const [open, setOpen] = useState(false);

    return (
        <View style={[S.box, { flex, zIndex: open ? 200 : 1 }]}>
            <Text style={[S.label, { color: isCardio ? theme.accent : theme.textSecondary }]}>{label}</Text>
            <TextInput
                ref={inputRef}
                style={[S.input, {
                    color: theme.text,
                    borderColor: open ? theme.accent : theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                }]}
                value={value}
                onChangeText={onChangeText}
                onFocus={() => setOpen(true)}
                onBlur={() => { setTimeout(() => setOpen(false), 200); onBlurAction?.(); }}
                keyboardType={keyboardType}
                selectTextOnFocus
                returnKeyType="next"
                onSubmitEditing={() => { onSubmitEditing?.(); nextFocusRef?.current?.focus(); }}
            />
            {open && options && options.length > 0 && (
                <View style={[S.dropdown, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <ScrollView nestedScrollEnabled style={{ maxHeight: 160 }} keyboardShouldPersistTaps="handled">
                        {options.map((opt, i) => {
                            if (opt.isTitle) return (
                                <View key={i} style={[S.dropTitle, { borderBottomColor: theme.border }]}>
                                    <Text style={[S.dropTitleText, { color: theme.textSecondary }]}>{opt.label}</Text>
                                </View>
                            );
                            return (
                                <View key={i} style={[S.optionRow, { borderBottomColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                                    <TouchableOpacity style={S.optionClick} onPress={() => { onChangeText(opt.val ?? opt.label); setOpen(false); }}>
                                        <Text style={[S.optionText, { color: value === (opt.val ?? opt.label) ? theme.accent : theme.text }]}>{opt.label}</Text>
                                    </TouchableOpacity>
                                    {opt.isDeletable && onDeleteOption && (
                                        <TouchableOpacity style={S.optionDelete} onPress={() => onDeleteOption(opt.val ?? opt.label)}>
                                            <MaterialCommunityIcons name="close" size={14} color="#FF3B30" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            );
                        })}
                    </ScrollView>
                </View>
            )}
        </View>
    );
}

const S = StyleSheet.create({
    box:          { flex: 1 },
    label:        { fontSize: 9, fontWeight: '800', marginBottom: 5, textAlign: 'center', letterSpacing: 0.5 },
    input:        { padding: 8, borderRadius: 8, fontSize: 16, textAlign: 'center', borderWidth: 1, fontWeight: '700', outlineStyle: 'none' },
    dropdown:     { position: 'absolute', top: 60, left: -10, width: 150, maxHeight: 200, borderWidth: 1, borderRadius: 10, zIndex: 300, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 10 },
    dropTitle:    { paddingVertical: 6, paddingHorizontal: 8, borderBottomWidth: 1 },
    dropTitleText:{ fontSize: 9, fontWeight: '900', textAlign: 'center' },
    optionRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1 },
    optionClick:  { flex: 1, padding: 11 },
    optionDelete: { padding: 11, justifyContent: 'center', alignItems: 'center' },
    optionText:   { fontSize: 13, fontWeight: '700', textAlign: 'center' },
});