// src/Anamnese/useAdminAnamneseForm.js
// Hook de estado para o AdminUserAnamneseTab
import { useState, useEffect, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import { authHeaders } from '../utils/authToken';

// ─── LISTAS (MANTIDAS INTACTAS PARA O MOTOR LEGADO E UI) ──────────────────────
export const OBJETIVOS_LIST   = ['Hipertrofia','Emagrecimento','Definição'];
export const NIVEIS_LIST      = ['Iniciante','Intermediário','Avançado'];
export const FREQUENCIAS_LIST = ['1','2','3','4','5','6','7'];
export const TEMPOS_LIST      = ['30','45','60','90','120'];
export const MEALS_LIST       = ['2','3','4','5','6','7','8'];
export const LIMITACOES_LIST  = ['Joelho','Lombar','Ombro','Punho','Quadril','Tornozelo','Cervical','Cotovelos','Nenhuma'];
export const CIRURGIAS_LIST   = ['Abdominoplastia','Prótese de Silicone','Cesárea','LCA/Menisco','Hérnia','Coluna','Manguito','Nenhuma'];
export const SUPLEMENTOS_LIST = ['Whey Protein','Creatina','Pré-Treino','BCAA','Multivitamínico','Ômega 3','Hipercalórico','Nenhum'];
export const HEALTH_COND      = ['Diabetes Tipo 1','Diabetes Tipo 2','Pré-diabetes','Hipotireoidismo','Hipertireoidismo','Hipertensão','SOP','Resistência à Insulina','Nenhuma'];
export const BARI_TYPES       = ['Sleeve (Gastrectomia)','Bypass Gástrico','Banda Gástrica','Balão Intragástrico','Outro'];
export const BARI_TIMES       = ['Menos de 6 meses','6 meses a 1 ano','1 a 2 anos','2 a 3 anos','Mais de 3 anos'];
export const BARI_INT         = ['Açúcar / Dumping','Gordura','Lactose','Glúten','Carne Vermelha','Alimentos Fibrosos','Nenhuma'];
export const MEDS_LIST        = ['Metformina','Levotiroxina','Anticoncepcional','Anti-hipertensivo','Antidepressivo','Corticoide','Nenhum'];
export const DIGEST_LIST      = ['Gastrite','Refluxo / DRGE','Intestino Preso','Intestino Solto / SII','Doença de Crohn / Colite','Intolerância à Lactose','Intolerância ao Glúten','Nenhum'];
export const SLEEP_H_LIST     = ['Menos de 5h','5 a 6h','6 a 7h','7 a 8h','Mais de 8h'];
export const SLEEP_Q_LIST     = ['Ótimo','Bom','Regular','Ruim','Péssimo'];
export const CYCLE_LIST       = ['regular','irregular','menopause','hormonal'];
export const CYCLE_LBL        = { regular:'Regular (28-32 dias)', irregular:'Irregular', menopause:'Menopausa / Pós-menopausa', hormonal:'Usa anticoncepcional hormonal' };
export const PMS_LIST         = ['Compulsão Alimentar Forte','Vontade de Doce','Inchaço / Retenção','Irritabilidade','Cólica Intensa','Fadiga Extrema','Sem Sintomas Significativos'];
export const EATS_OUT_LIST    = ['Nunca / Raramente','1 a 2x','3 a 4x','Quase sempre'];
export const BUDGET_LIST      = ['econômico','moderado','sem restrição'];
export const BUDGET_LBL       = { econômico:'💰 Econômico', moderado:'💳 Moderado', 'sem restrição':'💎 Sem restrição' };
export const WATER_LIST       = ['Menos de 1L','1 a 1,5L','1,5 a 2L','2 a 2,5L','Mais de 2,5L'];
export const ALCOHOL_LIST     = ['Nunca','Raramente (ocasional)','1 a 2x por semana','Frequente (3x+)'];
export const COFFEE_LIST      = ['Nenhum','1 a 2 cafés','3 a 4 cafés','5 ou mais'];
export const EAT_SPD_LIST     = ['Muito Rápido','Rápido','Normal','Devagar','Muito Devagar'];
export const BINGE_LIST       = ['never','rarely','sometimes','often'];
export const BINGE_LBL        = { never:'🟢 Nunca', rarely:'🟡 Raramente', sometimes:'🟠 Às vezes', often:'🔴 Com frequência' };
export const TRIED_LIST       = ['Low Carb','Cetogênica / Keto','Jejum Intermitente','Dieta do Índice Glicêmico','Vegana / Vegetariana','Dieta dos Pontos','Dieta Detox','Nenhuma'];
export const CHALLENGE_LIST   = ['Ansiedade / Fome Constante','Falta de Tempo para Preparar','Comer Fora de Casa','Consistência e Disciplina','Custo dos Alimentos','Falta de Variedade','Família não Apoia','Outro'];
export const PREWORKOUT_LIST  = ['shake_rapido','ceia_pretreino','reforcar_pos'];
export const PREWORKOUT_LBL   = { shake_rapido:'🥤 Shake rápido 15-20min antes', ceia_pretreino:'🌙 Ceia pré-treino na noite anterior', reforcar_pos:'⏭️ Pular pré-treino e reforçar pós' };
export const DAYS_OF_WEEK     = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo', 'Nenhum'];

// ─── VALIDAÇÃO LEGADA ─────────────────────────────────────────────────────────
export function validateAnamnese(f, hasDiet, isFeminino) {
    const miss = [];
    if (!f.name?.trim())       miss.push({ section:'Registro',        field:'Nome completo' });
    if (!f.email?.trim())      miss.push({ section:'Registro',        field:'E-mail' });
    if (!f.peso)               miss.push({ section:'Medidas',         field:'Peso' });
    if (!f.altura)             miss.push({ section:'Medidas',         field:'Altura' });
    if (!f.objetivo)           miss.push({ section:'Treino',          field:'Objetivo' });
    if (!f.nivel)              miss.push({ section:'Treino',          field:'Nível' });
    if (!f.frequencia)         miss.push({ section:'Treino',          field:'Frequência semanal' });
    if (!f.tempoDisponivel)    miss.push({ section:'Treino',          field:'Tempo disponível' });
    if (!f.limitacoes?.length) miss.push({ section:'Histórico',       field:'Limitações físicas' });
    if (!f.cirurgias?.length)  miss.push({ section:'Histórico',       field:'Cirurgias prévias' });
    if (hasDiet) {
        if (!f.healthConditions?.length) miss.push({ section:'Saúde Metabólica', field:'Condições de saúde' });
        if (f.bariatric === true && !f.bariatricType) miss.push({ section:'Saúde Metabólica', field:'Tipo da bariátrica' });
        if (f.bariatric === true && !f.bariatricTime) miss.push({ section:'Saúde Metabólica', field:'Tempo pós-bariátrica' });
        if (!f.medications?.length)     miss.push({ section:'Saúde Metabólica', field:'Medicamentos' });
        if (!f.digestiveIssues?.length) miss.push({ section:'Digestivo & Sono', field:'Problemas digestivos' });
        if (!f.sleepHours)   miss.push({ section:'Digestivo & Sono', field:'Horas de sono' });
        if (!f.sleepQuality) miss.push({ section:'Digestivo & Sono', field:'Qualidade do sono' });
        if (!f.stressLevel)  miss.push({ section:'Digestivo & Sono', field:'Nível de stress' });
        if (isFeminino && !f.cycleRegular)        miss.push({ section:'Ciclo Menstrual', field:'Regularidade do ciclo' });
        if (isFeminino && !f.pmsSymptoms?.length) miss.push({ section:'Ciclo Menstrual', field:'Sintomas de TPM' });
        if (!f.mealsPerDay)    miss.push({ section:'Rotina Alimentar', field:'Refeições por dia' });
        
        if (!f.wakeUpTime)     miss.push({ section:'Rotina Alimentar', field:'Hora que acorda (Rotina)' });
        if (!f.sleepTime)      miss.push({ section:'Rotina Alimentar', field:'Hora que dorme (Rotina)' });
        if (!f.trainTime)      miss.push({ section:'Rotina Alimentar', field:'Horário do treino (Rotina)' });
        
        if (!f.freeDays?.length) miss.push({ section:'Rotina Alimentar', field:'Dias de Folga' });
        if (f.freeDays?.length > 0 && !f.freeDays.includes('Nenhum')) {
            if (!f.freeWakeUpTime) miss.push({ section:'Rotina Alimentar', field:'Hora que acorda (Folga)' });
            if (!f.freeSleepTime)  miss.push({ section:'Rotina Alimentar', field:'Hora que dorme (Folga)' });
            if (!f.freeTrainTime)  miss.push({ section:'Rotina Alimentar', field:'Treino/Cardio (Folga)' });
        }
        
        if (!f.eatsOutPerWeek) miss.push({ section:'Rotina Alimentar', field:'Refeições fora/semana' });
        if (!f.budget)         miss.push({ section:'Rotina Alimentar', field:'Orçamento alimentar' });
        if (!f.waterIntake)    miss.push({ section:'Hábitos', field:'Ingestão de água' });
        if (!f.alcoholFreq)    miss.push({ section:'Hábitos', field:'Frequência de álcool' });
        if (!f.eatSpeed)       miss.push({ section:'Hábitos', field:'Velocidade ao comer' });
        if (!f.nightBinge)     miss.push({ section:'Hábitos', field:'Compulsão noturna' });
        if (!f.biggestChallenge) miss.push({ section:'Histórico de Dietas', field:'Maior desafio' });
        if (!f.allergies?.trim())       miss.push({ section:'Preferências', field:'Alergias / intolerâncias' });
        if (!f.foodPreferences?.trim()) miss.push({ section:'Preferências', field:'Preferências alimentares' });
        if (!f.foodAversions?.trim())   miss.push({ section:'Preferências', field:'Aversões alimentares' });
        if (!f.supplements?.length)     miss.push({ section:'Preferências', field:'Suplementos' });
    }
    return miss;
}

// ─── ESTADO INICIAL ───────────────────────────────────────────────────────────
const INITIAL_F = {
    name:'', email:'', phone:'', gender:'', birthDate:'',
    peso:'', altura:'',
    objetivo:'', nivel:'', frequencia:'', tempoDisponivel:'', trainFasted:'',
    limitacoes:[], cirurgias:[], equipamentos:'',
    healthConditions:[], healthConditionsObs:'',
    bariatric: false,
    bariatricType:'', bariatricTime:'', bariatricIntolerances:[],
    medications:[], medicationsObs:'',
    digestiveIssues:[], digestiveObs:'',
    sleepHours:'', sleepQuality:'', wakeHungry:'', stressLevel:'', stressEating:'',
    cycleRegular:'', pmsSymptoms:[], pmsObs:'',
    mealsPerDay:'', wakeUpTime:'', sleepTime:'',
    workTimeStart:'', workTimeEnd:'', trainTime:'',
    freeDays:[], freeWakeUpTime:'', freeSleepTime:'', freeTrainTime:'',
    eatsOutPerWeek:'', budget:'', preworkoutStrategy:'',
    waterIntake:'', alcoholFreq:'', coffeePerDay:'', smoker:'', eatSpeed:'', nightBinge:'',
    triedDiets:[], dietWorked:'', dietHated:'', biggestChallenge:'',
    allergies:'', foodPreferences:'', foodAversions:'', supplements:[], extraNotes:'',
};

// ─── HOOK DUAL ENGINE (ADMIN) ─────────────────────────────────────────────────
export default function useAdminAnamneseForm({ aluno }) {
    const [loading, setLoading]               = useState(true);
    const [saving,  setSaving]                = useState(false);
    const [missingModal, setMissingModal]     = useState(false);
    const [missingFields, setMissingFields]   = useState([]);
    const [timePicker, setTimePicker]         = useState({ visible:false, field:'', label:'' });
    const [f, setF]                           = useState(INITIAL_F);

    // 🔥 NOVO ESTADO SAAS: TEMPLATE DINÂMICO 🔥
    const [dynamicSchema, setDynamicSchema]           = useState(null);
    const [dynamicTemplateId, setDynamicTemplateId]   = useState(null);

    const plan = (aluno?.plan || aluno?.userPlan || '').toUpperCase();
    const hasDiet = plan === 'ELITE' || plan === 'PREMIUM';
    const isFeminino = aluno?.gender === 'Feminino';

    // ── SET / TOGGLE ────────────────────────────────────────────────────────
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

    // ── FETCH ───────────────────────────────────────────────────────────────
    useEffect(() => { if (aluno?.id) fetchData(); }, [aluno?.id]);

    const fetchData = async () => {
        try {
            setLoading(true);

            // 1. Busca os dados de registro (Nome, Email, etc)
            const authHdrs = await authHeaders();
            const resUser = await fetch(`https://fitos-final.onrender.com/api/admin/user?userId=${aluno.id}&t=${Date.now()}`, { headers: { ...authHdrs } });
            if (resUser.ok) {
                const u = await resUser.json();
                setF(prev => ({ ...prev, name:u?.name||'', email:u?.email||'', phone:u?.phone||'', gender:u?.gender||'', birthDate:u?.birthDate||'' }));
            }

            // 🔥 TENTATIVA 1: VERIFICA SE O ALUNO TEM ANAMNESE DINÂMICA (SAAS) 🔥
            const coachId = aluno.coachId || 'MASTER';
            const formType = hasDiet ? 'FULL' : 'TRAINING';
            
            const resTemplate = await fetch(`https://fitos-final.onrender.com/api/form-template/active?coachId=${coachId}&type=${formType}`);
            if (resTemplate.ok) {
                const templateData = await resTemplate.json();
                if (templateData && templateData.schema) {
                    setDynamicSchema(templateData.schema);
                    setDynamicTemplateId(templateData.id);
                    
                    // Busca as respostas dinâmicas
                    const resDyn = await fetch(`https://fitos-final.onrender.com/api/form-response?userId=${aluno.id}&templateId=${templateData.id}`);
                    if (resDyn.ok) {
                        const d = await resDyn.json();
                        if (d && d.answers) {
                            setF(prev => ({ ...prev, ...d.answers }));
                        }
                    }
                    return; // 🛑 Interrompe aqui, não puxa o legado.
                }
            }

            // 🔥 TENTATIVA 2: MOTOR LEGADO (PA ELITE TEAM) 🔥
            const resA = await fetch(`https://fitos-final.onrender.com/api/anamnese?userId=${aluno.id}`, { headers: { ...authHdrs } });
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
                    bariatric:d.bariatric===true,
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
                    freeDays:Array.isArray(d.freeDays)?d.freeDays:[],
                    freeWakeUpTime:d.freeWakeUpTime||'',
                    freeSleepTime:d.freeSleepTime||'',
                    freeTrainTime:d.freeTrainTime||'',
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
        } catch(e) { console.log('Erro anamnese admin:', e); }
        finally    { setLoading(false); }
    };

    // ── SALVAR ──────────────────────────────────────────────────────────────
    const handleSave = async () => {
        // Verifica dados base sempre
        if (!f.name?.trim() || !f.email?.trim()) {
            setMissingFields([{ section:'Registro', field:'Nome e E-mail' }]);
            setMissingModal(true); return;
        }

        // Validação Mágica: Dinâmica ou Legada
        if (dynamicSchema) {
            const miss = [];
            dynamicSchema.steps.forEach(step => {
                step.questions.forEach(q => {
                    if (q.required) {
                        const val = f[q.id];
                        if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
                            miss.push({ section: step.title, field: q.label || q.question });
                        }
                    }
                });
            });
            if (miss.length > 0) { setMissingFields(miss); setMissingModal(true); return; }
        } else {
            const miss = validateAnamnese(f, hasDiet, isFeminino);
            if (miss.length > 0) { setMissingFields(miss); setMissingModal(true); return; }
        }

        try {
            setSaving(true);
            
            // 1. Atualiza Cadastro (Comum)
            const saveAuthHdrs = await authHeaders();
            await fetch('https://fitos-final.onrender.com/api/admin/user', {
                method:'PUT', headers:{'Content-Type':'application/json', ...saveAuthHdrs},
                body:JSON.stringify({
                    id:aluno.id, name:f.name.trim(),
                    email:f.email.trim().toLowerCase(),
                    phone:f.phone, gender:f.gender,
                    birthDate:f.birthDate?.length===10 ? f.birthDate : undefined,
                }),
            });

            // 2. Salva Anamnese (Dinâmica ou Legada)
            let res;
            if (dynamicSchema && dynamicTemplateId) {
                res = await fetch('https://fitos-final.onrender.com/api/form-response', {
                    method:'POST', headers:{'Content-Type':'application/json'},
                    body:JSON.stringify({
                        templateId: dynamicTemplateId,
                        userId: aluno.id,
                        answers: f
                    }),
                });
            } else {
                res = await fetch('https://fitos-final.onrender.com/api/anamnese', {
                    method:'POST', headers:{'Content-Type':'application/json', ...saveAuthHdrs},
                    body:JSON.stringify({
                        userId:aluno.id,
                        peso:f.peso.replace(',','.'), altura:f.altura.replace(',','.'),
                        objetivo:f.objetivo, nivel:f.nivel,
                        frequencia:parseInt(f.frequencia)||3,
                        tempoDisponivel:parseInt(f.tempoDisponivel)||60,
                        limitacoes:f.limitacoes, cirurgias:f.cirurgias,
                        equipamentos:f.equipamentos ? f.equipamentos.split(',').map(i=>i.trim()).filter(Boolean) : [],
                        ...(hasDiet && {
                            trainFasted:f.trainFasted==='yes',
                            healthConditions:f.healthConditions,
                            healthConditionsObs:f.healthConditionsObs.trim(),
                            bariatric:f.bariatric===true,
                            bariatricType:f.bariatric===true?f.bariatricType:null,
                            bariatricTime:f.bariatric===true?f.bariatricTime:null,
                            bariatricIntolerances:f.bariatric===true?f.bariatricIntolerances:[],
                            medications:f.medications, medicationsObs:f.medicationsObs.trim(),
                            digestiveIssues:f.digestiveIssues, digestiveObs:f.digestiveObs.trim(),
                            sleepHours:f.sleepHours, sleepQuality:f.sleepQuality,
                            wakeHungry:f.wakeHungry==='yes',
                            stressLevel:parseInt(f.stressLevel)||null,
                            stressEating:f.stressEating==='yes',
                            ...(isFeminino && { cycleRegular:f.cycleRegular, pmsSymptoms:f.pmsSymptoms, pmsObs:f.pmsObs.trim() }),
                            mealsPerDay:parseInt(f.mealsPerDay)||null,
                            wakeUpTime:f.wakeUpTime, sleepTime:f.sleepTime,
                            workTime:f.workTimeStart&&f.workTimeEnd ? `${f.workTimeStart} às ${f.workTimeEnd}` : '',
                            trainTime:f.trainTime,
                            freeDays:f.freeDays,
                            freeWakeUpTime:f.freeWakeUpTime,
                            freeSleepTime:f.freeSleepTime,
                            freeTrainTime:f.freeTrainTime,
                            eatsOutPerWeek:f.eatsOutPerWeek, budget:f.budget,
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
            }

            if (res.ok) {
                const msg = 'Cadastro e anamnese salvos!';
                if (Platform.OS==='web') window.alert(msg); else Alert.alert('Sucesso ✅', msg);
            } else throw new Error('Falha ao salvar.');
        } catch(e) {
            if (Platform.OS==='web') window.alert(e.message); else Alert.alert('Erro', e.message);
        } finally { setSaving(false); }
    };

    return {
        f, set, toggleMulti,
        loading, saving, handleSave,
        timePicker, setTimePicker,
        missingModal, setMissingModal, missingFields,
        hasDiet, isFeminino,
        dynamicSchema // 🔥 Exportado para o AdminUserAnamneseTab desenhar caso queira
    };
}