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
    return defaultInfo;
};

export const getCategoryType = (item) => {
    const name = (item.exercise?.name || item.name || "").toLowerCase();
    const category = (item.exercise?.category || "").toLowerCase();
    if (name.includes('mobilidade') || name.includes('alongamento') || category.includes('mobilidade') || category.includes('alongamento')) return 'MOBILITY';
    if (name.includes('esteira') || name.includes('bike') || name.includes('elíptico') || name.includes('corrida') || category.includes('cardio')) return 'CARDIO';
    return 'STRENGTH';
};