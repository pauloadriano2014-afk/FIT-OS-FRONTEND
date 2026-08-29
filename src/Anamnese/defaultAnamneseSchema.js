// src/Anamnese/defaultAnamneseSchema.js
//
// Espelha, em formato de "schema dinâmico" (o mesmo formato que o Editor de
// Anamnese usa pra salvar customizações — { steps: [{ id, title, description,
// questions: [{ id, type, label, required, options, locked }] }] }), a
// anamnese FIXA de 11 passos que já roda hoje em produção (src/Anamnese/steps/
// Step01Medidas.js … Step11Preferencias.js + constants.js).
//
// Serve como ponto de partida do Editor de Anamnese: em vez do coach abrir a
// tela e ver "Nenhuma seção criada" (mesmo já existindo um questionário rodando
// pra valer), ele vê exatamente as perguntas que os alunos respondem hoje,
// organizadas nas mesmas seções, e pode editar o texto, adicionar ou remover
// o que quiser.
//
// `locked: true` marca as perguntas que alimentam diretamente o cálculo de
// macros da dieta e/ou os alertas clínicos de segurança (bariátrica, alergias,
// condições de saúde, etc. — ver macroPlanner.js e o endpoint generate-diet).
// O Editor não deixa excluir essas, só editar o texto — nunca deve ficar
// possível um coach remover sem querer um campo que o motor de dieta precisa
// pra funcionar (ou pra não colocar um aluno em risco).
//
// IMPORTANTE: isto é só o ponto de partida (semente) mostrado quando o coach
// ainda não salvou nenhuma customização própria — depois de ele salvar uma
// vez, o que vale é o FormTemplate salvo no banco (isolado por coachId), não
// mais este arquivo.

function q(id, type, label, { required = false, options = [], locked = false, description } = {}) {
    return { id, type, label, required, options, locked, ...(description ? { description } : {}) };
}

// ─── Passo 1 — Suas Medidas ─────────────────────────────────────────────────
const STEP_01 = {
    id: 'step_medidas',
    title: 'Suas Medidas',
    description: '',
    questions: [
        q('peso', 'TEXT', 'Peso (kg)', { required: true, locked: true }),
        q('altura', 'TEXT', 'Altura (cm)', { required: true, locked: true }),
    ],
};

// ─── Passo 2 — Objetivo Principal ───────────────────────────────────────────
const STEP_02 = {
    id: 'step_objetivo',
    title: 'Objetivo Principal',
    description: '',
    questions: [
        q('objetivo', 'SELECT', 'Objetivo Principal', {
            required: true, locked: true,
            options: ['Hipertrofia', 'Emagrecimento', 'Definição'],
        }),
        q('nivel', 'SELECT', 'Nível de Experiência', {
            required: true,
            options: ['Iniciante', 'Intermediário', 'Avançado'],
        }),
    ],
};

// ─── Passo 3 — Mapeamento de Dores / Cirurgias / Equipamentos ───────────────
const STEP_03 = {
    id: 'step_limitacoes',
    title: 'Mapeamento de Dores',
    description: '',
    questions: [
        q('limitacoes', 'MULTI_SELECT', 'Dores ou Limitações Articulares', {
            options: ['Joelho', 'Lombar', 'Ombro', 'Punho', 'Quadril', 'Tornozelo', 'Cervical', 'Cotovelos', 'Nenhuma'],
        }),
        q('cirurgias', 'MULTI_SELECT', 'Cirurgias Prévias', {
            options: ['Abdominoplastia', 'Prótese de Silicone', 'Cesárea', 'LCA/Menisco', 'Hérnia', 'Coluna', 'Manguito', 'Nenhuma'],
        }),
        q('equipamentos', 'MULTI_SELECT', 'Local de Treino / Equipamentos', {
            required: true,
            options: ['Academia Completa', 'Academia de Condomínio', 'Em Casa (Com Pesos/Elásticos)', 'Em Casa (Apenas peso do corpo)', 'Estúdio de Crossfit', 'Parque / Ar Livre'],
        }),
    ],
};

// ─── Passo 4 — Frequência de Treino ─────────────────────────────────────────
const STEP_04 = {
    id: 'step_treino',
    title: 'Frequência de Treino',
    description: '',
    questions: [
        q('frequencia', 'SELECT', 'Frequência de Treino (dias/semana)', {
            required: true, locked: true,
            options: ['1x', '2x', '3x', '4x', '5x', '6x', '7x'],
        }),
        q('tempoDisponivel', 'SELECT', 'Tempo Disponível por Sessão', {
            required: true,
            options: ['30 min', '45 min', '60 min', '90 min', '120 min'],
        }),
        q('trainFasted', 'BOOLEAN', 'Treina em Jejum?', {
            description: 'Só aparece pra alunos com plano de dieta.',
        }),
    ],
};

// ─── Passo 5 — Condições de Saúde ───────────────────────────────────────────
const STEP_05 = {
    id: 'step_saude',
    title: 'Condições de Saúde',
    description: 'Selecione todas que se aplicam. Essencial para uma dieta segura.',
    questions: [
        q('healthConditions', 'MULTI_SELECT', 'Condições de Saúde', {
            required: true, locked: true,
            options: ['Diabetes Tipo 1', 'Diabetes Tipo 2', 'Pré-diabetes', 'Hipotireoidismo', 'Hipertireoidismo', 'Hipertensão', 'SOP', 'Resistência à Insulina', 'Nenhuma'],
        }),
        q('healthConditionsObs', 'TEXTAREA', 'Observação adicional sobre saúde'),
        q('bariatric', 'BOOLEAN', 'Já fez cirurgia bariátrica?', { locked: true }),
        q('bariatricType', 'SELECT', 'Tipo de Cirurgia Bariátrica', {
            locked: true, description: 'Só aparece se a resposta anterior for "Sim".',
            options: ['Sleeve (Gastrectomia)', 'Bypass Gástrico (Roux-en-Y)', 'Banda Gástrica', 'Balão Intragástrico', 'Outro'],
        }),
        q('bariatricTime', 'SELECT', 'Há quanto tempo?', {
            locked: true, description: 'Só aparece se a resposta anterior for "Sim".',
            options: ['Menos de 6 meses', '6 meses a 1 ano', '1 a 2 anos', '2 a 3 anos', 'Mais de 3 anos'],
        }),
        q('bariatricIntolerances', 'MULTI_SELECT', 'Intolerâncias Pós-Cirurgia', {
            locked: true,
            options: ['Açúcar / Síndrome de Dumping', 'Gordura', 'Lactose', 'Glúten', 'Carne Vermelha', 'Alimentos Fibrosos', 'Nenhuma'],
        }),
        q('medications', 'MULTI_SELECT', 'Usa algum medicamento contínuo?', {
            options: ['Metformina', 'Levotiroxina', 'Anticoncepcional', 'Anti-hipertensivo', 'Antidepressivo', 'Corticoide', 'Nenhum'],
        }),
        q('medicationsObs', 'TEXTAREA', 'Outros medicamentos'),
    ],
};

// ─── Passo 6 — Saúde Digestiva / Sono / Stress ──────────────────────────────
const STEP_06 = {
    id: 'step_sono',
    title: 'Saúde Digestiva e Sono',
    description: '',
    questions: [
        q('digestiveIssues', 'MULTI_SELECT', 'Saúde Digestiva', {
            required: true, locked: true,
            options: ['Gastrite', 'Refluxo / DRGE', 'Intestino Preso', 'Intestino Solto / SII', 'Doença de Crohn / Colite', 'Intolerância à Lactose', 'Intolerância ao Glúten', 'Nenhum'],
        }),
        q('digestiveObs', 'TEXTAREA', 'Detalhes sobre saúde digestiva'),
        q('sleepHours', 'SELECT', 'Horas de Sono por Noite', {
            required: true,
            options: ['Menos de 5h', '5 a 6h', '6 a 7h', '7 a 8h', 'Mais de 8h'],
        }),
        q('sleepQuality', 'SELECT', 'Como avalia seu sono?', {
            required: true,
            options: ['Ótimo', 'Bom', 'Regular', 'Ruim', 'Péssimo'],
        }),
        q('wakeHungry', 'BOOLEAN', 'Acorda com fome durante a noite?'),
        q('stressLevel', 'SELECT', 'Nível de Stress no Dia a Dia', {
            required: true, description: '1 = Muito tranquilo · 5 = Extremamente estressado',
            options: ['1', '2', '3', '4', '5'],
        }),
        q('stressEating', 'BOOLEAN', 'Come mais quando está estressado(a)?'),
    ],
};

// ─── Passo 7 — Ciclo Menstrual (só feminino) ────────────────────────────────
const STEP_07 = {
    id: 'step_ciclo',
    title: 'Ciclo Menstrual',
    description: 'Só é exibido para alunas.',
    questions: [
        q('cycleRegular', 'SELECT', 'Seu ciclo é regular?', {
            required: true,
            options: ['Regular (28-32 dias)', 'Irregular', 'Menopausa / Pós-menopausa', 'Uso anticoncepcional hormonal'],
        }),
        q('pmsSymptoms', 'MULTI_SELECT', 'Sintomas de TPM que você sente', {
            required: true,
            options: ['Compulsão Alimentar Forte', 'Vontade de Doce', 'Inchaço / Retenção', 'Irritabilidade', 'Cólica Intensa', 'Fadiga Extrema', 'Sem Sintomas Significativos'],
        }),
        q('pmsObs', 'TEXTAREA', 'Observações adicionais sobre o ciclo'),
    ],
};

// ─── Passo 8 — Rotina Alimentar e Horários ──────────────────────────────────
const STEP_08 = {
    id: 'step_rotina',
    title: 'Rotina Alimentar',
    description: '',
    questions: [
        q('mealsPerDay', 'SELECT', 'Refeições Preferidas por Dia', {
            required: true,
            options: ['2x', '3x', '4x', '5x', '6x', '7x', '8x'],
        }),
        q('wakeUpTime', 'TEXT', 'Acorda às', { required: true, description: 'Horário, ex: 06:30' }),
        q('sleepTime', 'TEXT', 'Dorme às', { required: true, description: 'Horário, ex: 22:30' }),
        q('workTimeStart', 'TEXT', 'Horário de Trabalho — Início', { description: 'Opcional. Horário, ex: 08:00' }),
        q('workTimeEnd', 'TEXT', 'Horário de Trabalho — Fim', { description: 'Opcional. Horário, ex: 18:00' }),
        q('trainTime', 'TEXT', 'Treino às', { required: true, description: 'Horário, ex: 19:00' }),
        q('freeDays', 'MULTI_SELECT', 'Dias Livres ou Folgas', {
            required: true,
            options: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo', 'Nenhum'],
        }),
        q('freeWakeUpTime', 'TEXT', 'Acorda às (Folga)', { description: 'Horário, ex: 08:00' }),
        q('freeSleepTime', 'TEXT', 'Dorme às (Folga)', { description: 'Horário, ex: 23:30' }),
        q('freeTrainTime', 'TEXT', 'Treino / Cardio às (Na Folga)', { description: 'Horário, ex: 10:00' }),
        q('eatsOutPerWeek', 'SELECT', 'Quantas vezes come fora por semana?', {
            required: true,
            options: ['Nunca / Raramente', '1 a 2x', '3 a 4x', 'Quase sempre'],
        }),
        q('budget', 'SELECT', 'Orçamento para Alimentação', {
            required: true,
            options: ['Econômico', 'Moderado', 'Sem restrição'],
        }),
    ],
};

// ─── Passo 9 — Hábitos ───────────────────────────────────────────────────────
const STEP_09 = {
    id: 'step_habitos',
    title: 'Hábitos',
    description: '',
    questions: [
        q('waterIntake', 'SELECT', 'Água por Dia', {
            options: ['Menos de 1L', '1 a 1,5L', '1,5 a 2L', '2 a 2,5L', 'Mais de 2,5L'],
        }),
        q('alcoholFreq', 'SELECT', 'Consumo de Álcool', {
            options: ['Nunca', 'Raramente (ocasional)', '1 a 2x por semana', 'Frequente (3x+)'],
        }),
        q('coffeePerDay', 'SELECT', 'Cafés por Dia', {
            options: ['Nenhum', '1 a 2 cafés', '3 a 4 cafés', '5 ou mais'],
        }),
        q('smoker', 'BOOLEAN', 'Fumante?'),
        q('eatSpeed', 'SELECT', 'Velocidade ao Comer', {
            options: ['Muito Rápido', 'Rápido', 'Normal', 'Devagar', 'Muito Devagar'],
        }),
        q('nightBinge', 'SELECT', 'Tem compulsão alimentar noturna?', {
            options: ['Nunca', 'Raramente', 'Às vezes', 'Com frequência'],
        }),
    ],
};

// ─── Passo 10 — Histórico de Dietas ─────────────────────────────────────────
const STEP_10 = {
    id: 'step_dietas',
    title: 'Histórico de Dietas',
    description: '',
    questions: [
        q('triedDiets', 'MULTI_SELECT', 'Já tentou alguma dessas dietas?', {
            options: ['Low Carb', 'Cetogênica / Keto', 'Jejum Intermitente', 'Dieta do Índice Glicêmico', 'Vegana / Vegetariana', 'Dieta dos Pontos', 'Dieta Detox', 'Nenhuma'],
        }),
        q('dietWorked', 'TEXTAREA', 'O que já funcionou para você?', { description: 'Deixe em branco se nunca fez dieta.' }),
        q('dietHated', 'TEXTAREA', 'O que você odeia ou não consegue seguir?'),
        q('biggestChallenge', 'SELECT', 'Seu Maior Desafio na Dieta', {
            required: true,
            options: ['Ansiedade / Fome Constante', 'Falta de Tempo para Preparar', 'Comer Fora de Casa', 'Consistência e Disciplina', 'Custo dos Alimentos', 'Falta de Variedade', 'Comer na Empresa / Restaurante', 'Família não Apoia', 'Outro'],
        }),
    ],
};

// ─── Passo 11 — Preferências e Restrições ───────────────────────────────────
const STEP_11 = {
    id: 'step_preferencias',
    title: 'Preferências e Restrições',
    description: '',
    questions: [
        q('allergies', 'TEXTAREA', 'Alergias ou Intolerâncias', {
            required: true, locked: true, description: "Se não houver, o aluno escreve 'Nenhuma'.",
        }),
        q('foodAversions', 'TEXTAREA', 'O que você odeia comer?', {
            required: true, locked: true, description: "Se comer de tudo, o aluno escreve 'Nada'.",
        }),
        q('foodPreferences', 'TEXTAREA', 'Preferências Alimentares', {
            required: true, locked: true, description: 'O que não pode faltar na dieta.',
        }),
        q('supplements', 'MULTI_SELECT', 'Suplementos que já utiliza', {
            required: true, locked: true,
            options: ['Whey Protein', 'Creatina', 'Pré-Treino', 'BCAA', 'Multivitamínico', 'Ômega 3', 'Hipercalórico', 'Nenhum'],
        }),
        q('extraNotes', 'TEXTAREA', 'Observações Finais para o Coach'),
    ],
};

// Alunos SEM plano de dieta (só treino) só respondem os passos 1-4 hoje —
// ver useAnamneseForm.js (`totalSteps = !hasDiet ? 4 : ...`).
export const DEFAULT_ANAMNESE_SCHEMA_TRAINING = {
    steps: [STEP_01, STEP_02, STEP_03, STEP_04],
};

// Alunos COM plano de dieta respondem os 11 passos.
export const DEFAULT_ANAMNESE_SCHEMA_FULL = {
    steps: [STEP_01, STEP_02, STEP_03, STEP_04, STEP_05, STEP_06, STEP_07, STEP_08, STEP_09, STEP_10, STEP_11],
};

export function getDefaultAnamneseSchema(formType) {
    // Deep clone pra nunca deixar o estado da tela mutar essas constantes.
    const base = formType === 'FULL' ? DEFAULT_ANAMNESE_SCHEMA_FULL : DEFAULT_ANAMNESE_SCHEMA_TRAINING;
    return JSON.parse(JSON.stringify(base));
}
