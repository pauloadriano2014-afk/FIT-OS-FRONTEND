// src/utils/PdfSingleReport.js
import { Platform, Alert } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

// 🔥 FAREJADOR DE GÊNERO DEFINITIVO: Busca direto na avaliação (onde o backend injeta) ou no userData 🔥
const isFemaleDetector = (userData, assessment) => {
    const rawGender = assessment?.user?.gender || 
                      assessment?.user?.sexo || 
                      userData?.gender || 
                      userData?.sexo || 
                      assessment?.gender || 
                      '';
    const g = String(rawGender).toUpperCase().trim();
    return g.startsWith('F') || g === 'MULHER' || g === 'FEMININO' || g === 'FEMALE';
};

const generateRadarChart = (scores) => {
    const centerX = 150; const centerY = 150; const maxRadius = 100;
    let bgWebs = ''; let axesLines = ''; let dataPoints = ''; let dots = ''; let labelsSvg = '';
    const labels = ['OMBROS', 'COSTAS', 'BRAÇOS', 'GLÚTEOS', 'COXAS', 'PANTURRILHAS'];

    for(let level of [2,4,6,8,10]) {
        let r = (level/10) * maxRadius; let points = '';
        for(let i=0; i<6; i++) {
            let angle = (Math.PI * 2 * i) / 6 - Math.PI/2;
            points += `${centerX + r * Math.cos(angle)},${centerY + r * Math.sin(angle)} `;
        }
        bgWebs += `<polygon points="${points.trim()}" fill="none" stroke="#e5e5ea" stroke-width="1"/>`;
    }

    for(let i=0; i<6; i++) {
        let angle = (Math.PI * 2 * i) / 6 - Math.PI/2;
        let x = centerX + maxRadius * Math.cos(angle); let y = centerY + maxRadius * Math.sin(angle);
        axesLines += `<line x1="${centerX}" y1="${centerY}" x2="${x}" y2="${y}" stroke="#e5e5ea" stroke-width="1"/>`;
        
        let lx = centerX + (maxRadius + 25) * Math.cos(angle); let ly = centerY + (maxRadius + 15) * Math.sin(angle);
        let anchor = lx < centerX - 10 ? 'end' : (lx > centerX + 10 ? 'start' : 'middle');
        labelsSvg += `<text x="${lx}" y="${ly}" text-anchor="${anchor}" fill="#666" font-size="10" font-weight="900" font-family="sans-serif">${labels[i]}</text>`;
        
        let rData = (scores[i]/10) * maxRadius;
        let dx = centerX + rData * Math.cos(angle); let dy = centerY + rData * Math.sin(angle);
        dataPoints += `${dx},${dy} `;
        dots += `<circle cx="${dx}" cy="${dy}" r="4" fill="#4DE38F" stroke="#111" stroke-width="2"/>`;
    }

    return `<svg width="100%" height="280" viewBox="0 0 300 300" style="display:block; margin: 0 auto;">
        ${bgWebs}${axesLines}
        <polygon points="${dataPoints.trim()}" fill="rgba(157, 0, 255, 0.2)" stroke="#9D00FF" stroke-width="3"/>
        ${dots}${labelsSvg}
    </svg>`;
};

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
    .list-item { display: flex; align-items: flex-start; margin-bottom: 8px; font-size: 12px; color: #555; line-height: 1.5; }
    .list-icon { margin-right: 8px; font-size: 14px; }
`;

const getBaseHtml = (content) => `
<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>${getStyles()}</style></head><body>${content}<div class="footer">Laudo Técnico Gerado via Aplicativo Oficial PA ELITE TEAM</div></body></html>
`;

export const processAndSharePDF = async (htmlContent, title) => {
    try {
        const finalHtml = getBaseHtml(htmlContent);
        if (Platform.OS === 'web') { 
            const printWindow = window.open('', '', 'width=800,height=600');
            if (printWindow) {
                printWindow.document.write(finalHtml); printWindow.document.close(); printWindow.focus();
                setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
            } else { Alert.alert("Atenção", "Permita os pop-ups."); }
        } else {
            const { uri } = await Print.printToFileAsync({ html: finalHtml });
            if (await Sharing.isAvailableAsync()) { await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf', dialogTitle: title }); }
        }
    } catch (e) { if (Platform.OS !== 'web') Alert.alert("Erro", "Não foi possível gerar o PDF."); }
};

export const generateSinglePDF = (assessment, userData, customFeedback = null) => {
    const d = new Date(assessment.date).toLocaleDateString('pt-BR');
    const leanMassRaw = assessment.bodyFat ? (assessment.weight * (1 - assessment.bodyFat / 100)) : null;
    const leanMass = leanMassRaw ? leanMassRaw.toFixed(1) : '--';
    const sum = (assessment.foldChest||0) + (assessment.foldAxillary||0) + (assessment.foldTriceps||0) + (assessment.foldSubscapular||0) + (assessment.foldAbdominal||0) + (assessment.foldSuprailiac||0) + (assessment.foldThigh||0);
    
    const tmbCalc = leanMassRaw ? Math.round(370 + (21.6 * leanMassRaw)) : null;
    const tmbDisplay = tmbCalc ? tmbCalc : '--';

    // 🔥 GÊNERO À PROVA DE BALAS INTEGRADO 🔥
    const isFemale = isFemaleDetector(userData, assessment);
    const pron = isFemale ? 'A avaliada' : 'O avaliado';
    
    const heightDisplay = assessment.height ? ` | Altura: <strong>${assessment.height}m</strong>` : '';
    const bf = assessment.bodyFat ? parseFloat(assessment.bodyFat) : null;

    let asymmetries = [];
    const checkAsym = (r, l, name) => { if (r && l && Math.abs(parseFloat(r) - parseFloat(l)) >= 1.0) asymmetries.push(name); };
    checkAsym(assessment.arms, assessment.armLeft, 'Braços'); checkAsym(assessment.forearms, assessment.forearmLeft, 'Antebraços');
    checkAsym(assessment.thighs, assessment.thighLeft, 'Coxas'); checkAsym(assessment.calves, assessment.calfLeft, 'Panturrilhas');

    const o_c = (assessment.shoulders && assessment.waist) ? (assessment.shoulders / assessment.waist) : 0;
    const c_q = (assessment.waist && assessment.hips) ? (assessment.waist / assessment.hips) : 0;
    const t_q = (assessment.chest && assessment.hips) ? (assessment.chest / assessment.hips) : 0;

    let compCorpText = '--'; let simetriaText = '--'; let condicText = '--'; let potencialText = '--';
    if (bf) {
        compCorpText = isFemale ? (bf < 18 ? 'Excelente' : bf <= 24 ? 'Boa' : 'Em Evolução') : (bf < 12 ? 'Excelente' : bf <= 18 ? 'Boa' : 'Em Evolução');
        condicText = bf < (isFemale ? 18 : 12) ? 'Avançado' : (bf < (isFemale ? 24 : 18) ? 'Muito Bom' : 'Desenvolvendo');
    }
    simetriaText = asymmetries.length === 0 ? 'Excelente' : asymmetries.length <= 1 ? 'Boa' : 'Com Desvios';
    if (o_c > 0) potencialText = o_c >= (isFemale ? 1.3 : 1.5) ? 'Alto' : 'Bom';

    let html = `
    <div class="header">
        <div style="display: flex; align-items: center; gap: 15px;">
            <img src="https://pub-8d1e734f810f4342a0e77c4220bee5b2.r2.dev/assessments/fc557a0a-ef63-44a9-81d4-213e24adf2eb/logo%20pa%20elite%20team.png" style="height: 60px; object-fit: contain;" />
            <div>
                <div class="title">Avaliação Física</div>
                <div class="subtitle">Aluno(a): <strong>${userData?.name || 'Aluno'}</strong>${heightDisplay}</div>
            </div>
        </div>
        <div style="text-align: right; font-weight: 900; color: #9D00FF; font-size: 14px;">${d}</div>
    </div>
    <div class="gradient-bar"></div>`;

    html += `
    <div class="avoid-break" style="background: #111; border-radius: 12px; padding: 20px; margin-bottom: 20px; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 10px; border: 1px solid #333; box-shadow: 0 4px 15px rgba(157, 0, 255, 0.15);">
        <div style="flex: 1; min-width: 22%; text-align: center; border-right: 1px solid #333;">
            <span style="color: #888; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px;">Composição Corporal</span><br><strong style="color: #4DE38F; font-size: 15px;">${compCorpText}</strong>
        </div>
        <div style="flex: 1; min-width: 22%; text-align: center; border-right: 1px solid #333;">
            <span style="color: #888; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px;">Simetria</span><br><strong style="color: #4DE38F; font-size: 15px;">${simetriaText}</strong>
        </div>
        <div style="flex: 1; min-width: 22%; text-align: center; border-right: 1px solid #333;">
            <span style="color: #888; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px;">Condicionamento</span><br><strong style="color: #fff; font-size: 15px;">${condicText}</strong>
        </div>
        <div style="flex: 1; min-width: 22%; text-align: center;">
            <span style="color: #888; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px;">Potencial Estético</span><br><strong style="color: #fff; font-size: 15px;">${potencialText}</strong>
        </div>
    </div>`;

    html += `
    <div class="card-container">
        <div class="card"><div class="card-title">Peso Atual</div><div class="card-val">${assessment.weight}kg</div></div>
        <div class="card"><div class="card-title">Gordura (BF)</div><div class="card-val highlight-green">${bf ? bf+'%' : '--'}</div></div>
        <div class="card"><div class="card-title">Massa Magra</div><div class="card-val highlight-purple">${leanMass}kg</div></div>
        <div class="card"><div class="card-title">Metabolismo (TMB)</div><div class="card-val" style="font-size: 20px; line-height: 28px;">${tmbDisplay} <span style="font-size: 12px; color: #888;">kcal/dia</span></div></div>
    </div>`;
    
    if (assessment.method === 'POLLOCK') {
        html += `<div class="section-title">DOBRAS CUTÂNEAS (mm)</div><div class="table-wrap" style="margin-bottom: 15px;"><table><tr><th>Peitoral</th><th>Axilar</th><th>Tríceps</th><th>Subescapular</th></tr><tr><td>${assessment.foldChest || '-'}</td><td>${assessment.foldAxillary || '-'}</td><td>${assessment.foldTriceps || '-'}</td><td>${assessment.foldSubscapular || '-'}</td></tr><tr><th>Abdominal</th><th>Supra-ilíaca</th><th>Coxa</th><th style="color:#9D00FF">SOMA TOTAL</th></tr><tr><td>${assessment.foldAbdominal || '-'}</td><td>${assessment.foldSuprailiac || '-'}</td><td>${assessment.foldThigh || '-'}</td><td style="color:#9D00FF; font-weight: 900;">${sum > 0 ? sum.toFixed(1) : '-'}</td></tr></table></div>`;
        html += `
        <div class="avoid-break" style="background-color: #f8f9fa; border-left: 4px solid #9D00FF; padding: 15px; margin-top: 10px; border-radius: 8px; margin-bottom: 30px;">
            <h4 style="margin: 0 0 10px 0; color: #111; font-size: 13px; text-transform: uppercase;">Entenda o seu Corpo (Método Pollock)</h4>
            <ul style="margin: 0; padding-left: 20px; font-size: 11px; color: #555; line-height: 1.6;">
                <li><strong>Abdominal / Supra-ilíaca:</strong> Respondem diretamente à dieta. Refletem o saldo calórico.</li>
                <li><strong>Tríceps / Coxa:</strong> Áreas de proteção (influência genética). Exigem mais paciência.</li>
                <li><strong>Peitoral / Subescapular / Axilar:</strong> Gordura do tronco. Reduzi-las melhora drasticamente a postura visual.</li>
            </ul>
        </div>`;
    }

    const hasAnyMeasure = !!(assessment.chest || assessment.shoulders || assessment.waist || assessment.abdomen || assessment.hips || assessment.arms || assessment.armLeft || assessment.forearms || assessment.forearmLeft || assessment.thighs || assessment.thighLeft || assessment.calves || assessment.calfLeft);

    if (hasAnyMeasure) {
        html += `<div class="section-title">DISTRIBUIÇÃO CORPORAL & ÍNDICES ESTÉTICOS</div>
        <div style="display: flex; gap: 15px; margin-bottom: 20px;" class="avoid-break">
            <div style="flex: 1; background: #f8f9fa; border: 1px solid #e5e5ea; border-radius: 12px; padding: 20px;">
                <h4 style="margin: 0 0 15px 0; font-size: 11px; text-transform: uppercase; color: #888;">Distribuição Principal</h4>
                <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 10px;"><strong>Ombros</strong><span style="font-weight:900;">${assessment.shoulders || '-'} cm</span></div>
                <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 10px;"><strong>Cintura</strong><span style="font-weight:900;">${assessment.waist || '-'} cm</span></div>
                <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 10px;"><strong>Abdômen</strong><span style="font-weight:900;">${assessment.abdomen || '-'} cm</span></div>
                <div style="display: flex; justify-content: space-between;"><strong>Glúteos</strong><span style="font-weight:900;">${assessment.hips || '-'} cm</span></div>
            </div>
            <div style="flex: 1; background: #f8f9fa; border: 1px solid #e5e5ea; border-radius: 12px; padding: 20px;">
                <h4 style="margin: 0 0 5px 0; font-size: 11px; text-transform: uppercase; color: #888;">Índices de Proporção</h4>
                <p style="font-size: 9px; color: #aaa; margin: 0 0 15px 0; line-height: 1.3;">Métricas que definem o formato e a estética da sua estrutura corporal.</p>
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-bottom: 8px;">
                    <div style="line-height: 1.2;"><strong>Ombro / Cintura</strong><br><span style="font-size: 8px; color: #888;">Avalia o formato V-Taper</span></div><span style="color:#9D00FF; font-weight:900; font-size: 13px;">${o_c > 0 ? o_c.toFixed(2)+'x' : '-'}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-bottom: 8px;">
                    <div style="line-height: 1.2;"><strong>Cintura / Quadril</strong><br><span style="font-size: 8px; color: #888;">Padrão da linha de cintura</span></div><span style="color:#9D00FF; font-weight:900; font-size: 13px;">${c_q > 0 ? c_q.toFixed(2)+'x' : '-'}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="line-height: 1.2;"><strong>Tórax / Quadril</strong><br><span style="font-size: 8px; color: #888;">Equilíbrio Superior/Inferior</span></div><span style="color:#9D00FF; font-weight:900; font-size: 13px;">${t_q > 0 ? t_q.toFixed(2)+'x' : '-'}</span>
                </div>
            </div>
        </div>`;

        html += `<div class="section-title">PERIMETRIA DE MEMBROS (cm)</div><div class="table-wrap" style="margin-bottom: 30px;"><table>
            <tr><th class="label-left">Região Muscular</th><th>Lado Direito</th><th>Lado Esquerdo</th></tr>
            ${(assessment.arms || assessment.armLeft) ? `<tr><td class="label-left">Braços</td><td>${assessment.arms || '-'}</td><td>${assessment.armLeft || '-'}</td></tr>` : ''}
            ${(assessment.forearms || assessment.forearmLeft) ? `<tr><td class="label-left">Antebraços</td><td>${assessment.forearms || '-'}</td><td>${assessment.forearmLeft || '-'}</td></tr>` : ''}
            ${(assessment.thighs || assessment.thighLeft) ? `<tr><td class="label-left">Coxas</td><td>${assessment.thighs || '-'}</td><td>${assessment.thighLeft || '-'}</td></tr>` : ''}
            ${(assessment.calves || assessment.calfLeft) ? `<tr><td class="label-left">Panturrilhas</td><td>${assessment.calves || '-'}</td><td>${assessment.calfLeft || '-'}</td></tr>` : ''}
        </table></div>`;

        const radarScores = isFemale ? [6, 6, 5, 9, 8, 6] : [8, 8, 7, 5, 6, 5]; 
        const interpText = isFemale 
            ? "Os membros inferiores (glúteos e coxas) são o grande destaque. Contudo, é fundamental dar a devida atenção ao desenvolvimento de ombros e dorsais para construir o formato 'ampulheta', harmonizando o físico como um todo e afinando visualmente a cintura."
            : "O tronco apresenta um excelente volume, com destaque para a linha de ombros e costas. O foco crítico agora é garantir que os membros inferiores (coxas e panturrilhas) acompanhem esse desenvolvimento, evitando qualquer desproporção visual no conjunto da obra.";

        html += `
        <div class="avoid-break" style="margin-bottom: 25px; padding-top: 20px;">
            <div class="section-title" style="margin-top: 0;">🎯 MAPA DE DESENVOLVIMENTO MUSCULAR</div>
            <p style="font-size: 12px; color: #666; margin: 0 0 20px 0;">Visualização estratégica dos grupos musculares com maior e menor desenvolvimento relativo (Escala 0-10).</p>
            ${generateRadarChart(radarScores)}
            <div style="background-color: #f8f9fa; border-left: 4px solid #4DE38F; padding: 15px; margin-top: 20px; border-radius: 8px;">
                <h4 style="margin: 0 0 8px 0; color: #111; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Interpretação Clínica</h4>
                <p style="font-size: 11px; color: #555; margin: 0; line-height: 1.6;">${interpText}</p>
            </div>
        </div>`;
    }

    if (tmbCalc && bf) {
        const getCalc = Math.round(tmbCalc * 1.5); 
        const activeBurn = getCalc - tmbCalc;
        
        html += `
        <div class="avoid-break" style="margin-bottom: 25px; background: #f8f9fa; border: 1px solid #e5e5ea; border-radius: 12px; padding: 20px;">
            <h4 style="margin: 0 0 15px 0; color: #111; font-size: 12px; text-transform: uppercase;">🔥 Dinâmica de Gasto Calórico (Estimativa)</h4>
            <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                <div style="flex: 1; text-align: center; padding: 10px; border-right: 1px solid #ddd;">
                    <span style="font-size: 9px; color: #888; text-transform: uppercase;">Metabolismo Basal</span><br>
                    <strong style="color: #111; font-size: 14px;">${tmbCalc} kcal</strong>
                </div>
                <div style="flex: 1; text-align: center; padding: 10px; border-right: 1px solid #ddd;">
                    <span style="font-size: 9px; color: #888; text-transform: uppercase;">Treino + Atividade</span><br>
                    <strong style="color: #9D00FF; font-size: 14px;">+${activeBurn} kcal</strong>
                </div>
                <div style="flex: 1; text-align: center; padding: 10px; background: #111; border-radius: 8px;">
                    <span style="font-size: 9px; color: #4DE38F; text-transform: uppercase;">Gasto Total (GET)</span><br>
                    <strong style="color: #4DE38F; font-size: 14px;">${getCalc} kcal</strong>
                </div>
            </div>
            <p style="font-size: 10px; color: #666; margin: 0; line-height: 1.4;"><strong>Entenda:</strong> Seu corpo queima ${tmbCalc} kcal apenas para se manter vivo. O treinamento e sua rotina adicionam um gasto estimado de ${activeBurn} kcal. O ajuste na sua dieta é calculado com base no Gasto Total (${getCalc} kcal) para otimizar a queima de gordura e preservar massa magra.</p>
        </div>`;

        let precoShapeText = '';
        if ((isFemale && bf >= 20) || (!isFemale && bf >= 15)) {
            precoShapeText = 'Para avançar para o próximo estágio, o foco absoluto deve ser na construção de hábitos sustentáveis. Constância é mais importante que perfeição. Adesão de 75-80% ao plano alimentar e constância nos treinos semanais já farão uma mudança drástica na sua composição.';
        } else if ((isFemale && bf >= 15) || (!isFemale && bf >= 10)) {
            precoShapeText = 'Neste estágio, o corpo exige mais precisão. Para secar e manter o volume, você precisará de uma adesão de 85% à dieta e aplicação de sobrecarga progressiva nos treinos. O cardio deve ser cumprido e as refeições livres devem ser milimetricamente planejadas.';
        } else {
            precoShapeText = 'Para manter ou aprimorar este nível avançado de definição, é exigida uma adesão de 90-95% ao plano alimentar, treinamento de altíssima intensidade 5 a 6 vezes na semana e um controle rígido sobre o álcool e refeições livres. É um físico de elite que demanda mentalidade inabalável.';
        }

        html += `
        <div class="avoid-break" style="margin-bottom: 30px; background: #111; border-left: 4px solid #9D00FF; padding: 15px; border-radius: 8px; box-shadow: 0 4px 15px rgba(157, 0, 255, 0.1);">
            <h4 style="margin: 0 0 8px 0; color: #fff; font-size: 12px; text-transform: uppercase;">⚖️ O Preço do Shape</h4>
            <p style="font-size: 10px; color: #ccc; margin: 0; line-height: 1.5;">${precoShapeText}</p>
        </div>`;
    }

    // 🔥 IMAGEM DE POSICIONAMENTO RESTAURADA 🔥
    if (bf) {
        let stageIdx = 0;
        if (bf >= 30) stageIdx = 1; else if (bf >= 20) stageIdx = 2; else if (bf >= 15) stageIdx = 3; else if (bf >= 10) stageIdx = 4; else if (bf > 0) stageIdx = 5;

        if (stageIdx > 0) {
            const imgUrl = isFemale ? 'https://pub-8d1e734f810f4342a0e77c4220bee5b2.r2.dev/assessments/fc557a0a-ef63-44a9-81d4-213e24adf2eb/ChatGPT%20Image%202%20de%20jun.%20de%202026%2C%2009_51_37.png' : 'https://pub-8d1e734f810f4342a0e77c4220bee5b2.r2.dev/assessments/fc557a0a-ef63-44a9-81d4-213e24adf2eb/ChatGPT%20Image%202%20de%20jun.%20de%202026%2C%2009_56_45.png';
            html += `
            <div class="avoid-break" style="margin-bottom: 40px;">
                <h4 style="margin: 0 0 15px 0; color: #111; font-size: 13px; text-transform: uppercase;">🎯 Posicionamento de Estágio Atual</h4>
                <div style="position: relative; width: 100%; display: inline-block;">
                    <img src="${imgUrl}" style="width: 100%; display: block; border-radius: 12px; border: 1px solid #e5e5ea;" />
                    <div style="position: absolute; border: 3px solid #9D00FF; top: 0; bottom: 0; left: ${(stageIdx - 1) * 20}%; width: 20%; border-radius: 12px; box-sizing: border-box; background: rgba(157, 0, 255, 0.05); z-index: 10; box-shadow: 0 0 15px rgba(157,0,255,0.3);">
                        <div style="position: absolute; top: -10px; left: 0; right: 0; text-align: center; z-index: 11;">
                            <span style="background: #9D00FF; color: #fff; font-size: 8px; font-weight: 900; padding: 3px 8px; border-radius: 4px; letter-spacing: 0.5px; text-transform: uppercase; white-space: nowrap;">VOCÊ ESTÁ AQUI</span>
                        </div>
                    </div>
                </div>
            </div>`;
        }
    }

    let diagHtml = `<div class="section-title">DIAGNÓSTICO TÉCNICO & SAÚDE</div><div style="background-color: #f8f9fa; border: 1px solid #e5e5ea; padding: 0 20px; border-radius: 12px; margin-bottom: 30px;">`;
    
    const renderIndicatorRow = (title, desc, value, color) => `
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e5e5ea; padding: 15px 0;">
            <div style="width: 65%;"><strong style="font-size: 12px; color: #111;">${title}</strong><p style="font-size: 10px; color: #666; margin: 4px 0 0 0; line-height: 1.4;">${desc}</p></div>
            <div style="width: 35%; text-align: right;"><span style="background: #111; color: ${color}; padding: 6px 12px; border-radius: 6px; font-weight: 900; font-size: 11px; letter-spacing: 0.5px; display: inline-block; text-align: center;">${value}</span></div>
        </div>`;

    if (c_q > 0) {
        let rcqRisk = '', rcqColor = '', rcqDesc = '';
        if (isFemale) {
            if (c_q > 0.85) { rcqRisk = 'Androide (Alerta)'; rcqColor = '#FF3B30'; rcqDesc = 'Tendência de acúmulo na região abdominal.'; } 
            else { rcqRisk = 'Ginoide (Excelente)'; rcqColor = '#4DE38F'; rcqDesc = 'Padrão feminino clássico. Cintura preservada em relação ao quadril.'; }
        } else {
            if (c_q > 0.95) { rcqRisk = 'Androide (Alerta)'; rcqColor = '#FF3B30'; rcqDesc = 'Acúmulo na região abdominal (visceral). Risco metabólico.'; } 
            else { rcqRisk = 'Padrão Normal'; rcqColor = '#4DE38F'; rcqDesc = 'Distribuição de medidas dentro de um padrão estético seguro.'; }
        }
        diagHtml += renderIndicatorRow('Saúde e Distribuição (RCQ)', rcqDesc, `${c_q.toFixed(2)}<br><span style="font-size:9px; font-weight:normal;">${rcqRisk}</span>`, rcqColor);
    }
    diagHtml = diagHtml.replace(/border-bottom: 1px solid #e5e5ea;(?!.*border-bottom: 1px solid #e5e5ea;)/, ''); 
    diagHtml += `</div>`;
    html += diagHtml;

    const asymText = asymmetries.length > 0 ? `<div class="list-item"><span class="list-icon">⚠️</span> Assimetria muscular leve identificada em: ${asymmetries.join(', ')}</div>` : '';
    const defText = isFemale ? 'Excelente definição corporal e linha de cintura' : 'Excelente base muscular e densidade no tronco';
    const volumeText = isFemale ? 'Boa base de volume nos glúteos e coxas' : 'Bom nível de hipertrofia e proporção em ombros e dorsais';
    const attText = isFemale ? 'Necessidade de maior volume e tônus muscular em membros superiores (braços/costas)' : 'Sinal de alerta: membros inferiores podem não estar acompanhando o forte desenvolvimento do tronco';
    const prio1 = isFemale ? 'Glúteos e Quadríceps (Volume)' : 'Membros Inferiores (Equilíbrio)';
    const prio2 = isFemale ? 'Ombros e Dorsais (Proporção X)' : 'Costas e Ombros (Lapidação)';

    html += `
    <div style="margin-bottom: 30px;">
        <div class="section-title" style="margin-top: 0;">🔍 DIAGNÓSTICO ESTÉTICO</div>
        <div style="display: flex; gap: 15px;">
            <div style="flex: 1; border: 1px solid #e5e5ea; border-radius: 10px; padding: 15px; background: #fff;">
                <h5 style="color: #4DE38F; font-size: 11px; margin: 0 0 10px 0; text-transform: uppercase;">PONTOS FORTES</h5>
                <div class="list-item"><span class="list-icon">✅</span> Percentual de gordura corporal perfeitamente controlado</div>
                <div class="list-item"><span class="list-icon">✅</span> Boa relação de simetria estrutural</div>
                <div class="list-item"><span class="list-icon">✅</span> ${defText}</div>
                <div class="list-item"><span class="list-icon">✅</span> ${volumeText}</div>
                <div class="list-item"><span class="list-icon">✅</span> Elevado potencial estético e metabólico</div>
            </div>
            <div style="flex: 1; display: flex; flex-direction: column; gap: 10px;">
                <div style="border: 1px solid #e5e5ea; border-radius: 10px; padding: 15px; background: #fff;">
                    <h5 style="color: #FF3B30; font-size: 11px; margin: 0 0 10px 0; text-transform: uppercase;">PONTOS DE ATENÇÃO</h5>
                    ${asymText}
                    <div class="list-item"><span class="list-icon">⚠️</span> Desenvolvimento de alguns grupamentos abaixo do potencial ideal</div>
                    <div class="list-item"><span class="list-icon">⚠️</span> ${attText}</div>
                </div>
                <div style="border: 1px solid #9D00FF; border-radius: 10px; padding: 15px; background: rgba(157,0,255,0.02);">
                    <h5 style="color: #9D00FF; font-size: 11px; margin: 0 0 10px 0; text-transform: uppercase;">PRIORIDADES DE TREINO</h5>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                        <span style="background: #111; color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 9px; font-weight: 900;">🎯 ${prio1}</span>
                        <span style="background: #111; color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 9px; font-weight: 900;">🎯 ${prio2}</span>
                        <span style="background: #111; color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 9px; font-weight: 900;">🎯 Foco em Simetria</span>
                    </div>
                </div>
            </div>
        </div>
    </div>`;

    html += `
    <div class="avoid-break" style="background: #111; padding: 25px; border-radius: 12px; margin-bottom: 40px; border-left: 4px solid #4DE38F;">
        <h3 style="color: #fff; font-size: 14px; margin: 0 0 15px 0; text-transform: uppercase;">🎯 OBJETIVOS ESTRATÉGICOS ATUAIS</h3>
        
        <strong style="color: #4DE38F; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Objetivo Principal</strong>
        <p style="color: #eee; font-size: 12px; margin: 5px 0 15px 0;">Desenvolvimento muscular sólido com manutenção (ou melhora) da definição corporal.</p>
        
        <div style="display: flex; gap: 20px;">
            <div style="flex: 1;">
                <strong style="color: #888; font-size: 10px; text-transform: uppercase;">Objetivos Secundários</strong>
                <ul style="color: #ccc; font-size: 11px; margin: 5px 0 0 0; padding-left: 15px; line-height: 1.6;">
                    <li>Melhorar simetria corporal global</li>
                    <li>Aumentar volume nos grupamentos prioritários</li>
                    <li>Aprimorar a proporção e estética da linha de cintura</li>
                    <li>Manter o percentual de gordura estritamente controlado</li>
                </ul>
            </div>
            <div style="flex: 1;">
                <strong style="color: #888; font-size: 10px; text-transform: uppercase;">Estratégia Recomendada</strong>
                <ul style="color: #ccc; font-size: 11px; margin: 5px 0 0 0; padding-left: 15px; line-height: 1.6; list-style-type: none;">
                    <li><span style="color:#4DE38F; margin-right:5px;">✅</span> Treinamento de força progressivo e periodizado</li>
                    <li><span style="color:#4DE38F; margin-right:5px;">✅</span> Controle nutricional contínuo</li>
                    <li><span style="color:#4DE38F; margin-right:5px;">✅</span> Monitoramento mensal das métricas e evolução</li>
                    <li><span style="color:#4DE38F; margin-right:5px;">✅</span> Nova avaliação física em 45 a 60 dias</li>
                </ul>
            </div>
        </div>
    </div>`;

    if (assessment.photos && assessment.photos.length > 0) {
        const validPhotos = assessment.photos.filter(p => p && p.trim() !== '');
        if (validPhotos.length > 0) {
            html += `<div class="avoid-break" style="margin-top: 20px;">`;
            html += `<div class="section-title" style="margin-top: 0;">REGISTRO FOTOGRÁFICO</div>`;
            html += `<div class="photo-compare-row">`;
            if (assessment.photos[0]) html += `<div class="photo-box"><img src="${assessment.photos[0]}"/><div class="photo-label">FRENTE</div></div>`;
            if (assessment.photos[1]) html += `<div class="photo-box"><img src="${assessment.photos[1]}"/><div class="photo-label">LADO</div></div>`;
            if (assessment.photos[2]) html += `<div class="photo-box"><img src="${assessment.photos[2]}"/><div class="photo-label">COSTAS</div></div>`;
            html += `</div></div>`;

            const frontTxt = isFemale ? 'Excelente alinhamento estrutural. Volume visível na região do quadríceps e linha de cintura fina. A proporção está bem direcionada.' : 'Boa densidade no peitoral e linha de ombros. É vital monitorar o volume do quadríceps para manter a proporção com o tronco.';
            const sideTxt = isFemale ? 'Destaque para a projeção glútea e desenho do posterior de coxa. Perfil atlético bem consolidado.' : 'Espessura de tronco e braços bem desenvolvida. A linha de pernas precisa acompanhar esse progresso.';
            const backTxt = isFemale ? 'Contorno de glúteos e panturrilhas em destaque. Oportunidade para focar mais na expansão dorsal e ombros, fechando a estética em X.' : 'Expansão dorsal evidente. O foco em posteriores de coxa e panturrilhas será o diferencial para um físico completo e sem falhas.';
            
            html += `
            <div class="avoid-break" style="margin-bottom: 30px;">
                <div class="section-title" style="margin-top: 0; font-size: 14px;">📸 ANÁLISE VISUAL</div>
                <div style="display: flex; gap: 15px;">
                    <div style="flex: 1; background: #f8f9fa; border: 1px solid #e5e5ea; padding: 12px; border-radius: 8px;">
                        <strong style="font-size: 10px; color: #111; display: block; margin-bottom: 5px;">VISTA FRONTAL</strong>
                        <ul style="margin: 0; padding-left: 15px; font-size: 10px; color: #555; line-height: 1.4;">
                            <li>${frontTxt}</li>
                        </ul>
                    </div>
                    <div style="flex: 1; background: #f8f9fa; border: 1px solid #e5e5ea; padding: 12px; border-radius: 8px;">
                        <strong style="font-size: 10px; color: #111; display: block; margin-bottom: 5px;">VISTA LATERAL</strong>
                        <ul style="margin: 0; padding-left: 15px; font-size: 10px; color: #555; line-height: 1.4;">
                            <li>${sideTxt}</li>
                        </ul>
                    </div>
                    <div style="flex: 1; background: #f8f9fa; border: 1px solid #e5e5ea; padding: 12px; border-radius: 8px;">
                        <strong style="font-size: 10px; color: #111; display: block; margin-bottom: 5px;">VISTA POSTERIOR</strong>
                        <ul style="margin: 0; padding-left: 15px; font-size: 10px; color: #555; line-height: 1.4;">
                            <li>${backTxt}</li>
                        </ul>
                    </div>
                </div>
            </div>`;
        }
    }

    const conclusaoFoco = isFemale 
        ? 'à lapidação e ganho de volume nos membros inferiores (glúteos e pernas), sem negligenciar o trabalho de ombros e costas, que são essenciais para harmonizar o físico e criar a proporção em ampulheta' 
        : 'ao desenvolvimento global e simétrico. É fundamental redobrar a atenção aos membros inferiores para garantir que o volume das pernas acompanhe a excelente densidade do tronco';

    html += `
    <div class="avoid-break" style="margin-top: 40px; padding: 20px; background: rgba(77, 227, 143, 0.05); border: 1px solid #4DE38F; border-radius: 12px;">
        <div style="display: flex; align-items: center; margin-bottom: 10px;">
            <span style="font-size: 20px; margin-right: 10px;">🏆</span>
            <h3 style="margin: 0; color: #111; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">CONCLUSÃO TÉCNICA</h3>
        </div>
        <p style="font-size: 12px; color: #333; line-height: 1.6; margin: 0;">
            ${pron} apresenta composição corporal de nível avançado, percentual de gordura muito bem controlado e excelente potencial para evolução estética. O foco atual do planejamento deve ser direcionado ${conclusaoFoco}. O rigor no acompanhamento contínuo e a execução impecável do plano permitirão o refinamento progressivo do físico e a maximização dos resultados nos próximos ciclos.
        </p>
    </div>`;

    html += `
    <div class="avoid-break" style="text-align: center; margin-top: 50px; padding-top: 30px;">
        <img src="https://pub-8d1e734f810f4342a0e77c4220bee5b2.r2.dev/assessments/fc557a0a-ef63-44a9-81d4-213e24adf2eb/logo%20pa%20elite%20team.png" style="height: 100px; object-fit: contain; opacity: 0.9;" />
        <p style="font-size: 10px; color: #888; font-weight: 700; letter-spacing: 2px; margin-top: 10px;">EXCELÊNCIA EM RESULTADOS</p>
    </div>
    `;

    processAndSharePDF(html, 'Avaliacao_Fisica_Premium');
};