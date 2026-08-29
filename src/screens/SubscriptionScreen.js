import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView, TouchableOpacity, Linking, StatusBar } from 'react-native';

export default function SubscriptionScreen() {
  const [selectedPlan, setSelectedPlan] = useState('ANUAL'); // Começa com o Anual selecionado

  const plans = [
    { id: 'MENSAL', title: 'MENSAL', price: '49,90', period: 'mês', savings: null },
    { id: 'TRIMESTRAL', title: 'TRIMESTRAL', price: '129,90', period: 'trim', savings: '15%' },
    { id: 'SEMESTRAL', title: 'SEMESTRAL', price: '229,90', period: 'sem', savings: '25%' },
    { id: 'ANUAL', title: 'ANUAL', price: '399,90', period: 'ano', savings: '35%', recommended: true },
  ];

  const openWhatsApp = () => {
    const msg = "Olá! Vim pelo app ELITE FIT e quero saber mais sobre a Consultoria Premium.";
    Linking.openURL(`https://wa.me/5541997991346?text=${encodeURIComponent(msg)}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.header}>
          <Text style={styles.title}>EVOLUA SEU <Text style={{color: '#CCFF00'}}>PLANO</Text></Text>
          <Text style={styles.subtitle}>Escolha a melhor opção para seus resultados.</Text>
        </View>

        {/* LISTA DE PLANOS DINÂMICA */}
        {plans.map((plan) => (
          <TouchableOpacity 
            key={plan.id}
            activeOpacity={0.8}
            style={[
              styles.planCard, 
              selectedPlan === plan.id && styles.selectedCard
            ]}
            onPress={() => setSelectedPlan(plan.id)}
          >
            {plan.recommended && (
              <View style={styles.badge}><Text style={styles.badgeText}>MELHOR ESCOLHA</Text></View>
            )}
            
            <View>
              <Text style={[styles.planTitle, selectedPlan === plan.id && {color: '#CCFF00'}]}>
                {plan.title}
              </Text>
              <View style={styles.priceRow}>
                <Text style={styles.currency}>R$</Text>
                <Text style={styles.price}>{plan.price}</Text>
                <Text style={styles.period}>/{plan.period}</Text>
              </View>
              {plan.savings && <Text style={styles.savingsText}>Economize {plan.savings}</Text>}
            </View>

            <View style={[styles.radio, selectedPlan === plan.id && styles.radioActive]}>
              {selectedPlan === plan.id && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>
        ))}

        <TouchableOpacity 
          style={styles.subscribeBtn} 
          onPress={() => alert(`Plano ${selectedPlan} selecionado! Indo para o checkout...`)}
        >
          <Text style={styles.subscribeBtnText}>ASSINAR AGORA</Text>
        </TouchableOpacity>

        {/* CONSULTORIA PREMIUM */}
        <View style={styles.premiumSection}>
          <View style={styles.premiumHeader}>
            <Text style={styles.premiumTitle}>CONSULTORIA PREMIUM</Text>
            <View style={styles.goldBadge}><Text style={styles.goldText}>VIP</Text></View>
          </View>
          <Text style={styles.premiumDesc}>
            Treinos 100% individuais e suporte direto no meu WhatsApp pessoal.
          </Text>
          <TouchableOpacity style={styles.premiumBtn} onPress={openWhatsApp}>
            <Text style={styles.premiumBtnText}>FALAR COM PAULO</Text>
          </TouchableOpacity>
        </View>

        <View style={{height: 50}} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  scrollContent: { padding: 25 },
  header: { marginBottom: 30, marginTop: 10 },
  title: { color: '#fff', fontSize: 26, fontWeight: '900' },
  subtitle: { color: '#666', fontSize: 14, marginTop: 5 },
  
  planCard: { backgroundColor: '#0A0A0A', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: '#1A1A1A', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  selectedCard: { borderColor: '#CCFF00', backgroundColor: '#0D1100' },
  
  planTitle: { color: '#444', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 4 },
  currency: { color: '#fff', fontSize: 14, fontWeight: 'bold', marginBottom: 4, marginRight: 2 },
  price: { color: '#fff', fontSize: 28, fontWeight: '900' },
  period: { color: '#666', fontSize: 14, marginBottom: 4 },
  savingsText: { color: '#CCFF00', fontSize: 10, fontWeight: 'bold', marginTop: 4 },
  
  badge: { position: 'absolute', top: -10, right: 20, backgroundColor: '#CCFF00', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { color: '#000', fontSize: 9, fontWeight: '900' },
  
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#222', justifyContent: 'center', alignItems: 'center' },
  radioActive: { borderColor: '#CCFF00' },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#CCFF00' },

  subscribeBtn: { backgroundColor: '#CCFF00', padding: 20, borderRadius: 20, alignItems: 'center', marginVertical: 20 },
  subscribeBtnText: { color: '#000', fontWeight: '900', fontSize: 16 },

  premiumSection: { backgroundColor: '#111', padding: 25, borderRadius: 30, borderWidth: 1, borderColor: '#222' },
  premiumHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  premiumTitle: { color: '#fff', fontSize: 16, fontWeight: '900' },
  goldBadge: { backgroundColor: '#FFD700', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  goldText: { color: '#000', fontSize: 10, fontWeight: '900' },
  premiumDesc: { color: '#888', fontSize: 13, lineHeight: 18, marginBottom: 20 },
  premiumBtn: { backgroundColor: '#fff', padding: 18, borderRadius: 15, alignItems: 'center' },
  premiumBtnText: { color: '#000', fontWeight: '900' },
});