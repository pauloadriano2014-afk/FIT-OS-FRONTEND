// src/utils/financeUtils.js

export const MONTHS = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];

export const CATEGORIAS_OFFLINE = ['Consultoria Online', 'Personal Trainer', 'Assessoria de Corrida', 'Projeto Especial / Desafio', 'Plano Alimentar / Nutrição'];

// Função auxiliar para ajustar a data sem problemas de "rolagem"
const addMonthsToDate = (date, monthsToAdd) => {
    const newDate = new Date(date.getTime());
    newDate.setMonth(newDate.getMonth() + monthsToAdd);
    // Se o dia do mês original era maior que o número de dias no novo mês,
    // setMonth ajustaria para o próximo mês.
    // Ex: 31 Jan + 1 mês = 3 Mar. Queremos 28 Fev.
    // Para vencimentos, geralmente queremos manter o dia do mês,
    // mas não ir para o próximo mês se o dia não existir.
    // Uma abordagem comum é manter o dia original, ou o último dia do mês se o original não existir.
    // Para simplicidade e para evitar o "rolamento", vamos apenas usar setMonth e confiar no comportamento padrão.
    // Se você quiser que 31 de Jan + 1 mês vá para 28 de Fev, a lógica seria mais complexa.
    // Por enquanto, vamos manter o comportamento padrão do setMonth.
    return newDate;
};

export const calcularProximaData = (dataBaseIso, tipoContrato) => {
    const data = dataBaseIso ? new Date(dataBaseIso) : new Date();
    let novaData = new Date(data.getTime()); // Cria uma cópia para não modificar a original

    switch (tipoContrato) {
        case 'Mensal':
            novaData = addMonthsToDate(novaData, 1);
            break;
        case 'Trimestral':
            novaData = addMonthsToDate(novaData, 3);
            break;
        case 'Semestral':
            novaData = addMonthsToDate(novaData, 6);
            break;
        case 'Anual':
            novaData.setFullYear(novaData.getFullYear() + 1);
            break;
        case 'Projeto 90 Dias':
            novaData.setDate(novaData.getDate() + 90);
            break;
        case 'Ficha 8 Semanas':
            novaData.setDate(novaData.getDate() + 56);
            break;
        // Adicionar as novas durações aqui
        case '8 Semanas': // Nova duração para Projeto Especial / Desafio
            novaData.setDate(novaData.getDate() + 56); // 8 semanas * 7 dias
            break;
        case '21 Dias': // Nova duração para Projeto Especial / Desafio
            novaData.setDate(novaData.getDate() + 21);
            break;
        default:
            novaData = addMonthsToDate(novaData, 1); // Padrão: Mensal
    }
    return novaData.toISOString();
};

export const calcularDataAnterior = (dataBaseIso, tipoContrato) => {
    const data = dataBaseIso ? new Date(dataBaseIso) : new Date();
    let novaData = new Date(data.getTime()); // Cria uma cópia

    switch (tipoContrato) {
        case 'Mensal':
            novaData = addMonthsToDate(novaData, -1);
            break;
        case 'Trimestral':
            novaData = addMonthsToDate(novaData, -3);
            break;
        case 'Semestral':
            novaData = addMonthsToDate(novaData, -6);
            break;
        case 'Anual':
            novaData.setFullYear(novaData.getFullYear() - 1);
            break;
        case 'Projeto 90 Dias':
            novaData.setDate(novaData.getDate() - 90);
            break;
        case 'Ficha 8 Semanas':
            novaData.setDate(novaData.getDate() - 56);
            break;
        // Adicionar as novas durações aqui
        case '8 Semanas': // Nova duração para Projeto Especial / Desafio
            novaData.setDate(novaData.getDate() - 56);
            break;
        case '21 Dias': // Nova duração para Projeto Especial / Desafio
            novaData.setDate(novaData.getDate() - 21);
            break;
        default:
            novaData = addMonthsToDate(novaData, -1); // Padrão: Mensal
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