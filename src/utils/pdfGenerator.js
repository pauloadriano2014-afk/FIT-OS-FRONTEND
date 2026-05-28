import * as Print from 'expo-print';
import { Alert, Platform } from 'react-native';
import * as Sharing from 'expo-sharing';

// 1. Pega capas automáticas de serviços amigáveis (YouTube, Cloudflare, Cloudinary)
const getFastThumbnailUrl = (url) => {
    if (!url) return null;

    const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    if (ytMatch && ytMatch[1]) return `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;

    if (url.includes('cloudflarestream.com')) {
        const cfMatch = url.match(/cloudflarestream\.com\/([a-zA-Z0-9]+)\//);
        if (cfMatch && cfMatch[1]) {
            const domain = url.split('/')[2]; 
            return `https://${domain}/${cfMatch[1]}/thumbnails/thumbnail.jpg`;
        }
    }

    if (url.includes('cloudinary.com')) {
        return url.replace('.mp4', '.jpg').replace('.webm', '.jpg');
    }

    return null; 
};

export const generateWorkoutPDF = async (aluno, daysToPrint, exercisesByDay, workoutName = "PLANEJAMENTO DE TREINO") => {
    try {
        const defaultImage = 'https://ui-avatars.com/api/?name=FIT+OS&background=F2F2F7&color=4DE38F&bold=true&size=128';
        
        // 🔥 COLOQUE A URL DA SUA LOGO AQUI 🔥
        const logoTeam = 'https://i.imgur.com/X5mWmUE.png'; 

        // 1. GERAÇÃO DA CAPA (Ajustada: Apenas Logo + Texto Conceitual)
        let htmlTreinos = `
            <div class="cover-page">
                <img src="${logoTeam}" class="cover-logo" alt="Elite Team Logo" onerror="this.style.display='none'" />
                <div class="cover-footer">TREINAMENTO PERSONALIZADO</div>
            </div>
        `;

        // 2. GERAÇÃO DOS DIAS DE TREINO
        daysToPrint.forEach((day, index) => {
            const exercicios = exercisesByDay[day] || [];
            
            const pageBreakStyle = index > 0 ? 'page-break-before: always; padding-top: 15px;' : 'padding-top: 15px;';

            // Identificação do Aluno e Treino no topo do Miolo (Essencial para o material impresso)
            const headerHtml = index === 0 ? `
                <div class="student-bar">
                    TREINO: ${workoutName.toUpperCase()} | ALUNO(A): ${aluno.name}
                </div>
            ` : '';

            htmlTreinos += `
                <div class="day-page" style="${pageBreakStyle}">
                    ${headerHtml}
                    <div class="day-section">
                        <h2 class="day-title" style="${index === 0 ? 'margin-top: 5px;' : ''}">DIA: ${day.toUpperCase()}</h2>
                        <table class="workout-table">
                            <tbody>`;

            exercicios.forEach((ex, idx) => {
                let blocksHtml = '';
                const isCardio = ex.category?.toLowerCase() === 'cardio' || ex.title?.toLowerCase().includes('esteira');

                if (isCardio) {
                    const tempo = ex.blocks?.[0]?.sets || '30';
                    const kcal = ex.blocks?.[0]?.reps || '300';
                    blocksHtml = `<span class="cardio-info">${kcal} kcal em ${tempo} minutes em intensidade média/alta</span>`;
                } else if (ex.blocks) {
                    ex.blocks.forEach(b => {
                        let cargaSpaces = 'S1___ S2___ S3___ S4___'; 
                        let techniqueDisplay = '';

                        if (b.technique?.toLowerCase() === 'drop-set' || b.technique?.toLowerCase() === 'dropset') {
                            cargaSpaces = 'S1_/_ S2_/_ S3_/_ S4_/_'; 
                            techniqueDisplay = 'DROP-SET';
                        } else if (b.technique?.toLowerCase() === '21') {
                            cargaSpaces = 'S1_/_/_ S2_/_/_ S3_/_/_ S4_/_/_'; 
                            techniqueDisplay = '21';
                        } else if (b.technique) {
                            techniqueDisplay = b.technique.toUpperCase();
                        }

                        let repsDisplay = b.reps;
                        if (b.reps?.toLowerCase() === 'falha') {
                            repsDisplay = 'FALHA';
                        }

                        if (techniqueDisplay === 'RESTPAUSE' || techniqueDisplay === 'REST-PAUSE') {
                            repsDisplay = `${repsDisplay} RESTPAUSE`;
                            techniqueDisplay = ''; 
                        }

                        blocksHtml += `
                            <div class="block-item">
                                <span class="sets-reps">
                                    ${b.sets}x ${repsDisplay}
                                    ${techniqueDisplay ? ` <span class="technique-tag">${techniqueDisplay}</span>` : ''}
                                </span>
                                <span class="anotacao-carga">Carga: ${cargaSpaces}</span>
                            </div>`;
                    });
                }

                const mediaUrl = ex.videoUrl || ex.video || ex.image || ex.imageUrl || ex.url || null;
                let imageHtml = `<td class="ex-image-container"><img src="${defaultImage}" class="ex-thumbnail" /></td>`;

                if (mediaUrl) {
                    const fastThumb = getFastThumbnailUrl(mediaUrl);
                    
                    if (fastThumb) {
                        imageHtml = `<td class="ex-image-container">
                                        <img src="${fastThumb}" class="ex-thumbnail" onerror="this.src='${defaultImage}'" />
                                     </td>`;
                    } else if (mediaUrl.endsWith('.mp4') || mediaUrl.includes('cloudfront')) {
                        imageHtml = `<td class="ex-image-container">
                                        <video 
                                            src="${mediaUrl}#t=0.5" 
                                            class="ex-thumbnail" 
                                            style="object-fit: cover; pointer-events: none;" 
                                            preload="metadata" 
                                            muted 
                                            playsinline>
                                        </video>
                                     </td>`;
                    } else {
                        imageHtml = `<td class="ex-image-container">
                                        <img src="${mediaUrl}" class="ex-thumbnail" onerror="this.src='${defaultImage}'" />
                                     </td>`;
                    }
                }

                htmlTreinos += `
                    <tr class="ex-row">
                        <td class="ex-number">${idx + 1}</td>
                        ${imageHtml}
                        <td class="ex-details">
                            <span class="exercise-title">${ex.name ? ex.name.toUpperCase() : ex.title?.toUpperCase()}</span>
                            <div class="exercise-blocks">${blocksHtml}</div>
                        </td>
                    </tr>`;
            }); 

            htmlTreinos += `
                            </tbody>
                        </table>
                    </div>
                </div>`;
        }); 

        // 3. MANUAL DO ALUNO
        htmlTreinos += `
            <div class="guide-page" style="page-break-before: always; padding-top: 10px;">
                <div class="header-container" style="border-radius: 8px 8px 0 0; padding: 12px 10px;">
                    <h1 class="routine-name">MANUAL DO ALUNO</h1>
                </div>
                <div class="student-bar" style="margin-bottom: 15px; padding: 5px;">
                    LEITURA OBRIGATÓRIA PARA BONS RESULTADOS
                </div>
                
                <div class="guide-section" style="margin-bottom: 12px;">
                    <h2 class="guide-title">COMO REGISTRAR SUAS CARGAS</h2>
                    <p><strong>S1, S2, S3 e S4:</strong> Significam respectivamente <strong>Semana 1, 2, 3 e 4</strong>. Utilize a mesma folha durante o mês inteiro e anote seu peso a cada semana para monitorar sua evolução.</p>
                    <p><strong>Exercícios Comuns:</strong> Anote o peso total ou de cada lado no campo correspondente à semana (Ex: <i>S1: 15kg</i>).</p>
                    <p><strong>Campos com Barra ( _/_ ):</strong> Presente em técnicas como o DROP-SET. Anote a carga da série principal antes da barra e a carga reduzida depois da barra (Ex: <i>20 / 14</i>).</p>
                </div>

                <div class="guide-section" style="margin-bottom: 12px;">
                    <h2 class="guide-title">GUIA DE TÉCNICAS</h2>
                    <p><strong>REST-PAUSE:</strong> Vá até a falha, descanse 10 a 15 segundos e faça mais algumas repetições com o mesmo peso.</p>
                    <p><strong>BI-SET:</strong> Execute dois exercícios diferentes seguidos, sem descanso entre eles.</p>
                    <p><strong>DROP-SET:</strong> Vá até a falha, reduza instantaneamente 20% a 30% da carga e continue até falhar de novo.</p>
                    <p><strong>MÉTODO 21:</strong> Faça 7 repetições curtas embaixo, 7 curtas em cima e 7 completas.</p>
                </div>

                <div class="guide-section">
                    <h2 class="guide-title">OBSERVAÇÕES DE TREINO</h2>
                    <p><strong>⏱ DESCANSO:</strong> Cronometre entre 60 e 90 segundos. Respeitar o intervalo garante energia para manter o rendimento nas próximas séries.</p>
                    <p><strong>📈 PROGRESSÃO:</strong> Se completou as repetições estipuladas com facilidade na semana atual, aumente levemente o peso na semana seguinte.</p>
                    <p><strong>🎯 CADÊNCIA:</strong> Controle o movimento. A descida do peso deve ser segurada e mais lenta que a subida.</p>
                </div>
            </div>`;

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>${workoutName} - ${aluno.name}</title>
                <style>
                    @page { size: A5 portrait; margin: 0; }
                    body { 
                        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; 
                        font-size: 11px; 
                        line-height: 1.4; 
                        color: #111; 
                        margin: 0; 
                        padding: 0;
                    }

                    /* 🔥 ESTILOS DA CAPA MINIMALISTA 🔥 */
                    .cover-page {
                        height: 98vh;
                        background-color: #000;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        page-break-after: always;
                        padding: 30px;
                        box-sizing: border-box;
                    }
                    .cover-logo {
                        max-width: 85%;
                        max-height: 55vh;
                        object-fit: contain;
                    }
                    .cover-footer {
                        margin-top: 35px;
                        color: #CCCCCC; /* Tom de cinza claro premium */
                        font-size: 11px;
                        font-weight: 600;
                        letter-spacing: 5px; /* Espaçamento largo marcante */
                        width: 90%;
                        text-align: center;
                        text-transform: uppercase;
                    }

                    .day-page, .guide-page {
                        padding: 8mm 8mm;
                    }

                    .header-container {
                        text-align: center;
                        background-color: #000;
                        color: #FFF;
                        padding: 15px 10px;
                        border-radius: 8px 8px 0 0;
                        margin-bottom: 0;
                    }
                    
                    .student-bar { 
                        background-color: #4DE38F; 
                        color: #000; 
                        text-align: center;
                        font-size: 11px; 
                        font-weight: 900;
                        padding: 8px;
                        border-radius: 6px;
                        margin-bottom: 15px;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }

                    .ex-row { page-break-inside: avoid; }
                    
                    .day-title { 
                        font-size: 12px; 
                        color: #FFF; 
                        background-color: #222;
                        padding: 5px 12px;
                        border-radius: 6px;
                        margin-top: 12px;
                        margin-bottom: 12px; 
                        font-weight: 800;
                        display: inline-block;
                        letter-spacing: 0.5px;
                    }

                    .guide-title {
                        font-size: 11px; 
                        color: #FFF; 
                        background-color: #222;
                        padding: 4px 10px;
                        border-radius: 6px;
                        margin-top: 0px; 
                        margin-bottom: 8px; 
                        font-weight: 800;
                        display: inline-block;
                        letter-spacing: 0.5px;
                    }

                    .workout-table { width: 100%; border-collapse: collapse; }
                    .workout-table td { 
                        padding: 10px 0; 
                        vertical-align: middle; 
                        border-bottom: 1px solid #E5E5EA; 
                    }
                    .ex-row:last-child td { border-bottom: none; }

                    .ex-number { width: 24px; text-align: left; font-weight: 900; color: #4DE38F; font-size: 15px;}
                    
                    .ex-image-container { width: 58px; text-align: left; padding-right: 10px; }
                    .ex-thumbnail { 
                        width: 48px; 
                        height: 85px; 
                        border-radius: 8px; 
                        object-fit: cover; 
                        border: 1px solid #CCC; 
                        background-color: #F2F2F7; 
                    }
                    
                    .ex-details { padding-left: 0px; }
                    .exercise-title { font-size: 11px; color: #000; font-weight: 800; display: block; margin-bottom: 6px; letter-spacing: 0.3px; }

                    .exercise-blocks { margin-top: 2px; }
                    .block-item { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
                    .sets-reps { font-size: 10px; color: #444; font-weight: 600; white-space: nowrap; }
                    .technique-tag { font-size: 8px; background-color: #F2F2F7; padding: 2px 4px; border-radius: 4px; margin-left: 4px; font-weight: 800; color: #000; border: 1px solid #DDD; }
                    .anotacao-carga { font-size: 9px; color: #666; white-space: nowrap; margin-left: 10px; font-weight: 600; letter-spacing: -0.2px; }
                    .cardio-info { font-size: 10px; color: #555; font-style: italic; font-weight: bold; }
                    
                    .guide-section {
                        padding: 10px 12px;
                        border: 1px dashed #CCC;
                        border-radius: 10px;
                        background-color: #FAFAFA;
                    }
                    .guide-section p { margin: 4px 0; font-size: 9.5px; color: #333; line-height: 1.4; }
                    strong { font-weight: 900; color: #000; }
                </style>
            </head>
            <body>
                ${htmlTreinos}
                
                <script>
                    window.onload = function() {
                        const videos = document.querySelectorAll('video');
                        if(videos.length === 0) return;
                        videos.forEach(v => {
                            v.addEventListener('loadeddata', () => {});
                        });
                    };
                </script>
            </body>
            </html>`;

        if (Platform.OS === 'web') {
            const win = window.open('', '_blank', 'width=800,height=600');
            win.document.write(htmlContent);
            win.document.close();
            
            setTimeout(() => {
                win.print();
            }, 1500);
        } else {
            const { uri } = await Print.printToFileAsync({ html: htmlContent });
            await Sharing.shareAsync(uri);
        }
    } catch (error) {
        console.error("Erro ao gerar PDF:", error);
        Alert.alert("Erro", "Não foi possível gerar o PDF. Tente novamente mais tarde.");
    }
};