// src/components/CustomCalendar.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function CustomCalendar({ selectedDate, onSelect, onClose, theme }) {
    const [currentDate, setCurrentDate] = useState(selectedDate ? new Date(selectedDate) : new Date());
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    
    const daysInMonth = (m, y) => new Date(y, m + 1, 0).getDate();
    const firstDayOfMonth = (m, y) => new Date(y, m, 1).getDay();
    
    const generateDays = () => {
        const total = daysInMonth(month, year);
        const start = firstDayOfMonth(month, year);
        const days = Array(start).fill(null);
        for (let i = 1; i <= total; i++) days.push(i);
        return days;
    };

    return (
        <View style={{ backgroundColor: theme.surface, padding: 20, borderRadius: 20, width: 320, alignSelf:'center', borderWidth: 1, borderColor: theme.border }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                <TouchableOpacity onPress={() => setCurrentDate(new Date(year, month - 1, 1))}><MaterialCommunityIcons name="chevron-left" size={28} color={theme.text} /></TouchableOpacity>
                <Text style={{ color: theme.accent, fontWeight: '900', fontSize: 16 }}>{monthNames[month].toUpperCase()} {year}</Text>
                <TouchableOpacity onPress={() => setCurrentDate(new Date(year, month + 1, 1))}><MaterialCommunityIcons name="chevron-right" size={28} color={theme.text} /></TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 }}>{['D','S','T','Q','Q','S','S'].map((d,i) => <Text key={i} style={{ color: theme.textSecondary, fontWeight: 'bold', width: 30, textAlign: 'center' }}>{d}</Text>)}</View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {generateDays().map((day, i) => (
                    <TouchableOpacity key={i} style={[{ width: '14.2%', height: 40, justifyContent: 'center', alignItems: 'center' }, day === currentDate.getDate() && { backgroundColor: theme.accent, borderRadius: 20 }]} onPress={() => day && onSelect(new Date(year, month, day))} disabled={!day}>
                        <Text style={[{ color: theme.text }, day === currentDate.getDate() && { color: theme.isDark ? '#000' : '#FFF', fontWeight: '900' }]}>{day || ''}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            <TouchableOpacity style={{ marginTop: 20, alignItems: 'center', padding: 15, backgroundColor: theme.bg, borderRadius: 12, borderWidth: 1, borderColor: theme.border }} onPress={onClose}><Text style={{ color: theme.text, fontWeight: 'bold' }}>FECHAR</Text></TouchableOpacity>
        </View>
    );
}