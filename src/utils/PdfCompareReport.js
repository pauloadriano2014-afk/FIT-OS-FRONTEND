// src/utils/PdfCompareReport.js
import { Platform, Alert } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { getCoachBrandForPdf, renderBrandBlockHtml, renderPlatformSealHtml } from './brandForPdf';

const getStyles = () => `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
    body { font-family: 'Inter', sans-serif; padding: 40px; color: #111; background-color: #fff; margin: 0; }
    .header { display: flex; justify-content: space-between; align-items: flex-end; padding-bottom: 15px; }
    .title { font-size: 30px; font-weight: 900; color: #111; text-transform: uppercase; letter-spacing: -1px; }
    .subtitle { font-size: 15px; color: #666; margin-top: 5px; }
    .gradient-bar { height: 4px; background: linear-gradient(90deg, #4DE38F, #9D00FF); border-radius: 2px; margin-bottom: 30px; }
    .card-container { display: flex; flex-wrap: wrap; gap: 15px; margin-bottom: 20px; page-break-inside: avoid; }
    .card { background: #f8f9fa; border: 1px solid #e5e5ea; padding: 20px; border-radius: 12px; flex: 1; min-width: 120px; text-align: center; position: relative; }
    .card-title { font-size: 11px; color: #888; font-weight: 700; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px; }
    .card-val { font-size: 24px; font-weight: 900; color: #111; }
    .highlight-green { color: #4DE38F; }
    .highlight-purple { color: #9D00FF; }
    .delta-badge { position: absolute; top: -10px; right: -10px; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 900; color: #fff; }
    .badge-green { background-color: #4DE38F; color: #000; }
    .badge-red { background-color: #FF3B30; }
    .badge-neutral { background-color: #888; }
    .table-wrap { margin-top: 15px; border-radius: 12px; overflow: hidden; border: 1px solid #e5e5ea; margin-bottom: 30px; page-break-inside: avoid; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 15px; text-align: center; border-bottom: 1px solid #eee; }
    th { background-color: #f4f5f7; color: #555; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    td { font-size: 15px; font-weight: 700; color: #333; }
    .label-left { text-align: left; }
    .section-title { color: #111; font-size: 16px; margin-top: 30px; margin-bottom: 15px; border-left: 4px solid #9D00FF; padding-left: 10px; font-weight: 900; text-transform: uppercase; page-break-after: avoid; }
    .photo-compare-row { display: flex; gap: 15px; margin-bottom: 20px; page-break-inside: avoid; }
    .photo-box { flex: 1; border: 1px solid #e5e5ea; border-radius: 8px; overflow: hidden; position: relative; background: #f8f9fa; }
    .photo-box img { width: 100%; display: block; object-fit: cover; aspect-ratio: 0.75; }
    .photo-label { position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); background: #111; color: #4DE38F; font-size: 10px; font-weight: 900; padding: 6px 12px; border-radius: 12px; letter-spacing: 1px; white-space: nowrap; }
    .footer { margin-top: 50px; text-align: center; font-size: 11px; color: #aaa; padding-top: 20px; border-top: 1px solid #eee; }
    .avoid-break { page-break-inside: avoid; }
`;

const getBaseHtml = (content) => `
<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>${getStyles()}</style></head><body>${content}<div class="footer">Laudo Técnico Gerado via Aplicativo Oficial ELITE FIT</div></body></html>
`;

const processAndSharePDF = async (htmlContent, title) => {
    try {
        const finalHtml = getBaseHtml(htmlContent);
        
        if (Platform.OS === 'web') { 
            const printWindow = window.open('', '', 'width=800,height=600');
            if (printWindow) {
                printWindow.document.write(finalHtml);
                printWindow.document.close();
                printWindow.focus();
                setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
            } else { Alert.alert("Atenção", "Permita os pop-ups no seu navegador para gerar o PDF."); }
        } else {
            const { uri } = await Print.printToFileAsync({ html: finalHtml });
            if (await Sharing.isAvailableAsync()) { 
                await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf', dialogTitle: title }); 
            }
        }
    } catch (e) { if (Platform.OS !== 'web') Alert.alert("Erro", "Não foi possível gerar o PDF."); }
};

export const generateComparePDF = async (selectedData, userData, customFeedback = null) => {
    if (selectedData.length < 2) return;

    // 🔥 Logo do COACH do aluno (marca personalizada), com fallback pro
    // padrão ELITE FIT se o coach ainda não subiu a própria logo.
    const coachBrand = await getCoachBrandForPdf(userData?.coachId);
    const headerBrandHtml = renderBrandBlockHtml(coachBrand, { boxWidthPx: 180, align: 'left', textColor: '#111' });
    const footerSealHtml = renderPlatformSealHtml({ boxWidthPx: 170, align: 'center' });

    const sortedData = [...selectedData].sort((a, b) => new Date(a.date) - new Date(b.date));
    const oldest = sortedData[0];
    const newest = sortedData[sortedData.length - 1];

    const dOld = new Date(oldest.date).toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit', year:'2-digit'});
    const dNew = new Date(newest.date).toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit', year:'2-digit'});

    const getVal = (ass, key) => {
        if (key === 'leanMass') return ass.weight && ass.bodyFat ? (ass.weight * (1 - ass.bodyFat/100)).toFixed(1) : null;
        if (key === 'foldSum') return ass.foldChest ? (ass.foldChest + ass.foldAxillary + ass.foldTriceps + ass.foldSubscapular + ass.foldAbdominal + ass.foldSuprailiac + ass.foldThigh).toFixed(1) : null;
        return ass[key];
    };

    const getDeltaBadge = (oldV, newV, isInverted = false) => {
        if (!oldV || !newV) return '';
        const diff = (newV - oldV).toFixed(1);
        if (diff > 0) return `<div class="delta-badge ${isInverted ? 'badge-green' : 'badge-red'}">+${diff}</div>`;
        if (diff < 0) return `<div class="delta-badge ${isInverted ? 'badge-red' : 'badge-green'}">${diff}</div>`;
        return `<div class="delta-badge badge-neutral">0</div>`;
    };

    const renderTableRow = (label, key, isPercentage = false, isInvertedLogic = false) => {
        const hasData = sortedData.some(ass => getVal(ass, key) != null);
        if (!hasData) return '';
        const oldestVal = parseFloat(getVal(sortedData[0], key));
        const newestVal = parseFloat(getVal(sortedData[sortedData.length - 1], key));
        let deltaHtml = '<td class="text-neutral">-</td>';
        if (!isNaN(oldestVal) && !isNaN(newestVal)) {
            const diff = (newestVal - oldestVal).toFixed(1);
            if (diff > 0) deltaHtml = `<td class="${isInvertedLogic ? 'text-green' : 'text-red'}">+${diff}</td>`;
            else if (diff < 0) deltaHtml = `<td class="${isInvertedLogic ? 'text-red' : 'text-green'}">${diff}</td>`;
            else deltaHtml = `<td class="text-neutral">0</td>`;
        }
        let cols = sortedData.map(ass => `<td>${getVal(ass, key) != null ? `${getVal(ass, key)}${isPercentage?'%':''}` : '-'}</td>`).join('');
        return `<tr><td class="label-left">${label}</td>${cols}${deltaHtml}</tr>`;
    };

    const headerCols = sortedData.map(ass => `<th>${new Date(ass.date).toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'})}</th>`).join('');
    
    let html = `
    <div class="header">
        <div style="display: flex; align-items: center; gap: 15px;">
            <div style="width: 180px; flex-shrink: 0;">${headerBrandHtml}</div>
            <div>
                <div class="title">Evolução Comparativa</div>
                <div class="subtitle">Aluno(a): <strong>${userData?.name || 'Aluno'}</strong></div>
            </div>
        </div>
        <div style="text-align: right; font-weight: 900; color: #9D00FF; font-size: 14px;">${dOld} ➔ ${dNew}</div>
    </div>
    <div class="gradient-bar"></div>`;
    
    const oldWeight = getVal(oldest, 'weight'); const newWeight = getVal(newest, 'weight');
    const oldBF = getVal(oldest, 'bodyFat'); const newBF = getVal(newest, 'bodyFat');
    const oldLM = getVal(oldest, 'leanMass'); const newLM = getVal(newest, 'leanMass');

    html += `<div class="card-container">
        <div class="card">${getDeltaBadge(oldWeight, newWeight, false)}<div class="card-title">Peso Atual</div><div class="card-val">${newWeight || '--'}kg</div></div>
        <div class="card">${getDeltaBadge(oldBF, newBF, false)}<div class="card-title">Gordura (BF)</div><div class="card-val highlight-green">${newBF ? newBF+'%' : '--'}</div></div>
        <div class="card">${getDeltaBadge(oldLM, newLM, true)}<div class="card-title">Massa Magra</div><div class="card-val highlight-purple">${newLM ? newLM+'kg' : '--'}</div></div>
    </div>`;
    
    html += `<div class="section-title">DOBRAS CUTÂNEAS (mm)</div>`;
    html += `<div class="table-wrap"><table><tr><th class="label-left">MÉTRICA</th>${headerCols}<th style="color:#9D00FF">DELTA</th></tr>${renderTableRow('Soma (7)', 'foldSum')}${renderTableRow('Peitoral', 'foldChest')}${renderTableRow('Axilar', 'foldAxillary')}${renderTableRow('Tríceps', 'foldTriceps')}${renderTableRow('Subescapular', 'foldSubscapular')}${renderTableRow('Abdominal', 'foldAbdominal')}${renderTableRow('Supra-ilíaca', 'foldSuprailiac')}${renderTableRow('Coxa', 'foldThigh')}</table></div>`;

    html += `<div class="section-title">PERIMETRIA COMPLETA (cm)</div>`;
    html += `<div class="table-wrap"><table><tr><th class="label-left">MÉTRICA</th>${headerCols}<th style="color:#9D00FF">DELTA</th></tr>
    ${renderTableRow('Tórax', 'chest')}
    ${renderTableRow('Ombros', 'shoulders')}
    ${renderTableRow('Cintura', 'waist')}
    ${renderTableRow('Abdômen', 'abdomen')}
    ${renderTableRow('Glúteos', 'hips')}
    ${renderTableRow('Braço Dir.', 'arms')}
    ${renderTableRow('Braço Esq.', 'armLeft')}
    ${renderTableRow('Antebraço Dir.', 'forearms')}
    ${renderTableRow('Antebraço Esq.', 'forearmLeft')}
    ${renderTableRow('Coxa Dir.', 'thighs')}
    ${renderTableRow('Coxa Esq.', 'thighLeft')}
    ${renderTableRow('Pant. Dir.', 'calves')}
    ${renderTableRow('Pant. Esq.', 'calfLeft')}
    </table></div>`;

    const renderPhotoCompare = (label, index) => {
        const oldP = oldest.photos && oldest.photos.length > index ? oldest.photos[index] : null;
        const newP = newest.photos && newest.photos.length > index ? newest.photos[index] : null;
        if (!oldP && !newP) return '';
        return `
        <h4 style="color: #9D00FF; text-align: center; text-transform: uppercase; margin-bottom: 10px;">${label}</h4>
        <div class="photo-compare-row">
            ${oldP ? `<div class="photo-box"><img src="${oldP}"/><div class="photo-label">ANTES (${dOld})</div></div>` : `<div class="photo-box" style="display:flex;align-items:center;justify-content:center;color:#ccc;background:#f8f9fa;">Sem Foto</div>`}
            ${newP ? `<div class="photo-box"><img src="${newP}"/><div class="photo-label">DEPOIS (${dNew})</div></div>` : `<div class="photo-box" style="display:flex;align-items:center;justify-content:center;color:#ccc;background:#f8f9fa;">Sem Foto</div>`}
        </div>`;
    };

    if ((oldest.photos && oldest.photos.length > 0) || (newest.photos && newest.photos.length > 0)) {
        html += `<div class="avoid-break" style="margin-top: 20px;">`; 
        html += `<div class="section-title" style="margin-top: 0;">EVOLUÇÃO VISUAL</div>`;
        html += renderPhotoCompare('VISTA FRONTAL', 0);
        html += renderPhotoCompare('VISTA LATERAL', 1);
        html += renderPhotoCompare('VISTA POSTERIOR', 2);
        html += `</div>`;
    }

    if (customFeedback) {
        html += `<div class="section-title">PARECER TÉCNICO ELITE FIT</div>`;
        html += `<div class="avoid-break" style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; font-size: 14px; color: #333; line-height: 1.6; white-space: pre-wrap; font-weight: 500; border: 1px solid #e5e5ea;">${customFeedback}</div>`;
    }

    html += `
    <div class="avoid-break" style="text-align: center; margin-top: 50px; padding-top: 30px;">
        ${footerSealHtml}
        <p style="font-size: 10px; color: #888; font-weight: 700; letter-spacing: 2px; margin-top: 10px;">EXCELÊNCIA EM RESULTADOS</p>
    </div>
    `;

    processAndSharePDF(html, 'Comparativo_Evolucao');
};