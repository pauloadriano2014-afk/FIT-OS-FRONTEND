// src/utils/financeUtils.js

export const MONTHS = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];

export const CATEGORIAS_OFFLINE = ['Consultoria Online', 'Personal Trainer', 'Assessoria de Corrida', 'Projeto Especial / Desafio', 'Plano Alimentar / Nutrição'];

export const calcularProximaData = (dataBaseIso, tipoContrato) => {
    const data = dataBaseIso ? new Date(dataBaseIso) : new Date();
    let novaData = new Date(data.getTime());
    switch (tipoContrato) {
        case 'Mensal': novaData.setMonth(novaData.getMonth() + 1); break;
        case 'Trimestral': novaData.setMonth(novaData.getMonth() + 3); break;
        case 'Semestral': novaData.setMonth(novaData.getMonth() + 6); break;
        case 'Anual': novaData.setFullYear(novaData.getFullYear() + 1); break;
        case 'Projeto 90 Dias': novaData.setDate(novaData.getDate() + 90); break;
        case 'Ficha 8 Semanas': novaData.setDate(novaData.getDate() + 56); break;
        default: novaData.setMonth(novaData.getMonth() + 1);
    }
    return novaData.toISOString();
};

export const calcularDataAnterior = (dataBaseIso, tipoContrato) => {
    const data = dataBaseIso ? new Date(dataBaseIso) : new Date();
    let novaData = new Date(data.getTime());
    switch (tipoContrato) {
        case 'Mensal': novaData.setMonth(novaData.getMonth() - 1); break;
        case 'Trimestral': novaData.setMonth(novaData.getMonth() - 3); break;
        case 'Semestral': novaData.setMonth(novaData.getMonth() - 6); break;
        case 'Anual': novaData.setFullYear(novaData.getFullYear() - 1); break;
        case 'Projeto 90 Dias': novaData.setDate(novaData.getDate() - 90); break;
        case 'Ficha 8 Semanas': novaData.setDate(novaData.getDate() - 56); break;
        default: novaData.setMonth(novaData.getMonth() - 1);
    }
    return novaData.toISOString();
};

export const getDueDateStatus = (isoDate, theme) => {
    if (!isoDate) return { days: 0, color: theme.textSecondary, label: 'SEM DATA', border: theme.border };
    const target = new Date(isoDate);
    const today = new Date();
    target.setHours(0,0,0,0);
    today.setHours(0,0,0,0);

    const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 3600 * 24));

    if (diffDays <= 0) return { days: diffDays, color: theme.isDark ? '#FFF' : '#000', label: 'VENCIDO', border: theme.isDark ? '#555' : '#333' }; 
    if (diffDays <= 3) return { days: diffDays, color: '#FF3B30', label: 'URGENTE', border: '#FF3B30' }; 
    if (diffDays <= 7) return { days: diffDays, color: '#FF9500', label: 'ATENÇÃO', border: '#FF9500' }; 
    return { days: diffDays, color: '#34C759', label: 'NO PRAZO', border: '#34C759' }; 
};

export const forceMiddayUTC = (dateStr) => {
    if (!dateStr) return null;
    if (dateStr.includes('T')) return dateStr;
    return `${dateStr}T12:00:00Z`;
};

export const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);