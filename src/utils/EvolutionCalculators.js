// src/utils/EvolutionCalculators.js

export const calculateBodyFat = (gender, age, rawFolds) => {
    const cleanVal = (v) => Number(String(v).replace(',', '.') || 0);
    const sum = cleanVal(rawFolds.foldChest) + cleanVal(rawFolds.foldAxillary) + cleanVal(rawFolds.foldTriceps) + 
                cleanVal(rawFolds.foldSubscapular) + cleanVal(rawFolds.foldAbdominal) + cleanVal(rawFolds.foldSuprailiac) + 
                cleanVal(rawFolds.foldThigh);
    if (sum === 0) return 0;
    
    let density = 0;
    const ageVal = Number(age);
    
    if (gender === 'MASCULINO') {
        density = 1.112 - (0.00043499 * sum) + (0.00000055 * sum * sum) - (0.00028826 * ageVal);
    } else {
        density = 1.097 - (0.00046971 * sum) + (0.00000056 * sum * sum) - (0.00012828 * ageVal);
    }
    
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

export const getGoogleDrivePreviewUrl = (url) => {
    if (!url) return '';
    if (url.includes('drive.google.com/file/d/')) {
        return url.replace(/\/view.*$/, '/preview');
    }
    return url;
};