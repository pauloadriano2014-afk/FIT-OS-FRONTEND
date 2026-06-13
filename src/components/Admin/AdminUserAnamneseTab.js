// src/components/Admin/AdminUserAnamneseTab.js — VERSÃO 2.1
// Correções:
//   BUG 1 - Bariátrica: boolean real (não string), condição f.bariatric === true
//   BUG 2 - Time picker: modal com steppers HH:MM em todos os campos de horário
//   BUG 3 - Cursor sumindo: useCallback em Inp e set() para evitar re-render
import React, { useState, useEffect, useCallback, memo } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    ActivityIndicator, Alert, Platform, ScrollView, Modal
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// ─── LISTAS ───────────────────────────────────────────────────────────────────
const OBJETIVOS_LIST   = ['Hipertrofia','Emagrecimento','Definição'];
const NIVEIS_LIST      = ['Iniciante','Intermediário','Avançado'];
const FREQUENCIAS_LIST = ['1','2','3','4','5','6','7'];
const TEMPOS_LIST      = ['30','45','60','90','120'];
const MEALS_LIST       = ['2','3','4','5','6','7','8'];
const LIMITACOES_LIST  = ['Joelho','Lombar','Ombro','Punho','Quadril','Tornozelo','Cervical','Cotovelos','Nenhuma'];
const CIRURGIAS_LIST   = ['Abdominoplastia','Prótese de Silicone','Cesárea','LCA/Menisco','Hérnia','Coluna','Manguito','Nenhuma'];
const SUPLEMENTOS_LIST = ['Whey Protein','Creatina','Pré-Treino','BCAA','Multivitamínico','Ômega 3','Hipercalórico','Nenhum'];
const HEALTH_COND      = ['Diabetes Tipo 1','Diabetes Tipo 2','Pré-diabetes','Hipotireoidismo','Hipertireoidismo','Hipertensão','SOP','Resistência à Insulina','Nenhuma'];
const BARI_TYPES       = ['Sleeve (Gastrectomia)','Bypass Gástrico','Banda Gástrica','Balão Intragástrico','Outro'];
const BARI_TIMES       = ['Menos de 6 meses','6 meses a 1 ano','1 a 2 anos','2 a 3 anos','Mais de 3 anos'];
const BARI_INT         = ['Açúcar / Dumping','Gordura','Lactose','Glúten','Carne Vermelha','Alimentos Fibrosos','Nenhuma'];
const MEDS_LIST        = ['Metformina','Levotiroxina','Anticoncepcional','Anti-hipertensivo','Antidepressivo','Corticoide','Nenhum'];
const DIGEST_LIST      = ['Gastrite','Refluxo / DRGE','Intestino Preso','Intestino Solto / SII','Doença de Crohn / Colite','Intolerância à Lactose','Intolerância ao Glúten','Nenhum'];
const SLEEP_H_LIST     = ['Menos de 5h','5 a 6h','6 a 7h','7 a 8h','Mais de 8h'];
const SLEEP_Q_LIST     = ['Ótimo','Bom','Regular','Ruim','Péssimo'];
const CYCLE_LIST       = ['regular','irregular','menopause','hormonal'];
const CYCLE_LBL        = { regular:'Regular (28-32 dias)', irregular:'Irregular', menopause:'Menopausa / Pós-menopausa', hormonal:'Usa anticoncepcional hormonal' };
const PMS_LIST         = ['Compulsão Alimentar Forte','Vontade de Doce','Inchaço / Retenção','Irritabilidade','Cólica Intensa','Fadiga Extrema','Sem Sintomas Significativos'];
const EATS_OUT_LIST    = ['Nunca / Raramente','1 a 2x','3 a 4x','Quase sempre'];
const BUDGET_LIST      = ['econômico','moderado','sem restrição'];
const BUDGET_LBL       = { econômico:'💰 Econômico', moderado:'💳 Moderado', 'sem restrição':'💎 Sem restrição' };
const WATER_LIST       = ['Menos de 1L','1 a 1,5L','1,5 a 2L','2 a 2,5L','Mais de 2,5L'];
const ALCOHOL_LIST     = ['Nunca','Raramente (ocasional)','1 a 2x por semana','Frequente (3x+)'];
const COFFEE_LIST      = ['Nenhum','1 a 2 cafés','3 a 4 cafés','5 ou mais'];
const EAT_SPD_LIST     = ['Muito Rápido','Rápido','Normal','Devagar','Muito Devagar'];
const BINGE_LIST       = ['never','rarely','sometimes','often'];
const BINGE_LBL        = { never:'🟢 Nunca', rarely:'🟡 Raramente', sometimes:'🟠 Às vezes', often:'🔴 Com frequência' };
const TRIED_LIST       = ['Low Carb','Cetogênica / Keto','Jejum Intermitente','Dieta do Índice Glicêmico','Vegana / Vegetariana','Dieta dos Pontos','Dieta Detox','Nenhuma'];
const CHALLENGE_LIST   = ['Ansiedade / Fome Constante','Falta de Tempo para Preparar','Comer Fora de Casa','Consistência e Disciplina','Custo dos Alimentos','Falta de Variedade','Família não Apoia','Outro'];
const PREWORKOUT_LIST  = ['shake_rapido','ceia_pretreino','reforcar_pos'];
const PREWORKOUT_LBL   = { shake_rapido:'🥤 Shake rápido 15-20min antes', ceia_pretreino:'🌙 Ceia pré-treino na noite anterior', reforcar_pos:'⏭️ Pular pré-treino e reforçar pós' };

// ─── BUG 2 FIX: TIME PICKER MODAL ────────────────────────────────────────────
const TimePicker = memo(({ visible, value, onConfirm, onClose, theme, label }) => {
    const parse = (t) => {
        if (!t?.includes(':')) return { h: 6, m: 0 };
        const [h, m] = t.split(':').map(Number);
        return { h: isNaN(h) ? 6 : h, m: isNaN(m) ? 0 : m };
    };
    const [hour, setHour] = useState(6);
    const [min,  setMin]  = useState(0);

    useEffect(() => {
        if (visible) { const p = parse(value); setHour(p.h); setMin(p.m); }
    }, [visible, value]);

    const pad  = (n) => String(n).padStart(2, '0');
    const bg   = theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)';

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={tp.overlay}>
                <View style={[tp.box, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={[tp.header, { borderBottomColor: theme.border }]}>
                        <MaterialCommunityIcons name="clock-outline" size={20} color={theme.accent} />
                        <Text style={[tp.title, { color: theme.text }]}>{label}</Text>
                    </View>
                    <View style={tp.row}>
                        {/* HORAS */}
                        <View style={tp.col}>
                            <TouchableOpacity style={[tp.arrow, { backgroundColor: bg }]} onPress={() => setHour(h => (h + 1) % 24)}>
                                <MaterialCommunityIcons name="chevron-up" size={30} color={theme.accent} />
                            </TouchableOpacity>
                            <View style={[tp.val, { backgroundColor: bg }]}>
                                <Text style={[tp.valText, { color: theme.text }]}>{pad(hour)}</Text>
                            </View>
                            <TouchableOpacity style={[tp.arrow, { backgroundColor: bg }]} onPress={() => setHour(h => (h - 1 + 24) % 24)}>
                                <MaterialCommunityIcons name="chevron-down" size={30} color={theme.accent} />
                            </TouchableOpacity>
                            <Text style={[tp.unit, { color: theme.textSecondary }]}>horas</Text>
                        </View>
                        <Text style={[tp.colon, { color: theme.text }]}>:</Text>
                        {/* MINUTOS — incrementa de 15 em 15 */}
                        <View style={tp.col}>
                            <TouchableOpacity style={[tp.arrow, { backgroundColor: bg }]} onPress={() => setMin(m => (m + 15) % 60)}>
                                <MaterialCommunityIcons name="chevron-up" size={30} color={theme.accent} />
                            </TouchableOpacity>
                            <View style={[tp.val, { backgroundColor: bg }]}>
                                <Text style={[tp.valText, { color: theme.text }]}>{pad(min)}</Text>
                            </View>
                            <TouchableOpacity style={[tp.arrow, { backgroundColor: bg }]} onPress={() => setMin(m => (m - 15 + 60) % 60)}>
                                <MaterialCommunityIcons name="chevron-down" size={30} color={theme.accent} />
                            </TouchableOpacity>
                            <Text style={[tp.unit, { color: theme.textSecondary }]}>minutos</Text>
                        </View>
                    </View>
                    <View style={[tp.preview, { backgroundColor: theme.accent + '18', borderColor: theme.accent + '40' }]}>
                        <Text style={[tp.previewText, { color: theme.accent }]}>{pad(hour)}:{pad(min)}</Text>
                    </View>
                    <View style={tp.btns}>
                        <TouchableOpacity style={[tp.btn, { backgroundColor: bg }]} onPress={onClose}>
                            <Text style={[tp.btnTxt, { color: theme.textSecondary }]}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[tp.btn, { backgroundColor: theme.accent }]} onPress={() => onConfirm(`${pad(hour)}:${pad(min)}`)}>
                            <Text style={[tp.btnTxt, { color: '#000' }]}>Confirmar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
});

const tp = StyleSheet.create({
    overlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 30 },
    box:         { width: '100%', maxWidth: 300, borderRadius: 24, borderWidth: 1, overflow: 'hidden' },
    header:      { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 18, borderBottomWidth: 1 },
    title:       { fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },
    row:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 20, gap: 8 },
    col:         { alignItems: 'center', gap: 8 },
    arrow:       { width: 52, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    val:         { width: 76, height: 66, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    valText:     { fontSize: 34, fontWeight: '900', letterSpacing: -1 },
    unit:        { fontSize: 10, fontWeight: '800', opacity: 0.5 },
    colon:       { fontSize: 34, fontWeight: '900', marginBottom: 24 },
    preview:     { alignSelf: 'center', paddingHorizontal: 22, paddingVertical: 9, borderRadius: 14, borderWidth: 1, marginBottom: 16 },
    previewText: { fontSize: 20, fontWeight: '900', letterSpacing: 2 },
    btns:        { flexDirection: 'row', gap: 10, padding: 16, paddingTop: 0 },
    btn:         { flex: 1, padding: 15, borderRadius: 14, alignItems: 'center' },
    btnTxt:      { fontSize: 13, fontWeight: '900' },
});

// ─── VALIDAÇÃO ────────────────────────────────────────────────────────────────
function validateAnamnese(f, hasDiet, isFeminino) {
    const miss = [];
    if (!f.name?.trim())       miss.push({ section:'Registro',         field:'Nome completo' });
    if (!f.email?.trim())      miss.push({ section:'Registro',         field:'E-mail' });
    if (!f.peso)               miss.push({ section:'Medidas',          field:'Peso' });
    if (!f.altura)             miss.push({ section:'Medidas',          field:'Altura' });
    if (!f.objetivo)           miss.push({ section:'Treino',           field:'Objetivo' });
    if (!f.nivel)              miss.push({ section:'Treino',           field:'Nível' });
    if (!f.frequencia)         miss.push({ section:'Treino',           field:'Frequência semanal' });
    if (!f.tempoDisponivel)    miss.push({ section:'Treino',           field:'Tempo disponível' });
    if (!f.limitacoes?.length) miss.push({ section:'Histórico',        field:'Limitações físicas' });
    if (!f.cirurgias?.length)  miss.push({ section:'Histórico',        field:'Cirurgias prévias' });
    if (hasDiet) {
        if (!f.healthConditions?.length) miss.push({ section:'Saúde Metabólica',  field:'Condições de saúde' });
        // BUG 1 FIX: boolean real
        if (f.bariatric === true && !f.bariatricType) miss.push({ section:'Saúde Metabólica', field:'Tipo da bariátrica' });
        if (f.bariatric === true && !f.bariatricTime) miss.push({ section:'Saúde Metabólica', field:'Tempo pós-bariátrica' });
        if (!f.medications?.length) miss.push({ section:'Saúde Metabólica',       field:'Medicamentos' });
        if (!f.digestiveIssues?.length) miss.push({ section:'Digestivo & Sono',   field:'Problemas digestivos' });
        if (!f.sleepHours)   miss.push({ section:'Digestivo & Sono',              field:'Horas de sono' });
        if (!f.sleepQuality) miss.push({ section:'Digestivo & Sono',              field:'Qualidade do sono' });
        if (!f.stressLevel)  miss.push({ section:'Digestivo & Sono',              field:'Nível de stress' });
        if (isFeminino && !f.cycleRegular)        miss.push({ section:'Ciclo Menstrual', field:'Regularidade do ciclo' });
        if (isFeminino && !f.pmsSymptoms?.length) miss.push({ section:'Ciclo Menstrual', field:'Sintomas de TPM' });
        if (!f.mealsPerDay)    miss.push({ section:'Rotina Alimentar',            field:'Refeições por dia' });
        if (!f.wakeUpTime)     miss.push({ section:'Rotina Alimentar',            field:'Hora que acorda' });
        if (!f.sleepTime)      miss.push({ section:'Rotina Alimentar',            field:'Hora que dorme' });
        if (!f.trainTime)      miss.push({ section:'Rotina Alimentar',            field:'Horário do treino' });
        if (!f.eatsOutPerWeek) miss.push({ section:'Rotina Alimentar',            field:'Refeições fora/semana' });
        if (!f.budget)         miss.push({ section:'Rotina Alimentar',            field:'Orçamento alimentar' });
        if (!f.waterIntake)    miss.push({ section:'Hábitos',                     field:'Ingestão de água' });
        if (!f.alcoholFreq)    miss.push({ section:'Hábitos',                     field:'Frequência de álcool' });
        if (!f.eatSpeed)       miss.push({ section:'Hábitos',                     field:'Velocidade ao comer' });
        if (!f.nightBinge)     miss.push({ section:'Hábitos',                     field:'Compulsão noturna' });
        if (!f.biggestChallenge) miss.push({ section:'Histórico de Dietas',       field:'Maior desafio' });
        if (!f.allergies?.trim())       miss.push({ section:'Preferências',       field:'Alergias / intolerâncias' });
        if (!f.foodPreferences?.trim()) miss.push({ section:'Preferências',       field:'Preferências alimentares' });
        if (!f.foodAversions?.trim())   miss.push({ section:'Preferências',       field:'Aversões alimentares' });
        if (!f.supplements?.length)     miss.push({ section:'Preferências',       field:'Suplementos' });
    }
    return miss;
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export default function AdminUserAnamneseTab({ theme, aluno, userPlan }) {
    const [loading, setLoading]           = useState(true);
    const [saving,  setSaving]            = useState(false);
    const [missingModal, setMissingModal] = useState(false);
    const [missingFields, setMissingFields] = useState([]);
    const [timePicker, setTimePicker]     = useState({ visible: false, field: '', label: '' });

    const hasDiet    = !!aluno?.dietModule;
    const isFeminino = aluno?.gender === 'Feminino';

    // ── ESTADO DO FORM ────────────────────────────────────────────────────────
    const [f, setF] = useState({
        name:'', email:'', phone:'', gender:'', birthDate:'',
        peso:'', altura:'',
        objetivo:'', nivel:'', frequencia:'', tempoDisponivel:'', trainFasted:'',
        limitacoes:[], cirurgias:[], equipamentos:'',
        healthConditions:[], healthConditionsObs:'',
        // BUG 1 FIX: boolean, não string
        bariatric: false,
        bariatricType:'', bariatricTime:'', bariatricIntolerances:[],
        medications:[], medicationsObs:'',
        digestiveIssues:[], digestiveObs:'',
        sleepHours:'', sleepQuality:'', wakeHungry:'', stressLevel:'', stressEating:'',
        cycleRegular:'', pmsSymptoms:[], pmsObs:'',
        mealsPerDay:'', wakeUpTime:'', sleepTime:'',
        workTimeStart:'', workTimeEnd:'', trainTime:'',
        eatsOutPerWeek:'', budget:'', preworkoutStrategy:'',
        waterIntake:'', alcoholFreq:'', coffeePerDay:'', smoker:'', eatSpeed:'', nightBinge:'',
        triedDiets:[], dietWorked:'', dietHated:'', biggestChallenge:'',
        allergies:'', foodPreferences:'', foodAversions:'', supplements:[], extraNotes:'',
    });

    // BUG 3 FIX: useCallback impede recriar set() a cada render
    const set = useCallback((field, value) => {
        setF(prev => ({ ...prev, [field]: value }));
    }, []);

    const toggleMulti = useCallback((field, item, noneVals=['Nenhuma','Nenhum']) => {
        setF(prev => {
            const list = prev[field] || [];
            if (list.includes(item)) return { ...prev, [field]: list.filter(i => i !== item) };
            if (noneVals.includes(item)) return { ...prev, [field]: [item] };
            return { ...prev, [field]: [...list.filter(i => !noneVals.includes(i)), item] };
        });
    }, []);

    // ── FETCH ─────────────────────────────────────────────────────────────────
    useEffect(() => { fetchData(); }, [aluno?.id]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const resUser = await fetch(`https://fitos-final.onrender.com/api/admin/user?userId=${aluno.id}&t=${Date.now()}`);
            if (resUser.ok) {
                const u = await resUser.json();
                setF(prev => ({ ...prev, name:u?.name||'', email:u?.email||'', phone:u?.phone||'', gender:u?.gender||'', birthDate:u?.birthDate||'' }));
            }
            const resA = await fetch(`https://fitos-final.onrender.com/api/anamnese?userId=${aluno.id}`);
            if (resA.ok) {
                const d = await resA.json();
                if (d?.id) setF(prev => ({
                    ...prev,
                    peso:String(d.peso||''), altura:String(d.altura||''),
                    objetivo:d.objetivo||'', nivel:d.nivel||'',
                    frequencia:d.frequencia?String(d.frequencia):'',
                    tempoDisponivel:d.tempoDisponivel?String(d.tempoDisponivel):'',
                    trainFasted:d.trainFasted===true?'yes':d.trainFasted===false?'no':'',
                    limitacoes:Array.isArray(d.limitacoes)?d.limitacoes:[],
                    cirurgias:Array.isArray(d.cirurgias)?d.cirurgias:[],
                    equipamentos:Array.isArray(d.equipamentos)?d.equipamentos.join(', '):(d.equipamentos||''),
                    healthConditions:Array.isArray(d.healthConditions)?d.healthConditions:[],
                    healthConditionsObs:d.healthConditionsObs||'',
                    // BUG 1 FIX: carrega como boolean real
                    bariatric: d.bariatric === true,
                    bariatricType:d.bariatricType||'', bariatricTime:d.bariatricTime||'',
                    bariatricIntolerances:Array.isArray(d.bariatricIntolerances)?d.bariatricIntolerances:[],
                    medications:Array.isArray(d.medications)?d.medications:[],
                    medicationsObs:d.medicationsObs||'',
                    digestiveIssues:Array.isArray(d.digestiveIssues)?d.digestiveIssues:[],
                    digestiveObs:d.digestiveObs||'',
                    sleepHours:d.sleepHours||'', sleepQuality:d.sleepQuality||'',
                    wakeHungry:d.wakeHungry===true?'yes':d.wakeHungry===false?'no':'',
                    stressLevel:d.stressLevel?String(d.stressLevel):'',
                    stressEating:d.stressEating===true?'yes':d.stressEating===false?'no':'',
                    cycleRegular:d.cycleRegular||'',
                    pmsSymptoms:Array.isArray(d.pmsSymptoms)?d.pmsSymptoms:[],
                    pmsObs:d.pmsObs||'',
                    mealsPerDay:d.mealsPerDay?String(d.mealsPerDay):'',
                    wakeUpTime:d.wakeUpTime||'', sleepTime:d.sleepTime||'',
                    workTimeStart:d.workTime?d.workTime.split(' às ')[0]:'',
                    workTimeEnd:d.workTime?d.workTime.split(' às ')[1]:'',
                    trainTime:d.trainTime||'',
                    eatsOutPerWeek:d.eatsOutPerWeek||'', budget:d.budget||'',
                    preworkoutStrategy:d.preworkoutStrategy||'',
                    waterIntake:d.waterIntake||'', alcoholFreq:d.alcoholFreq||'',
                    coffeePerDay:d.coffeePerDay||'',
                    smoker:d.smoker===true?'yes':d.smoker===false?'no':'',
                    eatSpeed:d.eatSpeed||'', nightBinge:d.nightBinge||'',
                    triedDiets:Array.isArray(d.triedDiets)?d.triedDiets:[],
                    dietWorked:d.dietWorked||'', dietHated:d.dietHated||'',
                    biggestChallenge:d.biggestChallenge||'',
                    allergies:d.allergies||'', foodPreferences:d.foodPreferences||'',
                    foodAversions:d.foodAversions||'',
                    supplements:d.supplements?(Array.isArray(d.supplements)?d.supplements:d.supplements.split(', ').filter(Boolean)):[],
                    extraNotes:d.extraNotes||'',
                }));
            }
        } catch(e){ console.log('Erro anamnese:',e); }
        finally { setLoading(false); }
    };

    // ── SALVAR ────────────────────────────────────────────────────────────────
    const handleSave = async () => {
        const miss = validateAnamnese(f, hasDiet, isFeminino);
        if (miss.length > 0) { setMissingFields(miss); setMissingModal(true); return; }
        try {
            setSaving(true);
            await fetch('https://fitos-final.onrender.com/api/admin/user', {
                method:'PUT', headers:{'Content-Type':'application/json'},
                body:JSON.stringify({ id:aluno.id, name:f.name.trim(), email:f.email.trim().toLowerCase(), phone:f.phone, gender:f.gender, birthDate:f.birthDate?.length===10?f.birthDate:undefined }),
            });
            const res = await fetch('https://fitos-final.onrender.com/api/anamnese', {
                method:'POST', headers:{'Content-Type':'application/json'},
                body:JSON.stringify({
                    userId:aluno.id,
                    peso:f.peso.replace(',','.'), altura:f.altura.replace(',','.'),
                    objetivo:f.objetivo, nivel:f.nivel,
                    frequencia:parseInt(f.frequencia)||3,
                    tempoDisponivel:parseInt(f.tempoDisponivel)||60,
                    limitacoes:f.limitacoes, cirurgias:f.cirurgias,
                    equipamentos:f.equipamentos?f.equipamentos.split(',').map(i=>i.trim()).filter(Boolean):[],
                    ...(hasDiet && {
                        trainFasted:f.trainFasted==='yes',
                        healthConditions:f.healthConditions, healthConditionsObs:f.healthConditionsObs.trim(),
                        // BUG 1 FIX: salva boolean real
                        bariatric:f.bariatric===true,
                        bariatricType:f.bariatric===true?f.bariatricType:null,
                        bariatricTime:f.bariatric===true?f.bariatricTime:null,
                        bariatricIntolerances:f.bariatric===true?f.bariatricIntolerances:[],
                        medications:f.medications, medicationsObs:f.medicationsObs.trim(),
                        digestiveIssues:f.digestiveIssues, digestiveObs:f.digestiveObs.trim(),
                        sleepHours:f.sleepHours, sleepQuality:f.sleepQuality,
                        wakeHungry:f.wakeHungry==='yes',
                        stressLevel:parseInt(f.stressLevel)||null, stressEating:f.stressEating==='yes',
                        ...(isFeminino&&{cycleRegular:f.cycleRegular, pmsSymptoms:f.pmsSymptoms, pmsObs:f.pmsObs.trim()}),
                        mealsPerDay:parseInt(f.mealsPerDay)||null,
                        wakeUpTime:f.wakeUpTime, sleepTime:f.sleepTime,
                        workTime:f.workTimeStart&&f.workTimeEnd?`${f.workTimeStart} às ${f.workTimeEnd}`:'',
                        trainTime:f.trainTime, eatsOutPerWeek:f.eatsOutPerWeek, budget:f.budget,
                        preworkoutStrategy:f.preworkoutStrategy||null,
                        waterIntake:f.waterIntake, alcoholFreq:f.alcoholFreq, coffeePerDay:f.coffeePerDay,
                        smoker:f.smoker==='yes', eatSpeed:f.eatSpeed, nightBinge:f.nightBinge,
                        triedDiets:f.triedDiets, dietWorked:f.dietWorked.trim(), dietHated:f.dietHated.trim(),
                        biggestChallenge:f.biggestChallenge,
                        allergies:f.allergies.trim(), foodPreferences:f.foodPreferences.trim(),
                        foodAversions:f.foodAversions.trim(),
                        supplements:f.supplements.join(', '), extraNotes:f.extraNotes.trim(),
                    }),
                }),
            });
            if (res.ok) {
                const msg = 'Cadastro e anamnese salvos!';
                if (Platform.OS==='web') window.alert(msg); else Alert.alert('Sucesso ✅', msg);
            } else throw new Error('Falha ao salvar.');
        } catch(e) {
            if (Platform.OS==='web') window.alert(e.message); else Alert.alert('Erro', e.message);
        } finally { setSaving(false); }
    };

    // ── COMPONENTES INTERNOS ──────────────────────────────────────────────────
    const softBg = theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';

    // BUG 3 FIX: useCallback em todos os componentes internos
    const Label = useCallback(({ children }) => (
        <Text style={[s.label, { color: theme.textSecondary }]}>{children}</Text>
    ), [theme]);

    // BUG 3 FIX: Inp memoizado — não recria ao digitar
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

    // BUG 2 FIX: TimeField abre time picker
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
                <TouchableOpacity onPress={() => set(field, '')} hitSlop={{top:8,bottom:8,left:8,right:8}}>
                    <MaterialCommunityIcons name="close-circle" size={16} color={theme.textSecondary} />
                </TouchableOpacity>
            )}
        </TouchableOpacity>
    ), [f, set, theme]);

    const ChipRow = useCallback(({ field, items, labels={}, noneVals=['Nenhuma','Nenhum'], single=false }) => (
        <View style={s.chipWrap}>
            {items.map(item => {
                const active = single ? f[field]===item : (f[field]||[]).includes(item);
                return (
                    <TouchableOpacity key={item}
                        style={[s.chip, {backgroundColor:theme.bg, borderColor:theme.border}, active&&{backgroundColor:theme.accent, borderColor:theme.accent}]}
                        onPress={() => single ? set(field, f[field]===item?'':item) : toggleMulti(field, item, noneVals)}
                    >
                        <Text style={[s.chipText, {color:theme.textSecondary}, active&&{color:theme.isDark?'#000':'#FFF'}]}>
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
                        style={[s.circle, {backgroundColor:theme.bg, borderColor:theme.border}, active&&{backgroundColor:theme.accent, borderColor:theme.accent}]}
                        onPress={() => set(field, f[field]===item?'':item)}
                    >
                        <Text style={[s.circleText, {color:theme.text}, active&&{color:theme.isDark?'#000':'#FFF'}]}>{item}{suffix}</Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    ), [f, set, theme]);

    const BoolPair = useCallback(({ field, labelYes='Sim', labelNo='Não' }) => (
        <View style={[s.chipWrap]}>
            {[{v:'yes',l:labelYes},{v:'no',l:labelNo}].map(({v,l}) => {
                const active = f[field]===v;
                return (
                    <TouchableOpacity key={v}
                        style={[s.chip, {flex:1, backgroundColor:theme.bg, borderColor:theme.border}, active&&{backgroundColor:theme.accent, borderColor:theme.accent}]}
                        onPress={() => set(field, f[field]===v?'':v)}
                    >
                        <Text style={[s.chipText, {textAlign:'center', color:theme.textSecondary}, active&&{color:theme.isDark?'#000':'#FFF'}]}>{l}</Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    ), [f, set, theme]);

    // BUG 1 FIX: BoolBariatric usa boolean real
    const BoolBariatric = useCallback(() => (
        <View style={s.chipWrap}>
            {[{v:true, l:'✅ Sim'},{v:false, l:'❌ Não'}].map(({v,l}) => {
                const active = f.bariatric === v;
                return (
                    <TouchableOpacity key={String(v)}
                        style={[s.chip, {flex:1, backgroundColor:theme.bg, borderColor:theme.border}, active&&{backgroundColor:theme.accent, borderColor:theme.accent}]}
                        onPress={() => set('bariatric', v)}
                    >
                        <Text style={[s.chipText, {textAlign:'center', color:theme.textSecondary}, active&&{color:theme.isDark?'#000':'#FFF'}]}>{l}</Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    ), [f, set, theme]);

    const SectionStatus = useCallback(({ fields }) => {
        const empty = fields.filter(k => { const v=f[k]; return Array.isArray(v)?v.length===0:!v; }).length;
        if (empty===0) return (
            <View style={[s.pill, {backgroundColor:'#34C75915', borderColor:'#34C75940'}]}>
                <MaterialCommunityIcons name="check-circle" size={12} color="#34C759" />
                <Text style={{fontSize:10, fontWeight:'800', color:'#34C759'}}>COMPLETO</Text>
            </View>
        );
        return (
            <View style={[s.pill, {backgroundColor:'#FF950015', borderColor:'#FF950040'}]}>
                <MaterialCommunityIcons name="alert-circle" size={12} color="#FF9500" />
                <Text style={{fontSize:10, fontWeight:'800', color:'#FF9500'}}>{empty} CAMPO(S)</Text>
            </View>
        );
    }, [f]);

    const CardHeader = useCallback(({ icon, title }) => (
        <View style={[s.cardHeader, {borderBottomColor:theme.border}]}>
            <MaterialCommunityIcons name={icon} size={20} color={theme.accent} />
            <Text style={[s.cardTitle, {color:theme.text}]}>{title}</Text>
        </View>
    ), [theme]);

    if (loading) return (
        <View style={{flex:1, justifyContent:'center', alignItems:'center', padding:50}}>
            <ActivityIndicator size="large" color={theme.accent} />
            <Text style={{color:theme.textSecondary, marginTop:15, fontWeight:'bold'}}>Carregando ficha clínica...</Text>
        </View>
    );

    return (
        <View style={s.container}>
            {/* TIME PICKER */}
            <TimePicker
                visible={timePicker.visible}
                value={f[timePicker.field]}
                label={timePicker.label}
                theme={theme}
                onClose={() => setTimePicker(p => ({...p, visible:false}))}
                onConfirm={time => { set(timePicker.field, time); setTimePicker(p => ({...p, visible:false})); }}
            />

            {/* REGISTRO */}
            <View style={[s.card, {backgroundColor:theme.surface, borderColor:theme.border}]}>
                <View style={s.cardRow}><CardHeader icon="account-details" title="REGISTRO DO ALUNO" /><SectionStatus fields={['name','email']} /></View>
                <Label>NOME COMPLETO *</Label><Inp field="name" placeholder="Como quer ser chamado?" />
                <Label>E-MAIL DE ACESSO *</Label><Inp field="email" placeholder="exemplo@email.com" keyboardType="email-address" />
                <View style={s.row}>
                    <View style={{flex:1}}>
                        <Label>NASCIMENTO</Label>
                        <TextInput style={[s.input,{backgroundColor:theme.bg,color:theme.text,borderColor:theme.border}]}
                            value={f.birthDate} onChangeText={v=>{let x=v.replace(/\D/g,'');if(x.length>2)x=x.slice(0,2)+'/'+x.slice(2);if(x.length>5)x=x.slice(0,5)+'/'+x.slice(5,9);set('birthDate',x);}}
                            keyboardType="numeric" maxLength={10} placeholder="DD/MM/AAAA" placeholderTextColor={theme.textSecondary}/>
                    </View>
                    <View style={{flex:1}}>
                        <Label>WHATSAPP</Label>
                        <TextInput style={[s.input,{backgroundColor:theme.bg,color:theme.text,borderColor:theme.border}]}
                            value={f.phone} onChangeText={v=>{let x=v.replace(/\D/g,'');if(x.length>2)x='('+x.slice(0,2)+') '+x.slice(2);if(x.length>9)x=x.slice(0,10)+'-'+x.slice(10,14);set('phone',x);}}
                            keyboardType="phone-pad" maxLength={15} placeholder="(00) 00000-0000" placeholderTextColor={theme.textSecondary}/>
                    </View>
                </View>
                <Label>GÊNERO BIOLÓGICO</Label>
                <ChipRow field="gender" items={['Masculino','Feminino']} single noneVals={[]} />
            </View>

            {/* MEDIDAS + TREINO */}
            <View style={[s.card, {backgroundColor:theme.surface, borderColor:theme.border}]}>
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
            <View style={[s.card, {backgroundColor:theme.surface, borderColor:theme.border}]}>
                <View style={s.cardRow}><CardHeader icon="hospital-box" title="MAPEAMENTO DE DORES E HISTÓRICO" /><SectionStatus fields={['limitacoes','cirurgias']} /></View>
                <Label>LIMITAÇÕES FÍSICAS *</Label><ChipRow field="limitacoes" items={LIMITACOES_LIST} />
                <Label>CIRURGIAS PRÉVIAS *</Label><ChipRow field="cirurgias" items={CIRURGIAS_LIST} />
                <Label>LOCAL DE TREINO / EQUIPAMENTOS</Label><Inp field="equipamentos" placeholder="Ex: Academia completa..." />
            </View>

            {/* SAÚDE METABÓLICA */}
            {hasDiet && (
                <View style={[s.card, {backgroundColor:theme.surface, borderColor:theme.border}]}>
                    <View style={s.cardRow}><CardHeader icon="heart-pulse" title="SAÚDE METABÓLICA" /><SectionStatus fields={['healthConditions','medications']} /></View>
                    <Label>CONDIÇÕES DE SAÚDE *</Label><ChipRow field="healthConditions" items={HEALTH_COND} />
                    <Inp field="healthConditionsObs" placeholder="Observações adicionais (opcional)..." multiline />
                    <Label>JÁ FEZ BARIÁTRICA?</Label>
                    {/* BUG 1 FIX */}
                    <BoolBariatric />
                    {f.bariatric === true && <>
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
                <View style={[s.card, {backgroundColor:theme.surface, borderColor:theme.border}]}>
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
                <View style={[s.card, {backgroundColor:theme.surface, borderColor:theme.border}]}>
                    <View style={s.cardRow}><CardHeader icon="calendar-heart" title="CICLO MENSTRUAL" /><SectionStatus fields={['cycleRegular','pmsSymptoms']} /></View>
                    <Label>REGULARIDADE DO CICLO *</Label><ChipRow field="cycleRegular" items={CYCLE_LIST} single noneVals={[]} labels={CYCLE_LBL} />
                    <Label>SINTOMAS DE TPM *</Label><ChipRow field="pmsSymptoms" items={PMS_LIST} noneVals={['Sem Sintomas Significativos']} />
                    <Inp field="pmsObs" placeholder="Observações sobre o ciclo (opcional)..." multiline />
                </View>
            )}

            {/* ROTINA ALIMENTAR */}
            {hasDiet && (
                <View style={[s.card, {backgroundColor:theme.surface, borderColor:theme.border}]}>
                    <View style={s.cardRow}><CardHeader icon="clock-outline" title="ROTINA ALIMENTAR" /><SectionStatus fields={['mealsPerDay','wakeUpTime','sleepTime','trainTime','eatsOutPerWeek','budget']} /></View>
                    <Label>REFEIÇÕES POR DIA *</Label><CircleRow field="mealsPerDay" items={MEALS_LIST} suffix="x" />
                    {/* BUG 2 FIX: Time pickers */}
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
                <View style={[s.card, {backgroundColor:theme.surface, borderColor:theme.border}]}>
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
                <View style={[s.card, {backgroundColor:theme.surface, borderColor:theme.border}]}>
                    <View style={s.cardRow}><CardHeader icon="history" title="HISTÓRICO DE DIETAS" /><SectionStatus fields={['biggestChallenge']} /></View>
                    <Label>DIETAS JÁ TENTADAS</Label><ChipRow field="triedDiets" items={TRIED_LIST} noneVals={['Nenhuma']} />
                    <Label>O QUE JÁ FUNCIONOU</Label><Inp field="dietWorked" placeholder="Ex: jejum ajudou na fome..." multiline />
                    <Label>O QUE ODEIA OU NÃO CONSEGUE SEGUIR</Label><Inp field="dietHated" placeholder="Ex: não consigo sem carbo à noite..." multiline />
                    <Label>MAIOR DESAFIO NA DIETA *</Label><ChipRow field="biggestChallenge" items={CHALLENGE_LIST} single noneVals={[]} />
                </View>
            )}

            {/* PREFERÊNCIAS */}
            {hasDiet && (
                <View style={[s.card, {backgroundColor:theme.surface, borderColor:theme.border}]}>
                    <View style={s.cardRow}><CardHeader icon="food-apple" title="PREFERÊNCIAS E SUPLEMENTOS" /><SectionStatus fields={['allergies','foodPreferences','foodAversions','supplements']} /></View>
                    <Label>ALERGIAS / INTOLERÂNCIAS *</Label><Inp field="allergies" placeholder='Ex: lactose. Se nenhuma: "Nenhuma".' multiline />
                    <Label>PREFERÊNCIAS ALIMENTARES *</Label><Inp field="foodPreferences" placeholder="Ex: frango com batata doce, ovos..." multiline />
                    <Label>AVERSÕES (O QUE NÃO COME) *</Label><Inp field="foodAversions" placeholder='Ex: fígado. Se come tudo: "Nada".' multiline />
                    <Label>SUPLEMENTOS *</Label><ChipRow field="supplements" items={SUPLEMENTOS_LIST} noneVals={['Nenhum']} />
                    <Label>OBSERVAÇÕES FINAIS PARA O COACH</Label><Inp field="extraNotes" placeholder="Qualquer informação importante..." multiline />
                </View>
            )}

            {/* SALVAR */}
            <TouchableOpacity style={[s.saveBtn, {backgroundColor:theme.accent, opacity:saving?0.7:1}]} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator size="small" color="#000" /> : (
                    <><MaterialCommunityIcons name="content-save-check" size={24} color="#000" />
                    <Text style={[s.saveBtnText, {color:'#000'}]}>SALVAR REGISTRO E ANAMNESE</Text></>
                )}
            </TouchableOpacity>

            {/* MODAL CAMPOS FALTANDO */}
            <Modal visible={missingModal} transparent animationType="fade" onRequestClose={() => setMissingModal(false)}>
                <View style={s.modalOverlay}>
                    <View style={[s.modalBox, {backgroundColor:theme.surface, borderColor:theme.border}]}>
                        <View style={[s.modalHeader, {borderBottomColor:theme.border}]}>
                            <MaterialCommunityIcons name="alert-circle" size={24} color="#FF9500" />
                            <Text style={[s.modalTitle, {color:theme.text}]}>CAMPOS INCOMPLETOS</Text>
                            <TouchableOpacity onPress={() => setMissingModal(false)} style={[s.closeBtn, {backgroundColor:softBg}]}>
                                <MaterialCommunityIcons name="close" size={18} color={theme.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        <Text style={[s.modalSub, {color:theme.textSecondary}]}>Preencha os campos abaixo antes de salvar:</Text>
                        <ScrollView style={{maxHeight:320}} showsVerticalScrollIndicator={false}>
                            {Array.from(new Set(missingFields.map(m=>m.section))).map(sec => (
                                <View key={sec} style={[s.missBlock, {borderColor:theme.border}]}>
                                    <Text style={[s.missSec, {color:theme.accent}]}>{sec}</Text>
                                    {missingFields.filter(m=>m.section===sec).map((m,i) => (
                                        <View key={i} style={s.missRow}>
                                            <MaterialCommunityIcons name="circle-small" size={20} color="#FF9500" />
                                            <Text style={[s.missText, {color:theme.text}]}>{m.field}</Text>
                                        </View>
                                    ))}
                                </View>
                            ))}
                        </ScrollView>
                        <TouchableOpacity style={[s.modalBtn, {backgroundColor:theme.accent, marginTop:20}]} onPress={() => setMissingModal(false)}>
                            <Text style={{color:'#000', fontWeight:'900', fontSize:14}}>ENTENDI, VOU PREENCHER</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const s = StyleSheet.create({
    container:   { width:'100%', paddingBottom:40 },
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
    saveBtn:     { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:12, padding:20, borderRadius:16, marginTop:10, elevation:4 },
    saveBtnText: { fontSize:15, fontWeight:'900', letterSpacing:1 },
    modalOverlay:{ flex:1, backgroundColor:'rgba(0,0,0,0.65)', justifyContent:'center', alignItems:'center', padding:20 },
    modalBox:    { width:'100%', maxWidth:440, borderRadius:24, borderWidth:1, overflow:'hidden' },
    modalHeader: { flexDirection:'row', alignItems:'center', gap:10, padding:20, borderBottomWidth:1 },
    modalTitle:  { fontSize:15, fontWeight:'900', letterSpacing:0.5, flex:1 },
    closeBtn:    { width:32, height:32, borderRadius:16, alignItems:'center', justifyContent:'center' },
    modalSub:    { fontSize:13, lineHeight:20, paddingHorizontal:20, paddingVertical:12 },
    missBlock:   { marginHorizontal:20, marginBottom:12, padding:12, borderRadius:12, borderWidth:1 },
    missSec:     { fontSize:11, fontWeight:'900', letterSpacing:0.8, marginBottom:8 },
    missRow:     { flexDirection:'row', alignItems:'center', marginBottom:4 },
    missText:    { fontSize:13, fontWeight:'600' },
    modalBtn:    { marginHorizontal:20, marginBottom:20, padding:16, borderRadius:14, alignItems:'center' },
});