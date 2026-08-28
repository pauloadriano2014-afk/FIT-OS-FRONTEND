// src/utils/brandForPdf.js
// Marca usada na capa dos PDFs entregues ao aluno (treino, dieta, avaliação):
// a logo do COACH DO ALUNO (não de quem está logado — importante pro master
// Paulo/Adri conseguir gerar o PDF de um aluno de um coach parceiro já com a
// marca certa do parceiro), com a assinatura "ELITE FIT CONSULTORIA" da
// plataforma sempre presente também.
import { authHeaders } from './authToken';

// Mesma proporção usada no upload da marca (TabMarca.js: ImagePicker aspect
// [3,1]) — a logo do coach já é recortada 3:1 (largura:altura) na hora do
// upload. Reaproveitamos essa mesma proporção aqui.
export const BRAND_ASPECT_RATIO = 3; // largura / altura

// Cor da marca ELITE FIT (usada no "FIT" do wordmark e nos traços do subtítulo).
const BRAND_PURPLE = '#8B5CF6';

// Selo da plataforma — sempre aparece nos documentos entregues ao aluno,
// mesmo quando o coach já tem a própria logo em destaque na capa.
export const PLATFORM_SIGNATURE = 'ELITE FIT CONSULTORIA';

// Busca só o essencial (nome + marca) do coach DONO do aluno — funciona
// tanto quando quem gera o PDF é o próprio aluno quanto quando é o
// coach/master (ver app/api/coach-brand/[id] no backend).
export async function getCoachBrandForPdf(coachId) {
    if (!coachId) return null;
    try {
        const res = await fetch(
            `https://fitos-final.onrender.com/api/coach-brand/${coachId}`,
            { headers: { ...(await authHeaders()) } }
        );
        if (!res.ok) return null;
        const data = await res.json();
        return {
            coachName: data?.name || null,
            brandLogoUrl: data?.brandLogoUrl || null,
            brandLogoSize: Number(data?.brandLogoSize) || 220,
        };
    } catch {
        return null; // nunca trava a geração do PDF por causa da marca
    }
}

// Bloco HTML pra colocar a logo do coach (ou o texto padrão, se ele ainda
// não personalizou) dentro de uma caixa 3:1 fixa — a imagem entra com
// object-fit:contain, então NUNCA estoura/corta a caixa, seja qual for o
// tamanho real do arquivo que o coach subiu.
export function renderBrandBlockHtml(brand, { boxWidthPx = 280, align = 'center', textColor = '#fff' } = {}) {
    const boxHeightPx = Math.round(boxWidthPx / BRAND_ASPECT_RATIO);
    const justify = align === 'center' ? 'center' : (align === 'right' ? 'flex-end' : 'flex-start');

    if (brand?.brandLogoUrl) {
        return `
          <div style="display:flex; justify-content:${justify}; align-items:center; width:100%; box-sizing:border-box;">
            <div style="width:${boxWidthPx}px; max-width:100%; height:${boxHeightPx}px; display:flex; align-items:center; justify-content:center; overflow:hidden;">
              <img src="${brand.brandLogoUrl}" style="max-width:100%; max-height:100%; object-fit:contain; display:block;" onerror="this.parentElement.style.display='none'" />
            </div>
          </div>`;
    }

    // Sem logo própria ainda: usa a marca padrão da plataforma, no mesmo
    // estilo do logo real (ELITE em branco/cor do texto + FIT em roxo, e a
    // linha "CONSULTORIA DE PERFORMANCE" ladeada por tracinhos roxos).
    const titleSize = Math.max(14, Math.round(boxHeightPx * 0.5));
    const subSize = Math.max(7, Math.round(boxHeightPx * 0.2));
    const justifyContent = align === 'center' ? 'center' : (align === 'right' ? 'flex-end' : 'flex-start');
    return `
      <div style="text-align:${align}; width:100%; box-sizing:border-box;">
        <div style="font-weight:900; font-size:${titleSize}px; letter-spacing:1px;">
          <span style="color:${textColor};">ELITE</span><span style="color:${BRAND_PURPLE};"> FIT</span>
        </div>
        <div style="display:flex; align-items:center; justify-content:${justifyContent}; gap:6px; margin-top:3px;">
          <span style="display:inline-block; width:10px; height:1px; background:${BRAND_PURPLE}; opacity:0.7;"></span>
          <span style="font-weight:700; font-size:${subSize}px; letter-spacing:1px; opacity:0.65; color:${textColor};">CONSULTORIA DE PERFORMANCE</span>
          <span style="display:inline-block; width:10px; height:1px; background:${BRAND_PURPLE}; opacity:0.7;"></span>
        </div>
      </div>`;
}
