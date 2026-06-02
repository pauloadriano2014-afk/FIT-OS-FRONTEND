// src/utils/feedbackGenerator.js

export const generateAutoFeedback = (sortedData) => {
    if (!sortedData || sortedData.length < 2) return "";

    const oldest = sortedData[0];
    const newest = sortedData[sortedData.length - 1];

    const deltaWeight = (newest.weight - oldest.weight).toFixed(1);
    const deltaBF = newest.bodyFat && oldest.bodyFat ? (newest.bodyFat - oldest.bodyFat).toFixed(1) : null;
    const deltaAbdomen = newest.foldAbdominal && oldest.foldAbdominal ? (newest.foldAbdominal - oldest.foldAbdominal).toFixed(1) : null;

    let feedback = "ANÁLISE TÉCNICA DE EVOLUÇÃO CORPORAL:\n";

    if (deltaBF && deltaBF < 0) {
        feedback += `Excelente resposta ao protocolo de definição (Cutting)! Houve uma queima expressiva de gordura, reduzindo seu percentual (BF) em ${Math.abs(deltaBF)}%. `;
        if (deltaWeight < 0) {
            feedback += `O peso total na balança desceu ${Math.abs(deltaWeight)}kg, consolidando o processo e poupando a massa magra ao máximo. `;
        }
    } else if (deltaWeight > 0) {
        if (deltaBF && deltaBF <= 0.5) {
            feedback += `Ótimo trabalho na fase de construção (Bulking Limpo)! Você adicionou ${deltaWeight}kg de peso na balança mantendo o percentual de gordura controlado. `;
        } else {
            feedback += `Houve um ganho de ${deltaWeight}kg no peso total neste período de construção. `;
        }
    } else {
        feedback += `O peso corporal manteve-se estável, indicando uma excelente fase de consolidação e manutenção da densidade. `;
    }

    if (deltaAbdomen && deltaAbdomen <= -2) {
        feedback += `\nDestaque absoluto para a secagem na dobra abdominal, que reduziu incríveis ${Math.abs(deltaAbdomen)}mm, mostrando forte adesão à dieta e aos cardios. `;
    }

    feedback += "\nA estratégia atual está validada e deve ser mantida.";

    return feedback;
};