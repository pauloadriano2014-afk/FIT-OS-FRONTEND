// 🔥 Capas de categoria trocadas de links do Imgur (hospedagem externa, sem
// controle de tamanho/otimização -- carregava devagar) para assets locais,
// empacotados junto com o app. "TODOS" não entra aqui de propósito: já é
// tratado à parte em BibliotecaAdmin.js (usa elitefit_banner_generic.png).
export const categoryCovers = {
    "Peito": require('../../assets/categoria_peito.png'),
    "Costas": require('../../assets/categoria_costas.png'),
    "Pernas": require('../../assets/categoria_pernas.png'),
    "Ombros": require('../../assets/categoria_ombros.png'),
    "Bíceps": require('../../assets/categoria_biceps.png'),
    "Tríceps": require('../../assets/categoria_triceps.png'),
    "Abdômen": require('../../assets/categoria_abdomen.png'),
    "Cardio": require('../../assets/categoria_cardio.png'),
    "Antebraço": require('../../assets/categoria_antebraco.png'),
    "Mobilidade": require('../../assets/categoria_mobilidade.png'),
};

export const categories = [
    'TODOS', 'Peito', 'Costas', 'Pernas', 'Ombros',
    'Bíceps', 'Antebraço', 'Tríceps', 'Abdômen', 'Mobilidade', 'Cardio'
];

// 🔥 Rótulo de exibição -- "Mobilidade" continua sendo o valor gravado no
// banco (exercise.category) e usado em todas as comparações de filtro pelo
// app inteiro; só o TEXTO mostrado pro usuário virou "Alongamento e
// Mobilidade". Trocar o valor gravado exigiria migrar os 40 exercícios já
// cadastrados (e tudo que compara com a string "Mobilidade" direto, tipo o
// gerador de treino) -- sem necessidade, já que é só um ajuste de nome.
export const categoryLabels = {
    "Mobilidade": "Alongamento e Mobilidade",
};

export function getCategoryLabel(cat) {
    return categoryLabels[cat] || cat;
}

export const subCategoriesMap = {
    "Peito": ["Todos", "Superior", "Medial", "Inferior"],
    "Costas": ["Todos", "Puxadas", "Remadas", "Lombar"],
    "Pernas": ["Todos", "Multiarticular", "Quadríceps e Adutores", "Posteriores", "Glúteos", "Panturrilha"],
    "Ombros": ["Todos", "Multiarticular", "Frontal", "Lateral", "Posterior", "Trapézio"],
    "Abdômen": ["Todos", "Supra", "Infra", "Core", "Completo"]
};

export const SPACING = 15; 
export const HORIZONTAL_PADDING = 20;