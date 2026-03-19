// src/utils/workoutUtils.js
export const darkColors = {
    bg: '#000000', surface: '#111111', border: '#222222', text: '#FFFFFF', textMuted: '#888888',
    primary: '#CCFF00', primaryText: '#000000', secondary: '#32ADE6', danger: '#FF3B30', inputBg: '#080808', glass: 'rgba(0,0,0,0.85)'
};
  
export const lightColors = {
    bg: '#F2F2F7', surface: '#FFFFFF', border: '#D1D1D6', text: '#1C1C1E', textMuted: '#666666',
    primary: '#28A745', primaryText: '#FFFFFF', secondary: '#007AFF', danger: '#FF3B30', inputBg: '#E5E5EA', glass: 'rgba(255,255,255,0.9)'
};

export const calculate1RM = (weight, reps) => {
    if(!weight || !reps) return 0;
    return Math.round(weight * (1 + reps / 30));
};
  
export const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

export const identifyTechnique = (rawName) => {
    const defaultInfo = { key: null, color: '#666', label: null };
    if (!rawName) return defaultInfo;
    const clean = rawName.toUpperCase(); 

    if (clean.includes('CLUSTER')) return { key: 'CLUSTERSET', color: '#BF5AF2', label: 'CLUSTER' };
    if (clean.includes('DROP')) return { key: 'DROPSET', color: '#FF3B30', label: 'DROP-SET' };
    if (clean.includes('REST')) return { key: 'RESTPAUSE', color: '#FF9500', label: 'REST-PAUSE' }; 
    if (clean.includes('GVT')) return { key: 'GVT', color: '#00FF7F', label: 'GVT' };
    if (clean.includes('21')) return { key: '21', color: '#32ADE6', label: 'MÉTODO 21' };
    if (clean.includes('BI') || clean.includes('BI-SET') || clean.includes('BISET')) return { key: 'BISET', color: '#CCFF00', label: 'BI-SET' };
    
    // 🔥 CORREÇÃO APLICADA: Agora ele reconhece a ID '1_5_REPS' que vem do banco de dados!
    if (clean.includes('1_5_REPS') || clean.includes('MEIO') || clean.includes('1.5') || clean.includes('1 E 1/2')) return { key: '1_5_REPS', color: '#FF2D55', label: '1 E MEIO' };
    
    if (clean.includes('TUT') || clean.includes('TENSAO') || clean.includes('TENSÃO')) return { key: 'TUT', color: '#00C7BE', label: 'T.U.T.' };

    return defaultInfo;
};

export const getCategoryType = (item) => {
    const name = (item.exercise?.name || item.name || "").toLowerCase();
    const category = (item.exercise?.category || "").toLowerCase();
    if (name.includes('mobilidade') || name.includes('alongamento') || category.includes('mobilidade') || category.includes('alongamento')) return 'MOBILITY';
    if (name.includes('esteira') || name.includes('bike') || name.includes('elíptico') || name.includes('corrida') || category.includes('cardio')) return 'CARDIO';
    return 'STRENGTH';
};

// 🔥 GUIA DE TÉCNICAS PARA O MODAL DE INFORMAÇÕES
export const TECH_GUIDE = {
    'DROPSET': {
        title: 'DROP-SET',
        desc: 'Faça o exercício até a falha com a carga principal. Sem descansar, reduza o peso (cerca de 20% a 30%) e faça mais repetições até falhar novamente.'
    },
    'RESTPAUSE': {
        title: 'REST-PAUSE',
        desc: 'Vá até a falha com a carga estipulada. Descanse exatos 20 segundos e, com o mesmo peso, tente fazer mais repetições até falhar de novo.'
    },
    'CLUSTERSET': {
        title: 'CLUSTER SET',
        desc: 'Série fragmentada. Faça um pequeno bloco de repetições (ex: 4), descanse de 10 a 15 segundos e faça outro bloco com a MESMA carga. Repita até terminar os blocos da série.'
    },
    'GVT': {
        title: 'G.V.T. (GERMAN VOLUME TRAINING)',
        desc: '10 séries de 10 repetições. A carga deve ser pesada, mas o mais importante é o intervalo de descanso: respeite exatos 60 segundos entre cada série.'
    },
    '21': {
        title: 'MÉTODO 21',
        desc: 'Divida o movimento em 3 partes: faça 7 repetições só na metade inferior, 7 repetições só na metade superior e, por fim, 7 repetições do movimento completo.'
    },
    'BISET': {
        title: 'BI-SET / CONJUGADO',
        desc: 'Faça a primeira série do exercício e, SEM DESCANSO, inicie imediatamente a série do próximo exercício (que está com o selo logo abaixo). Só descanse quando terminar os dois.'
    },
    '1_5_REPS': {
        title: '1 E MEIO (1.5 REPS)',
        desc: 'Faça o movimento completo, volte até a metade do caminho, suba novamente e então retorne à posição inicial. Isso conta como UMA repetição. Aumenta o tempo sob tensão sem precisar dobrar a carga.'
    },
    'TUT': {
        title: 'T.U.T. (TEMPO SOB TENSÃO)',
        desc: 'Execute as repetições de forma controlada, respeitando os segundos de cadência estipulados pelo Coach na descida (excêntrica) e na subida (concêntrica). Sem pressa e sem tranco.'
    }
};