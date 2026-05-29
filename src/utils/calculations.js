export const calculateBodyFat = (gender, age, rawFolds) => {
    const cleanVal = (v) => Number(String(v).replace(',', '.') || 0);
    const sum = cleanVal(rawFolds.chest) + cleanVal(rawFolds.axillary) + cleanVal(rawFolds.triceps) + 
                cleanVal(rawFolds.subscapular) + cleanVal(rawFolds.abdominal) + cleanVal(rawFolds.suprailiac) + 
                cleanVal(rawFolds.thigh);
    if (sum === 0) return 0;
    let density = 0;
    const ageVal = Number(age);
    if (gender === 'MASCULINO') density = 1.112 - (0.00043499 * sum) + (0.00000055 * sum * sum) - (0.00028826 * ageVal);
    else density = 1.097 - (0.00046971 * sum) + (0.00000056 * sum * sum) - (0.00012828 * ageVal);
    const bf = ((4.95 / density) - 4.50) * 100;
    return bf > 0 ? bf.toFixed(1) : 0;
};

export const getAgeFromDate = (birthDate) => {
    if (!birthDate) return '';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age.toString();
};

export const getRpeInfo = (val) => {
    if (val >= 9) return { label: 'FALHA', color: '#BF5AF2' };
    if (val >= 8) return { label: 'INTENSO', color: '#FF3B30' };
    if (val >= 6) return { label: 'MÉDIO', color: '#FF9500' };
    if (val >= 4) return { label: 'MODERADO', color: '#FFCC00' };
    return { label: 'LEVE', color: '#32ADE6' };
};