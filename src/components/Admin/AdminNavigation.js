import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function AdminNavigation({ 
    theme, isWebPC, activeTab, setActiveTab, totalAlerts, 
    MENU_TABS, isMenuVisible, setIsMenuVisible 
}) {
    const currentTabObj = MENU_TABS.find(t => t.id === activeTab) || MENU_TABS[0];

    return (
        <>
            {isWebPC ? (
                <View style={[styles.webTabsContainer, { borderBottomColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>
                    {MENU_TABS.map((t) => {
                        const isActive = activeTab === t.id;
                        return (
                            <TouchableOpacity 
                                key={t.id} 
                                style={[styles.webTabBtn, isActive && { borderBottomColor: theme.accent }]}
                                onPress={() => setActiveTab(t.id)}
                            >
                                <MaterialCommunityIcons name={t.icon} size={18} color={isActive ? theme.accent : theme.textSecondary} />
                                <Text style={[styles.webTabText, { color: isActive ? theme.text : theme.textSecondary, fontWeight: isActive ? '900' : '700' }]}>
                                    {t.shortLabel}
                                </Text>
                                {t.id === 'CHECKINS' && totalAlerts > 0 && (
                                    <View style={[styles.badgeCountWeb, { backgroundColor: '#FF3B30' }]}>
                                        <Text style={[styles.badgeTextWeb, { color: '#FFF' }]}>{totalAlerts}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            ) : (
                <TouchableOpacity style={[styles.menuSelector, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => setIsMenuVisible(true)}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <View style={[styles.menuIconBox, { backgroundColor: theme.accent + '22' }]}>
                            <MaterialCommunityIcons name={currentTabObj.icon} size={20} color={theme.accent} />
                        </View>
                        <Text style={[styles.menuSelectorText, { color: theme.text }]}>{currentTabObj.label}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        {currentTabObj.id === 'CHECKINS' && totalAlerts > 0 && (
                            <View style={[styles.badgeCount, { backgroundColor: '#FF3B30' }]}>
                                <Text style={[styles.badgeText, { color: '#FFF' }]}>{totalAlerts}</Text>
                            </View>
                        )}
                        <MaterialCommunityIcons name="chevron-down" size={24} color={theme.textSecondary} />
                    </View>
                </TouchableOpacity>
            )}

            {/* MODAL DO MENU DROPDOWN (CELULAR) */}
            <Modal visible={isMenuVisible} transparent animationType="fade" onRequestClose={() => setIsMenuVisible(false)}>
                <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setIsMenuVisible(false)}>
                    <View style={[styles.menuModalContent, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        {MENU_TABS.map((t, index) => (
                            <TouchableOpacity 
                                key={t.id} 
                                style={[
                                    styles.menuOptionBtn, 
                                    { borderBottomColor: index === MENU_TABS.length - 1 ? 'transparent' : theme.border },
                                    activeTab === t.id && { backgroundColor: theme.accent + '15' }
                                ]} 
                                onPress={() => { setActiveTab(t.id); setIsMenuVisible(false); }}
                            >
                                <MaterialCommunityIcons name={t.icon} size={22} color={activeTab === t.id ? theme.accent : theme.textSecondary} />
                                <Text style={[styles.menuOptionText, { color: activeTab === t.id ? theme.accent : theme.text }]}>{t.label}</Text>
                                {t.id === 'CHECKINS' && totalAlerts > 0 && (
                                    <View style={[styles.badgeCount, { backgroundColor: '#FF3B30', marginLeft: 'auto' }]}>
                                        <Text style={[styles.badgeText, { color: '#FFF' }]}>{totalAlerts}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    webTabsContainer: { flexDirection: 'row', borderBottomWidth: 1, marginBottom: 20, gap: 25, paddingHorizontal: 5 },
    webTabBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 3, borderBottomColor: 'transparent', gap: 6 },
    webTabText: { fontSize: 13, letterSpacing: 0.5, textTransform: 'uppercase' },
    badgeCountWeb: { paddingHorizontal: 6, borderRadius: 10, height: 20, minWidth: 20, justifyContent: 'center', alignItems: 'center', marginLeft: 2 },
    badgeTextWeb: { fontSize: 10, fontWeight: '900' },
    menuSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, paddingRight: 15, borderRadius: 16, borderWidth: 1, marginBottom: 20 },
    menuIconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    menuSelectorText: { fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    menuModalContent: { width: '90%', maxWidth: 400, borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
    menuOptionBtn: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, gap: 15 },
    menuOptionText: { fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },
    badgeCount: { paddingHorizontal: 6, borderRadius: 10, height: 20, minWidth: 20, justifyContent: 'center', alignItems: 'center' }, 
    badgeText: { fontSize: 10, fontWeight: '900' },
});