// src/components/Admin/AdminAnamneseSections.js
// Todas as seções de cards do formulário admin — sem lógica de estado
import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import {
    OBJETIVOS_LIST, NIVEIS_LIST, FREQUENCIAS_LIST, TEMPOS_LIST, MEALS_LIST,
    LIMITACOES_LIST, CIRURGIAS_LIST, SUPLEMENTOS_LIST, HEALTH_COND,
    BARI_TYPES, BARI_TIMES, BARI_INT, MEDS_LIST, DIGEST_LIST,
    SLEEP_H_LIST, SLEEP_Q_LIST, CYCLE_LIST, CYCLE_LBL, PMS_LIST,
    EATS_OUT_LIST, BUDGET_LIST, BUDGET_LBL, WATER_LIST, ALCOHOL_LIST,
    COFFEE_LIST, EAT_SPD_LIST, BINGE_LIST, BINGE_LBL,
    TRIED_LIST, CHALLENGE_LIST, PREWORKOUT_LIST, PREWORKOUT_LBL,
} from '../../Anamnese/useAdminAnamneseForm';

export default function AdminAnamneseSections({ f, set, toggleMulti, setTimePicker, theme, aluno }) {
    // 🔥 NOVA REGRA: Avalia o plano do aluno.
    const plan = (aluno?.plan || aluno?.userPlan || '').toUpperCase();
    const hasDiet = plan === 'ELITE' || plan === 'PREMIUM';
    
    const isFeminino = aluno?.gender === 'Feminino';
    const softBg     = theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';

    // ── Primitivos locais com theme injetado ──────────────────────────────────
    const Label = useCallback(({ children }) => (
        <Text style={[s.label, { color:theme.textSecondary }]}>{children}</Text>
    ), [theme]);

    const Inp = useCallback(({ field, placeholder, multiline=false, keyboardType='default' }) => (
        <TextInput
            style={[multiline ? s.textArea : s.input, { backgroundColor:theme.bg, color:theme.text, borderColor:theme.border }]}
            value={f[field]}
            onChangeText={v => set(field, v)}
            placeholder={placeholder}
            placeholderTextColor={theme.textSecondary}
            multiline={multiline}
            numberOfLines={multiline ? 3 : 1}
            keyboardType={keyboardType}
        />
    ), [f, set, theme]);

    const TimeField = useCallback(({ field, label }) => (
        <TouchableOpacity
            style={[s.timeBtn, { backgroundColor:theme.bg, borderColor: f[field] ? theme.accent : theme.border }]}
            onPress={() => setTimePicker({ visible:true, field, label })}
            activeOpacity={0.7}
        >
            <MaterialCommunityIcons name="clock-outline" size={18} color={f[field] ? theme.accent : theme.textSecondary} />
            <Text style={[s.timeBtnText, { color: f[field] ? theme.text : theme.textSecondary }]}>
                {f[field] || 'Toque para definir'}
            </Text>
            {f[field] && (
                <TouchableOpacity onPress={() => set(field, '')} hitSlop={{ top:8, bottom:8, left:8, right:8 }}>
                    <MaterialCommunityIcons name="close-circle" size={16} color={theme.textSecondary} />
                </TouchableOpacity>
            )}
        </TouchableOpacity>
    ), [f, set, setTimePicker, theme]);

    const ChipRow = useCallback(({ field, items, labels={}, noneVals=['Nenhuma','Nenhum'], single=false }) => (
        <View style={s.chipWrap}>
            {items.map(item => {
                const active = single ? f[field]===item : (f[field]||[]).includes(item);
                return (
                    <TouchableOpacity key={item}
                        style={[s.chip, { backgroundColor:theme.bg, borderColor:theme.border },
                            active && { backgroundColor:theme.accent, borderColor:theme.accent }]}
                        onPress={() => single ? set(field, f[field]===item?'':item) : toggleMulti(field, item, noneVals)}
                    >
                        <Text style={[s.chipText, { color:theme.textSecondary },
                            active && { color:theme.isDark?'#000':'#FFF' }]}>
                            {labels[item]||item}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    ), [f, set, toggleMulti, theme]);

    const CircleRow = useCallback(({ field, items, suffix='' }) => (
        <View style={s.chipWrap}>
            {items.map(item => {
                const active = f[field]===item;
                return (
                    <TouchableOpacity key={item}
                        style={[s.circle, { backgroundColor:theme.bg, borderColor:theme.border },
                            active && { backgroundColor:theme.accent, borderColor:theme.accent }]}
                        onPress={() => set(field, f[field]===item?'':item)}
                    >
                        <Text style={[s.circleText, { color:theme.text },
                            active && { color:theme.isDark?'#000':'#FFF' }]}>{item}{suffix}</Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    ), [f, set, theme]);

    const BoolPair = useCallback(({ field, labelYes='Sim', labelNo='Não' }) => (
        <View style={s.chipWrap}>
            {[{v:'yes',l:labelYes},{v:'no',l:labelNo}].map(({v,l}) => {
                const active = f[field]===v;
                return (
                    <TouchableOpacity key={v}
                        style={[s.chip, { flex:1, backgroundColor:theme.bg, borderColor:theme.border },
                            active && { backgroundColor:theme.accent, borderColor:theme.accent }]}
                        onPress={() => set(field, f[field]===v?'':v)}
                    >
                        <Text style={[s.chipText, { textAlign:'center', color:theme.textSecondary },
                            active && { color:theme.isDark?'#000':'#FFF' }]}>{l}</Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    ), [f, set, theme]);

    const BoolBariatric = useCallback(() => (
        <View style={s.chipWrap}>
            {[{v:true,l:'✅ Sim'},{v:false,l:'❌ Não'}].map(({v,l}) => {
                const active = f.bariatric===v;
                return (
                    <TouchableOpacity key={String(v)}
                        style={[s.chip, { flex:1, backgroundColor:theme.bg, borderColor:theme.border },
                            active && { backgroundColor:theme.accent, borderColor:theme.accent }]}
                        onPress={() => set('bariatric', v)}
                    >
                        <Text style={[s.chipText, { textAlign:'center', color:theme.textSecondary },
                            active && { color:theme.isDark?'#000':'#FFF' }]}>{l}</Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    ), [f, set, theme]);

    const SectionStatus = useCallback(({ fields }) => {
        const empty = fields.filter(k => { const v=f[k]; return Array.isArray(v)?v.length===0:!v; }).length;
        const ok    = empty === 0;
        return (
            <View style={[s.pill, { backgroundColor: ok?'#34C75915':'#FF950015', borderColor: ok?'#34C75940':'#FF950040' }]}>
                <MaterialCommunityIcons name={ok?'check-circle':'alert-circle'} size={12} color={ok?'#34C759':'#FF9500'} />
                <Text style={{ fontSize:10, fontWeight:'800', color: ok?'#34C759':'#FF9500' }}>
                    {ok ? 'COMPLETO' : `${empty} CAMPO(S)`}
                </Text>
            </View>
        );
    }, [f]);

    const CardHeader = ({ icon, title }) => (
        <View style={[s.cardHeader, { borderBottomColor:theme.border }]}>
            <MaterialCommunityIcons name={icon} size={20} color={theme.accent} />
            <Text style={[s.cardTitle, { color:theme.text }]}>{title}</Text>
        </View>
    );

    // ── RENDER ────────────────────────────────────────────────────────────────
    return (
        <>
            {/* REGISTRO */}
            <View style={[s.card, { backgroundColor:theme.surface, borderColor:theme.border }]}>
                <View style={s.cardRow}><CardHeader icon="account-details" title="REGISTRO DO ALUNO" /><SectionStatus fields={['name','email']} /></View>
                <Label>NOME COMPLETO *</Label><Inp field="name" placeholder="Como quer ser chamado?" />
                <Label>E-MAIL DE ACESSO *</Label><Inp field="email" placeholder="exemplo@email.com" keyboardType="email-address" />
                <View style={s.row}>
                    <View style={{flex:1}}>
                        <Label>NASCIMENTO</Label>
                        <TextInput style={[s.input,{backgroundColor:theme.bg,color:theme.text,borderColor:theme.border}]}
                            value={f.birthDate}
                            onChangeText={v=>{let x=v.replace(/\D/g,'');if(x.length>2)x=x.slice(0,2)+'/'+x.slice(2);if(x.length>5)x=x.slice(0,5)+'/'+x.slice(5,9);set('birthDate',x);}}
                            keyboardType="numeric" maxLength={10} placeholder="DD/MM/AAAA" placeholderTextColor={theme.textSecondary}/>
                    </View>
                    <View style={{flex:1}}>
                        <Label>WHATSAPP</Label>
                        <TextInput style={[s.input,{backgroundColor:theme.bg,color:theme.text,borderColor:theme.border}]}
                            value={f.phone}
                            onChangeText={v=>{let x=v.replace(/\D/g,'');if(x.length>2)x='('+x.slice(0,2)+') '+x.slice(2);if(x.length>9)x=x.slice(0,10)+'-'+x.slice(10,14);set('phone',x);}}
                            keyboardType="phone-pad" maxLength={15} placeholder="(00) 00000-0000" placeholderTextColor={theme.textSecondary}/>
                    </View>
                </View>
                <Label>GÊNERO BIOLÓGICO</Label>
                <ChipRow field="gender" items={['Masculino','Feminino']} single noneVals={[]} />
            </View>

            {/* MEDIDAS + TREINO */}
            <View style={[s.card, { backgroundColor:theme.surface, borderColor:theme.border }]}>
                <View style={s.cardRow}><CardHeader icon="clipboard-pulse" title="MEDIDAS E ROTINA DE TREINO" /><SectionStatus fields={['peso','altura','objetivo','nivel','frequencia','tempoDisponivel']} /></View>
                <View style={s.row}>
                    <View style={{flex:1}}><Label>PESO (KG) *</Label><Inp field="peso" placeholder="Ex: 72.5" keyboardType="decimal-pad"/></View>
                    <View style={{flex:1}}><Label>ALTURA (CM) *</Label><Inp field="altura" placeholder="Ex: 168" keyboardType="decimal-pad"/></View>
                </View>
                <Label>OBJETIVO *</Label><ChipRow field="objetivo" items={OBJETIVOS_LIST} single noneVals={[]} />
                <Label>NÍVEL *</Label><ChipRow field="nivel" items={NIVEIS_LIST} single noneVals={[]} />
                <Label>FREQUÊNCIA (DIAS/SEMANA) *</Label><CircleRow field="frequencia" items={FREQUENCIAS_LIST} suffix="x" />
                <Label>TEMPO DISPONÍVEL</Label>
                <ChipRow field="tempoDisponivel" items={TEMPOS_LIST} single noneVals={[]} labels={Object.fromEntries(TEMPOS_LIST.map(t=>[t,`${t}min`]))} />
                {hasDiet && <><Label>TREINA EM JEJUM?</Label><BoolPair field="trainFasted" labelYes="✅ Sim, em jejum" labelNo="🍳 Não, se alimenta antes" /></>}
            </View>

            {/* HISTÓRICO CLÍNICO */}
            <View style={[s.card, { backgroundColor:theme.surface, borderColor:theme.border }]}>
                <View style={s.cardRow}><CardHeader icon="hospital-box" title="MAPEAMENTO DE DORES E HISTÓRICO" /><SectionStatus fields={['limitacoes','cirurgias']} /></View>
                <Label>LIMITAÇÕES FÍSICAS *</Label><ChipRow field="limitacoes" items={LIMITACOES_LIST} />
                <Label>CIRURGIAS PRÉVIAS *</Label><ChipRow field="cirurgias" items={CIRURGIAS_LIST} />
                <Label>LOCAL DE TREINO / EQUIPAMENTOS</Label><Inp field="equipamentos" placeholder="Ex: Academia completa..." />
            </View>

            {/* SAÚDE METABÓLICA */}
            {hasDiet && (
                <View style={[s.card, { backgroundColor:theme.surface, borderColor:theme.border }]}>
                    <View style={s.cardRow}><CardHeader icon="heart-pulse" title="SAÚDE METABÓLICA" /><SectionStatus fields={['healthConditions','medications']} /></View>
                    <Label>CONDIÇÕES DE SAÚDE *</Label><ChipRow field="healthConditions" items={HEALTH_COND} />
                    <Inp field="healthConditionsObs" placeholder="Observações adicionais (opcional)..." multiline />
                    <Label>JÁ FEZ BARIÁTRICA?</Label><BoolBariatric />
                    {f.bariatric===true && <>
                        <Label>TIPO DE CIRURGIA *</Label><ChipRow field="bariatricType" items={BARI_TYPES} single noneVals={[]} />
                        <Label>HÁ QUANTO TEMPO *</Label><ChipRow field="bariatricTime" items={BARI_TIMES} single noneVals={[]} />
                        <Label>INTOLERÂNCIAS PÓS-CIRURGIA</Label><ChipRow field="bariatricIntolerances" items={BARI_INT} />
                    </>}
                    <Label>MEDICAMENTOS CONTÍNUOS *</Label><ChipRow field="medications" items={MEDS_LIST} noneVals={['Nenhum']} />
                    <Inp field="medicationsObs" placeholder="Outros medicamentos..." />
                </View>
            )}

            {/* DIGESTIVO + SONO + STRESS */}
            {hasDiet && (
                <View style={[s.card, { backgroundColor:theme.surface, borderColor:theme.border }]}>
                    <View style={s.cardRow}><CardHeader icon="stomach" title="DIGESTIVO, SONO E STRESS" /><SectionStatus fields={['digestiveIssues','sleepHours','sleepQuality','stressLevel']} /></View>
                    <Label>PROBLEMAS DIGESTIVOS *</Label><ChipRow field="digestiveIssues" items={DIGEST_LIST} noneVals={['Nenhum']} />
                    <Inp field="digestiveObs" placeholder="Detalhes (opcional)..." />
                    <Label>HORAS DE SONO *</Label><ChipRow field="sleepHours" items={SLEEP_H_LIST} single noneVals={[]} />
                    <Label>QUALIDADE DO SONO *</Label><ChipRow field="sleepQuality" items={SLEEP_Q_LIST} single noneVals={[]} />
                    <Label>ACORDA COM FOME À NOITE?</Label><BoolPair field="wakeHungry" />
                    <Label>NÍVEL DE STRESS (1 = tranquilo · 5 = extremo) *</Label><CircleRow field="stressLevel" items={['1','2','3','4','5']} />
                    <Label>COME MAIS QUANDO ESTRESSADO(A)?</Label><BoolPair field="stressEating" />
                </View>
            )}

            {/* CICLO MENSTRUAL */}
            {hasDiet && isFeminino && (
                <View style={[s.card, { backgroundColor:theme.surface, borderColor:theme.border }]}>
                    <View style={s.cardRow}><CardHeader icon="calendar-heart" title="CICLO MENSTRUAL" /><SectionStatus fields={['cycleRegular','pmsSymptoms']} /></View>
                    <Label>REGULARIDADE DO CICLO *</Label><ChipRow field="cycleRegular" items={CYCLE_LIST} single noneVals={[]} labels={CYCLE_LBL} />
                    <Label>SINTOMAS DE TPM *</Label><ChipRow field="pmsSymptoms" items={PMS_LIST} noneVals={['Sem Sintomas Significativos']} />
                    <Inp field="pmsObs" placeholder="Observações sobre o ciclo (opcional)..." multiline />
                </View>
            )}

            {/* ROTINA ALIMENTAR */}
            {hasDiet && (
                <View style={[s.card, { backgroundColor:theme.surface, borderColor:theme.border }]}>
                    <View style={s.cardRow}><CardHeader icon="clock-outline" title="ROTINA ALIMENTAR" /><SectionStatus fields={['mealsPerDay','wakeUpTime','sleepTime','trainTime','eatsOutPerWeek','budget']} /></View>
                    <Label>REFEIÇÕES POR DIA *</Label><CircleRow field="mealsPerDay" items={MEALS_LIST} suffix="x" />
                    <View style={s.row}>
                        <View style={{flex:1}}><Label>ACORDA ÀS *</Label><TimeField field="wakeUpTime" label="Hora que acorda" /></View>
                        <View style={{flex:1}}><Label>DORME ÀS *</Label><TimeField field="sleepTime" label="Hora que dorme" /></View>
                    </View>
                    <View style={s.row}>
                        <View style={{flex:1}}><Label>TRABALHO: INÍCIO</Label><TimeField field="workTimeStart" label="Início do trabalho" /></View>
                        <View style={{flex:1}}><Label>TRABALHO: FIM</Label><TimeField field="workTimeEnd" label="Fim do trabalho" /></View>
                    </View>
                    <Label>TREINO ÀS *</Label><TimeField field="trainTime" label="Horário do treino" />
                    <Label>ESTRATÉGIA PRÉ-TREINO</Label>
                    <ChipRow field="preworkoutStrategy" items={PREWORKOUT_LIST} single noneVals={[]} labels={PREWORKOUT_LBL} />
                    <Label>COME FORA POR SEMANA *</Label><ChipRow field="eatsOutPerWeek" items={EATS_OUT_LIST} single noneVals={[]} />
                    <Label>ORÇAMENTO ALIMENTAR *</Label><ChipRow field="budget" items={BUDGET_LIST} single noneVals={[]} labels={BUDGET_LBL} />
                </View>
            )}

            {/* HÁBITOS */}
            {hasDiet && (
                <View style={[s.card, { backgroundColor:theme.surface, borderColor:theme.border }]}>
                    <View style={s.cardRow}><CardHeader icon="cup-water" title="HÁBITOS E HIDRATAÇÃO" /><SectionStatus fields={['waterIntake','alcoholFreq','eatSpeed','nightBinge']} /></View>
                    <Label>ÁGUA POR DIA *</Label><ChipRow field="waterIntake" items={WATER_LIST} single noneVals={[]} />
                    <Label>CONSUMO DE ÁLCOOL *</Label><ChipRow field="alcoholFreq" items={ALCOHOL_LIST} single noneVals={[]} />
                    <Label>CAFÉS POR DIA</Label><ChipRow field="coffeePerDay" items={COFFEE_LIST} single noneVals={[]} />
                    <Label>FUMANTE?</Label><BoolPair field="smoker" />
                    <Label>VELOCIDADE AO COMER *</Label><ChipRow field="eatSpeed" items={EAT_SPD_LIST} single noneVals={[]} />
                    <Label>COMPULSÃO NOTURNA *</Label><ChipRow field="nightBinge" items={BINGE_LIST} single noneVals={[]} labels={BINGE_LBL} />
                </View>
            )}

            {/* HISTÓRICO DE DIETAS */}
            {hasDiet && (
                <View style={[s.card, { backgroundColor:theme.surface, borderColor:theme.border }]}>
                    <View style={s.cardRow}><CardHeader icon="history" title="HISTÓRICO DE DIETAS" /><SectionStatus fields={['biggestChallenge']} /></View>
                    <Label>DIETAS JÁ TENTADAS</Label><ChipRow field="triedDiets" items={TRIED_LIST} noneVals={['Nenhuma']} />
                    <Label>O QUE JÁ FUNCIONOU</Label><Inp field="dietWorked" placeholder="Ex: jejum ajudou na fome..." multiline />
                    <Label>O QUE ODEIA OU NÃO CONSEGUE SEGUIR</Label><Inp field="dietHated" placeholder="Ex: não consigo sem carbo à noite..." multiline />
                    <Label>MAIOR DESAFIO NA DIETA *</Label><ChipRow field="biggestChallenge" items={CHALLENGE_LIST} single noneVals={[]} />
                </View>
            )}

            {/* PREFERÊNCIAS */}
            {hasDiet && (
                <View style={[s.card, { backgroundColor:theme.surface, borderColor:theme.border }]}>
                    <View style={s.cardRow}><CardHeader icon="food-apple" title="PREFERÊNCIAS E SUPLEMENTOS" /><SectionStatus fields={['allergies','foodPreferences','foodAversions','supplements']} /></View>
                    <Label>ALERGIAS / INTOLERÂNCIAS *</Label><Inp field="allergies" placeholder='Ex: lactose. Se nenhuma: "Nenhuma".' multiline />
                    <Label>PREFERÊNCIAS ALIMENTARES *</Label><Inp field="foodPreferences" placeholder="Ex: frango com batata doce, ovos..." multiline />
                    <Label>AVERSÕES (O QUE NÃO COME) *</Label><Inp field="foodAversions" placeholder='Ex: fígado. Se come tudo: "Nada".' multiline />
                    <Label>SUPLEMENTOS *</Label><ChipRow field="supplements" items={SUPLEMENTOS_LIST} noneVals={['Nenhum']} />
                    <Label>OBSERVAÇÕES FINAIS PARA O COACH</Label><Inp field="extraNotes" placeholder="Qualquer informação importante..." multiline />
                </View>
            )}
        </>
    );
}

const s = StyleSheet.create({
    card:        { borderRadius:20, borderWidth:1, padding:24, marginBottom:20 },
    cardRow:     { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:20 },
    cardHeader:  { flexDirection:'row', alignItems:'center', gap:10, flex:1 },
    cardTitle:   { fontSize:13, fontWeight:'900', letterSpacing:0.8, flex:1 },
    pill:        { flexDirection:'row', alignItems:'center', gap:4, paddingHorizontal:8, paddingVertical:4, borderRadius:10, borderWidth:1 },
    label:       { fontSize:11, fontWeight:'800', marginBottom:8, marginTop:16, letterSpacing:0.5 },
    input:       { padding:14, borderRadius:14, borderWidth:1, fontSize:14, fontWeight:'600', marginBottom:4 },
    textArea:    { padding:14, borderRadius:14, borderWidth:1, fontSize:14, minHeight:80, textAlignVertical:'top', marginBottom:4 },
    timeBtn:     { flexDirection:'row', alignItems:'center', gap:10, padding:14, borderRadius:14, borderWidth:1, marginBottom:4 },
    timeBtnText: { fontSize:14, fontWeight:'700', flex:1 },
    row:         { flexDirection:'row', gap:12 },
    chipWrap:    { flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:4 },
    chip:        { paddingVertical:9, paddingHorizontal:14, borderRadius:20, borderWidth:1 },
    chipText:    { fontWeight:'700', fontSize:12 },
    circle:      { width:44, height:44, borderRadius:22, alignItems:'center', justifyContent:'center', borderWidth:1 },
    circleText:  { fontWeight:'900', fontSize:13 },
});