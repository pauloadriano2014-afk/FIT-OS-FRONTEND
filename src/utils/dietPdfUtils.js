// utils/dietPdfUtils.js
// Gera PDF da dieta usando expo-print — mesmo padrão do generateWorkoutPDF
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';

const LOGO_URL = 'https://i.postimg.cc/YSrDNBTm/INTELIGENCIA-FINANCEIRA-(Post-para-Instagram-(45)).png';

const DAY_TYPE_CONFIG = {
    TREINO:        { label: 'Dia de Treino',          color: '#00C851', bg: '#0a1a0e', icon: '💪' },
    TREINO_CARDIO: { label: 'Dia de Treino + Cardio', color: '#FF8C00', bg: '#1a1200', icon: '🔥' },
    CARDIO:        { label: 'Dia de Cardio',          color: '#00BFFF', bg: '#001a2a', icon: '🏃' },
    DESCANSO:      { label: 'Dia de Descanso',        color: '#9B59B6', bg: '#16001a', icon: '😴' },
};

function r(n) { return Math.round(n || 0); }

// Macros de um item individual com base em gramagem real
function itemMacros(item) {
    const factor = (parseFloat(item.gramAmount ?? item.gram_amount ?? item.amount) || 0) / 100;
    return {
        kcal: (item.calories ?? item.calories_per_100 ?? 0) * factor,
        p:    (item.protein  ?? item.p ?? 0) * factor,
        c:    (item.carbs    ?? item.c ?? 0) * factor,
        f:    (item.fats     ?? item.f ?? 0) * factor,
    };
}

// Agrupa itens por substitutionGroupId/groupId.
// Retorna lista de grupos: cada grupo tem um item principal + substitutos
function groupItems(items) {
    const seen   = new Map(); // groupId → index no resultado
    const result = [];

    for (const item of items) {
        const gid = item.substitutionGroupId || item.groupId || item.uniqueId || item.id;

        if (gid && seen.has(gid)) {
            // É substituto de um item já visto — adiciona no grupo
            result[seen.get(gid)].substitutes.push(item);
        } else {
            // Primeiro item do grupo (ou item sem grupo)
            const idx = result.length;
            if (gid) seen.set(gid, idx);
            result.push({ main: item, substitutes: [] });
        }
    }

    return result;
}

// Calcula macros da refeição somando só o item PRINCIPAL de cada grupo
function calcMealMacros(items) {
    const groups = groupItems(items);
    return groups.reduce((acc, g) => {
        const m = itemMacros(g.main);
        return { kcal: acc.kcal + m.kcal, p: acc.p + m.p, c: acc.c + m.c, f: acc.f + m.f };
    }, { kcal: 0, p: 0, c: 0, f: 0 });
}

function renderItemRow(item, isSubstitute = false) {
    const m    = itemMacros(item);
    const unit = ['g', 'ml'].includes(item.unit ?? '') ? item.unit : ` ${item.unit ?? ''}`;
    const rowClass = isSubstitute ? 'sub-row' : '';
    const nameCell = isSubstitute
        ? `<td class="food-name sub-name">↳ ${item.name}</td>`
        : `<td class="food-name">${item.name}</td>`;
    return `
        <tr class="${rowClass}">
            ${nameCell}
            <td class="food-col">${item.amount}${unit}</td>
            <td class="food-col">${r(m.kcal)}</td>
            <td class="food-col">${r(m.p)}g</td>
            <td class="food-col">${r(m.c)}g</td>
            <td class="food-col">${r(m.f)}g</td>
        </tr>`;
}

function renderItemsHtml(items) {
    const groups = groupItems(items);
    return groups.map(g => {
        let html = renderItemRow(g.main, false);
        if (g.substitutes.length > 0) {
            // Linha separadora antes dos substitutos
            html += `<tr class="sub-header-row"><td colspan="6" class="sub-header">Substituições possíveis:</td></tr>`;
            html += g.substitutes.map(s => renderItemRow(s, true)).join('');
        }
        return html;
    }).join('');
}

function renderMealsHtml(meals) {
    return meals.map(meal => {
        const macros    = calcMealMacros(meal.items ?? []);
        const notesHtml = meal.notes
            ? `<div class="meal-notes">📝 ${meal.notes}</div>` : '';
        return `
            <div class="meal-card">
                <div class="meal-header">
                    <div class="meal-title-row">
                        <span class="meal-name">${meal.name}</span>
                        <span class="meal-time">🕐 ${meal.time ?? '--:--'}</span>
                    </div>
                    <div class="meal-pills">
                        <span class="pill kcal">${r(macros.kcal)} kcal</span>
                        <span class="pill prot">${r(macros.p)}g P</span>
                        <span class="pill carb">${r(macros.c)}g C</span>
                        <span class="pill gord">${r(macros.f)}g G</span>
                    </div>
                </div>
                <table class="food-table">
                    <thead>
                        <tr>
                            <th class="th-name">Alimento</th>
                            <th class="th-col">Qtd</th>
                            <th class="th-col">Kcal</th>
                            <th class="th-col">Prot</th>
                            <th class="th-col">Carbo</th>
                            <th class="th-col">Gord</th>
                        </tr>
                    </thead>
                    <tbody>${renderItemsHtml(meal.items ?? [])}</tbody>
                </table>
                ${notesHtml}
            </div>`;
    }).join('');
}

export async function generateDietPDF({ meals, dietConfig, currentMacros, aluno }) {
    try {
        const today = new Date().toLocaleDateString('pt-BR', {
            day: '2-digit', month: 'long', year: 'numeric',
        });

        // Filtra só versões principais
        const mainMeals = (meals ?? []).filter(
            m => m.isMainVersion !== false && m.isMainVersion !== 0
        );

        // Agrupa por tipo de dia
        const dayGroups = {};
        for (const meal of mainMeals) {
            const key = meal.dayType ?? 'TREINO';
            if (!dayGroups[key]) dayGroups[key] = [];
            dayGroups[key].push(meal);
        }

        const dayOrder = ['TREINO', 'TREINO_CARDIO', 'CARDIO', 'DESCANSO'];

        const daySectionsHtml = dayOrder
            .filter(dt => dayGroups[dt]?.length)
            .map(dt => {
                const cfg = DAY_TYPE_CONFIG[dt] ?? DAY_TYPE_CONFIG['TREINO'];
                return `
                    <div class="day-section">
                        <div class="day-header" style="background:${cfg.bg}; border-left:4px solid ${cfg.color};">
                            <span class="day-icon">${cfg.icon}</span>
                            <span class="day-label" style="color:${cfg.color}">${cfg.label}</span>
                        </div>
                        ${renderMealsHtml(dayGroups[dt])}
                    </div>`;
            }).join('');

        // Macros totais
        const totalKcal    = currentMacros?.kcal  ?? 0;
        const totalProtein = currentMacros?.prot   ?? 0;
        const totalCarbs   = currentMacros?.carb   ?? 0;
        const totalFats    = currentMacros?.fat    ?? 0;

        // Água — dietConfig.water já vem como "3 Litros", não adiciona unidade
        const waterRaw    = dietConfig?.water ?? null;
        const generalNotes = dietConfig?.notes ?? null;

        const base    = totalKcal || 1;
        const protPct = Math.round((totalProtein * 4 / base) * 100);
        const carbPct = Math.round((totalCarbs   * 4 / base) * 100);
        const gordPct = Math.round((totalFats    * 9 / base) * 100);

        const photoHtml = aluno?.photoUrl
            ? `<img class="student-photo" src="${aluno.photoUrl}" alt="Foto" />`
            : `<div class="student-photo-placeholder">👤</div>`;

        const generalNotesHtml = generalNotes
            ? `<div class="general-notes">
                   <div class="notes-title">📋 Observações Gerais</div>
                   <p>${generalNotes}</p>
               </div>` : '';

        const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<title>Dieta – ${aluno?.name ?? 'Aluno'}</title>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:'Helvetica Neue',Helvetica,Arial,sans-serif; background:#0d0d0d; color:#e8e8e8; font-size:11px; }

/* CABEÇALHO */
.header { background:linear-gradient(135deg,#0d0d0d 0%,#1a1a1a 50%,#0d1a0d 100%); padding:24px 24px 20px; display:flex; align-items:center; gap:16px; border-bottom:2px solid #00C851; }
.logo { width:68px; height:68px; object-fit:contain; border-radius:10px; flex-shrink:0; }
.header-info { flex:1; }
.brand-name { font-size:8px; letter-spacing:3px; color:#00C851; text-transform:uppercase; font-weight:700; margin-bottom:3px; }
.doc-title { font-size:20px; font-weight:900; color:#fff; letter-spacing:1px; }
.doc-subtitle { font-size:9px; color:#666; margin-top:3px; }
.student-block { display:flex; align-items:center; gap:10px; background:rgba(0,200,81,0.08); border:1px solid rgba(0,200,81,0.2); border-radius:10px; padding:8px 12px; flex-shrink:0; }
.student-photo { width:48px; height:48px; border-radius:50%; object-fit:cover; border:2px solid #00C851; }
.student-photo-placeholder { width:48px; height:48px; border-radius:50%; background:#1e1e1e; border:2px solid #00C851; display:flex; align-items:center; justify-content:center; font-size:20px; }
.student-name { font-size:12px; font-weight:700; color:#fff; }
.student-meta { font-size:9px; color:#888; margin-top:2px; }

/* MACROS */
.macros-section { background:#111; padding:16px 24px; border-bottom:1px solid #222; }
.macros-title { font-size:8px; letter-spacing:2px; color:#00C851; text-transform:uppercase; font-weight:700; margin-bottom:12px; }
.macros-grid { display:grid; grid-template-columns:1fr 1fr 1fr 1fr; gap:8px; margin-bottom:10px; }
.macro-card { background:#1a1a1a; border-radius:8px; padding:10px; text-align:center; border:1px solid #2a2a2a; }
.macro-value { font-size:18px; font-weight:900; line-height:1; }
.macro-unit { font-size:9px; color:#666; font-weight:400; }
.macro-label { font-size:8px; letter-spacing:1px; text-transform:uppercase; color:#666; margin-top:3px; }
.kcal-val{color:#FFD700;} .prot-val{color:#00C851;} .carb-val{color:#00BFFF;} .gord-val{color:#FF6B6B;}
.bar-row { display:flex; align-items:center; gap:6px; margin-bottom:4px; }
.bar-label { width:58px; font-size:8px; color:#666; text-align:right; }
.bar-track { flex:1; height:5px; background:#222; border-radius:3px; overflow:hidden; }
.bar-fill { height:100%; border-radius:3px; }
.bar-pct { width:26px; font-size:8px; color:#555; }
.water-row { margin-top:8px; font-size:9px; color:#00BFFF; }

/* CONTEÚDO */
.content { padding:0 24px 24px; }
.day-section { margin-top:16px; }
.day-header { display:flex; align-items:center; gap:6px; padding:8px 12px; border-radius:6px; margin-bottom:8px; }
.day-icon { font-size:14px; }
.day-label { font-size:12px; font-weight:800; }

/* CARDS */
.meal-card { background:#161616; border:1px solid #252525; border-radius:8px; margin-bottom:7px; overflow:hidden; }
.meal-header { padding:8px 12px; background:#1a1a1a; border-bottom:1px solid #252525; }
.meal-title-row { display:flex; justify-content:space-between; align-items:center; margin-bottom:5px; }
.meal-name { font-size:12px; font-weight:700; color:#fff; }
.meal-time { font-size:9px; color:#888; background:#222; padding:1px 7px; border-radius:20px; }
.meal-pills { display:flex; gap:4px; flex-wrap:wrap; }
.pill { font-size:8px; font-weight:700; padding:2px 7px; border-radius:20px; }
.pill.kcal{background:rgba(255,215,0,0.12);color:#FFD700;}
.pill.prot{background:rgba(0,200,81,0.12);color:#00C851;}
.pill.carb{background:rgba(0,191,255,0.12);color:#00BFFF;}
.pill.gord{background:rgba(255,107,107,0.12);color:#FF6B6B;}

/* TABELA */
.food-table { width:100%; border-collapse:collapse; }
.food-table thead tr { background:#111; }
.th-name { padding:4px 10px; font-size:7.5px; letter-spacing:1px; text-transform:uppercase; color:#555; font-weight:600; text-align:left; }
.th-col { padding:4px 6px; font-size:7.5px; letter-spacing:1px; text-transform:uppercase; color:#555; font-weight:600; text-align:center; }
.food-table tbody tr:nth-child(even){background:#131313;}
.food-table tbody tr:nth-child(odd){background:#161616;}
.food-table td { padding:5px 10px; border-top:1px solid #1e1e1e; vertical-align:middle; }
td.food-name { font-size:10px; color:#ddd; font-weight:500; }
td.food-col { font-size:9px; color:#777; text-align:center; white-space:nowrap; }

/* SUBSTITUTOS */
.sub-header-row td { background:#0f0f0f !important; }
.sub-header { font-size:7.5px; color:#555; font-style:italic; padding:3px 10px !important; letter-spacing:0.5px; }
.sub-row td { background:#0f1a0f !important; }
td.sub-name { font-size:9.5px; color:#888; font-weight:400; padding-left:18px !important; }
.sub-row .food-col { color:#555; }

.meal-notes { padding:6px 12px; font-size:9px; color:#777; background:#111; border-top:1px solid #1e1e1e; font-style:italic; }

/* OBSERVAÇÕES */
.general-notes { background:#0f1a0f; border:1px solid rgba(0,200,81,0.2); border-radius:8px; padding:14px; margin-top:16px; }
.notes-title { font-size:10px; font-weight:700; color:#00C851; margin-bottom:6px; }
.general-notes p { font-size:9.5px; color:#aaa; line-height:1.7; white-space:pre-wrap; }

/* RODAPÉ */
.footer { margin-top:20px; padding:12px 0; border-top:1px solid #1e1e1e; display:flex; justify-content:space-between; }
.footer-brand { font-size:8px; color:#444; letter-spacing:1px; text-transform:uppercase; }
.footer-date { font-size:8px; color:#333; }
</style>
</head>
<body>

<div class="header">
    <img class="logo" src="${LOGO_URL}" alt="PA Team Elite"/>
    <div class="header-info">
        <div class="brand-name">PA Team Elite</div>
        <div class="doc-title">PLANO ALIMENTAR</div>
        <div class="doc-subtitle">Dieta personalizada • ${today}</div>
    </div>
    <div class="student-block">
        ${photoHtml}
        <div>
            <div class="student-name">${aluno?.name ?? 'Aluno'}</div>
            ${aluno?.goal ? `<div class="student-meta">${aluno.goal}</div>` : ''}
            ${aluno?.currentWeight ? `<div class="student-meta">${aluno.currentWeight} kg</div>` : ''}
        </div>
    </div>
</div>

<div class="macros-section">
    <div class="macros-title">⚡ Resumo de Macronutrientes</div>
    <div class="macros-grid">
        <div class="macro-card"><div class="macro-value kcal-val">${r(totalKcal)}<span class="macro-unit"> kcal</span></div><div class="macro-label">Calorias</div></div>
        <div class="macro-card"><div class="macro-value prot-val">${r(totalProtein)}<span class="macro-unit">g</span></div><div class="macro-label">Proteína</div></div>
        <div class="macro-card"><div class="macro-value carb-val">${r(totalCarbs)}<span class="macro-unit">g</span></div><div class="macro-label">Carboidrato</div></div>
        <div class="macro-card"><div class="macro-value gord-val">${r(totalFats)}<span class="macro-unit">g</span></div><div class="macro-label">Gordura</div></div>
    </div>
    <div>
        <div class="bar-row"><span class="bar-label">Proteína</span><div class="bar-track"><div class="bar-fill" style="width:${protPct}%;background:#00C851"></div></div><span class="bar-pct">${protPct}%</span></div>
        <div class="bar-row"><span class="bar-label">Carboidrato</span><div class="bar-track"><div class="bar-fill" style="width:${carbPct}%;background:#00BFFF"></div></div><span class="bar-pct">${carbPct}%</span></div>
        <div class="bar-row"><span class="bar-label">Gordura</span><div class="bar-track"><div class="bar-fill" style="width:${gordPct}%;background:#FF6B6B"></div></div><span class="bar-pct">${gordPct}%</span></div>
    </div>
    ${waterRaw ? `<div class="water-row">💧 Meta de água: <strong>${waterRaw}</strong> por dia</div>` : ''}
</div>

<div class="content">
    ${daySectionsHtml}
    ${generalNotesHtml}
    <div class="footer">
        <span class="footer-brand">PA Team Elite · Paulo Adriano</span>
        <span class="footer-date">Gerado em ${today}</span>
    </div>
</div>

</body>
</html>`;

        if (Platform.OS === 'web') {
            const win = window.open('', '_blank', 'width=900,height=700');
            win.document.write(htmlContent);
            win.document.close();
            setTimeout(() => win.print(), 1000);
        } else {
            const { uri } = await Print.printToFileAsync({ html: htmlContent });
            await Sharing.shareAsync(uri, {
                mimeType: 'application/pdf',
                dialogTitle: `Dieta de ${aluno?.name ?? 'Aluno'}`,
                UTI: 'com.adobe.pdf',
            });
        }
    } catch (error) {
        console.error('Erro ao gerar PDF da dieta:', error);
        Alert.alert('Erro', 'Não foi possível gerar o PDF. Tente novamente.');
    }
}