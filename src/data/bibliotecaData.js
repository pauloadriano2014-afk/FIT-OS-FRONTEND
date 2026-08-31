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

export const subCategoriesMap = {
    "Peito": ["Todos", "Superior", "Medial", "Inferior"],
    "Costas": ["Todos", "Puxadas", "Remadas", "Lombar"],
    "Pernas": ["Todos", "Multiarticular", "Quadríceps e Adutores", "Posteriores", "Glúteos", "Panturrilha"],
    "Ombros": ["Todos", "Multiarticular", "Frontal", "Lateral", "Posterior", "Trapézio"],
    "Abdômen": ["Todos", "Supra", "Infra", "Core", "Completo"]
};

export const SPACING = 15; 
export const HORIZONTAL_PADDING = 20;