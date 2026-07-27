// src/constants/foodManagerConstants.js
export const BASE_URL = 'https://fitos-final.onrender.com';

export const CATEGORIES = [
    'Todas','Carboidratos','Carnes e Proteínas','Frios e Laticínios',
    'Vegetais e Legumes','Frutas','Gorduras e Oleaginosas',
    'Suplementos','Bebidas','Refeições Prontas','Outros',
];

export const SOURCE_FILTERS = [
    { key:'all',       label:'Todos',        icon:'database',     tip:'Mostra todos os alimentos disponíveis para você.' },
    { key:'favorites', label:'Favoritos ⭐', icon:'star',         tip:'Alimentos marcados com ★. São esses que aparecem primeiro quando você monta uma dieta.' },
    { key:'custom',    label:'Meus',         icon:'account-star', tip:'Alimentos que você criou. Visíveis só para você e seus alunos.' },
    { key:'taco',      label:'TACO',         icon:'leaf',         tip:'Tabela Brasileira de Composição de Alimentos (NEPA/UNICAMP). Base científica com ~590 alimentos reais.' },
];