// src/utils/adminHelpers.js

export const getExpirationStatus = (workout) => {
    if (!workout) return null;
    if (!workout.endDate) return { text: 'SEM PRAZO', bg: '#E5E5EA', color: '#888', cat: 'OK' }; 

    const today = new Date();
    today.setHours(0,0,0,0);
    const end = new Date(workout.endDate);
    end.setHours(0,0,0,0);
    
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: `ATRASADO ${Math.abs(diffDays)}D`, bg: '#000', color: '#FFF', cat: 'ATRASADOS' };
    if (diffDays <= 3) return { text: `VENCE EM ${diffDays}D`, bg: '#FF3B30', color: '#FFF', cat: 'ALERTA' };
    if (diffDays <= 7) return { text: `VENCE EM ${diffDays}D`, bg: '#FFCC00', color: '#000', cat: 'ALERTA' };
    return { text: `VENCE EM ${diffDays}D`, bg: 'rgba(52, 199, 89, 0.15)', color: '#34C759', cat: 'OK' };
};

export const getCheckinStatus = (aluno) => {
    if (!aluno || !aluno.nextCheckInDate) return false;
    if (aluno.disableCheckIn === true || String(aluno.disableCheckIn).toLowerCase() === 'true') return false;
    
    let targetDate;
    if (typeof aluno.nextCheckInDate === 'string' && aluno.nextCheckInDate.includes('/')) {
        const parts = aluno.nextCheckInDate.split('/');
        targetDate = new Date(parts[2], parts[1] - 1, parts[0]);
    } else {
        targetDate = new Date(aluno.nextCheckInDate);
    }
    
    if (isNaN(targetDate.getTime())) return false; 
    
    targetDate.setHours(0,0,0,0);
    const today = new Date();
    today.setHours(0,0,0,0);

    return targetDate.getTime() < today.getTime(); 
};

export const getPlanBadge = (plan) => {
    switch(plan) {
        case 'LOW_COST': return { text: 'LOW COST', color: '#32ADE6', icon: 'rocket-launch' };
        case 'CHALLENGE_21': return { text: 'DESAFIO 21D', color: '#FF9500', icon: 'fire' };
        case 'FICHA_8S': return { text: 'FICHA 8S', color: '#AF52DE', icon: 'lightning-bolt' };
        default: return { text: 'PREMIUM', color: '#FFCC00', icon: 'crown' };
    }
};