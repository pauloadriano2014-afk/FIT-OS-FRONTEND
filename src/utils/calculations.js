// src/utils/calculations.js

export const calculateBodyFat = (gender, age, rawFolds) => {
    const cleanVal = (v) => Number(String(v).replace(',', '.') || 0);
    
    // 🔥 Ajustado para aceitar tanto 'foldChest' (do form novo) quanto 'chest' (legado)
    const sum = cleanVal(rawFolds.foldChest || rawFolds.chest) + 
                cleanVal(rawFolds.foldAxillary || rawFolds.axillary) + 
                cleanVal(rawFolds.foldTriceps || rawFolds.triceps) + 
                cleanVal(rawFolds.foldSubscapular || rawFolds.subscapular) + 
                cleanVal(rawFolds.foldAbdominal || rawFolds.abdominal) + 
                cleanVal(rawFolds.foldSuprailiac || rawFolds.suprailiac) + 
                cleanVal(rawFolds.foldThigh || rawFolds.thigh);
                
    if (sum === 0) return 0;
    
    let density = 0;
    const ageVal = Number(age);
    
    if (String(gender).toUpperCase().trim() === 'MASCULINO') {
        density = 1.112 - (0.00043499 * sum) + (0.00000055 * sum * sum) - (0.00028826 * ageVal);
    } else {
        density = 1.097 - (0.00046971 * sum) + (0.00000056 * sum * sum) - (0.00012828 * ageVal);
    }
    
    const bf = ((4.95 / density) - 4.50) * 100;
    return bf > 0 ? parseFloat(bf.toFixed(1)) : 0;
};

// 🔥 FUNÇÃO INTERNA: Tradutor absoluto de datas (Resolve o problema do JavaScript com o padrão BR) 🔥
const parseDateBr = (dateStr) => {
    if (!dateStr) return null;
    const str = String(dateStr).trim();
    
    // Se vier no formato DD/MM/YYYY, inverte para YYYY-MM-DD para o JavaScript entender
    if (str.includes('/')) {
        const parts = str.split('/');
        if (parts.length === 3 && parts[2].length === 4) {
            return new Date(`${parts[2]}-${parts[1]}-${parts[0]}T12:00:00`);
        }
    }
    
    // Se já vier no padrão ISO (Banco de Dados), lê normal
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
};

// Pega a idade com base no dia de HOJE
export const getAgeFromDate = (birthDate) => {
    const d = parseDateBr(birthDate);
    if (!d) return '';
    
    const today = new Date();
    let age = today.getFullYear() - d.getFullYear();
    const m = today.getMonth() - d.getMonth();
    
    if (m < 0 || (m === 0 && today.getDate() < d.getDate())) {
        age--;
    }
    
    return age > 0 ? age.toString() : '';
};

// 🔥 NOVA FUNÇÃO MESTRA: Calcula a idade no exato dia em que a Avaliação foi (ou será) feita 🔥
export const getAgeAtDate = (birthDate, assessmentDate) => {
    const birth = parseDateBr(birthDate);
    if (!birth) return '';

    // Se o professor não preencheu data retroativa, usa a data de hoje como base
    const targetDate = assessmentDate ? parseDateBr(assessmentDate) : new Date();
    if (!targetDate) return '';

    let age = targetDate.getFullYear() - birth.getFullYear();
    const m = targetDate.getMonth() - birth.getMonth();
    
    if (m < 0 || (m === 0 && targetDate.getDate() < birth.getDate())) {
        age--;
    }
    
    return age > 0 ? age.toString() : '';
};

export const getRpeInfo = (val) => {
    if (val >= 9) return { label: 'FALHA', color: '#BF5AF2' };
    if (val >= 8) return { label: 'INTENSO', color: '#FF3B30' };
    if (val >= 6) return { label: 'MÉDIO', color: '#FF9500' };
    if (val >= 4) return { label: 'MODERADO', color: '#FFCC00' };
    // 🔥 Atualizado para o Verde Neon oficial do PerformOS
    return { label: 'LEVE', color: '#4DE38F' };
};