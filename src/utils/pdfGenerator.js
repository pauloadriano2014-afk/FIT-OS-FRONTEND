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

        // 🔥 Cabeçalho inserido apenas UMA vez no começo do documento 🔥
        let htmlTreinos = `
            <div class="header-container">
                <h1 class="routine-name">${workoutName.toUpperCase()}</h1>
            </div>
            <div class="student-bar">
                ALUNO(A): ${aluno.name}
            </div>
        `;

        daysToPrint.forEach((day, index) => {
            const exercicios = exercisesByDay[day] || [];
            
            // Quebra de página apenas a partir do segundo dia
            const pageBreakStyle = index > 0 ? 'page-break-before: always; padding-top: 15px;' : 'padding-top: 5px;';

            htmlTreinos += `
                <div class="day-page" style="${pageBreakStyle}">
                    <div class="day-section">
                        <h2 class="day-title">DIA: ${day.toUpperCase()}</h2>
                        <table class="workout-table">
                            <tbody>`;

            exercicios.forEach((ex, idx) => {
                let blocksHtml = '';
                const isCardio = ex.category?.toLowerCase() === 'cardio' || ex.title?.toLowerCase().includes('esteira');

                if (isCardio) {
                    // 🔥 Lógica de Cardio Ajustada 🔥
                    const tempo = ex.blocks?.[0]?.sets || '30';
                    const kcal = ex.blocks?.[0]?.reps || '300';
                    blocksHtml = `<span class="cardio-info">${kcal} kcal em ${tempo} minutos em intensidade média/alta</span>`;
                } else if (ex.blocks) {
                    ex.blocks.forEach(b => {
                        let cargaSpaces = '____'; 
                        let techniqueDisplay = '';

                        if (b.technique?.toLowerCase() === 'drop-set' || b.technique?.toLowerCase() === 'dropset') {
                            cargaSpaces = '____ | ____'; 
                            techniqueDisplay = 'DROP-SET';
                        } else if (b.technique?.toLowerCase() === '21') {
                            cargaSpaces = '____ | ____ | ____'; 
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

        // 🔥 PÁGINA FINAL EXCLUSIVA (Ajustada para caber em 1 folha A5) 🔥
        htmlTreinos += `
            <div class="guide-page" style="page-break-before: always; padding-top: 15px;">
                <div class="header-container" style="border-radius: 8px 8px 0 0;">
                    <h1 class="routine-name">MANUAL DO ALUNO</h1>
                </div>
                <div class="student-bar" style="margin-bottom: 20px;">
                    LEITURA OBRIGATÓRIA PARA BONS RESULTADOS
                </div>
                
                <div class="guide-section">
                    <h2 class="guide-title">GUIA DE TÉCNICAS</h2>
                    <p><strong>REST-PAUSE:</strong> Realize a série até a falha, descanse de 10 a 15 segundos e retome o exercício para mais algumas repetições.</p>
                    <p><strong>BI-SET:</strong> Execute dois exercícios diferentes na sequência, sem descanso entre eles.</p>
                    <p><strong>DROP-SET:</strong> Faça a série até a falha, reduza 20% a 30% da carga imediatamente e continue até falhar novamente.</p>
                    <p><strong>MÉTODO 21:</strong> Divida o movimento: 7 repetições na metade inferior, 7 na metade superior e 7 movimentos completos.</p>
                </div>

                <div class="guide-section" style="margin-top: 15px;">
                    <h2 class="guide-title">OBSERVAÇÕES DE TREINO</h2>
                    <p><strong>⏱ DESCANSO:</strong> Respeite o tempo de intervalo. Para treinos convencionais e de hipertrofia, descanse entre 60 e 90 segundos. O descanso garante a energia para a próxima série render igual!</p>
                    <p><strong>📈 PROGRESSÃO DE CARGA:</strong> Tente aumentar a carga progressivamente. Se você fez o número máximo de repetições pedidas de forma fácil, está na hora de subir o peso no próximo treino mantendo a boa postura.</p>
                    <p><strong>🎯 CADÊNCIA (VELOCIDADE):</strong> Não jogue o peso! O movimento precisa de controle. A fase de descida (quando segura a carga) deve ser um pouco mais lenta do que a subida.</p>
                    <p><strong>🔥 ATÉ A FALHA:</strong> Quando vir o termo "FALHA", significa que deve realizar o movimento até a musculatura travar e não ser mais possível executar a repetição corretamente.</p>
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
                        line-height: 1.5; 
                        color: #111; 
                        margin: 0; 
                        padding: 0;
                    }

                    .day-page, .guide-page {
                        padding: 10mm 10mm; /* Mantém respiro mas sem engolir muito espaço */
                    }

                    .header-container {
                        text-align: center;
                        background-color: #000;
                        color: #FFF;
                        padding: 15px 10px;
                        border-radius: 0 0 0 0; /* Zerei aqui pois a folha inteira já dita as margens se for a pág 1 */
                        margin-bottom: 0;
                    }
                    /* Força arredondamento no header global se necessário */
                    body > .header-container { border-radius: 8px 8px 0 0; margin-top: 12mm; margin-left: 10mm; margin-right: 10mm; }
                    body > .student-bar { margin-left: 10mm; margin-right: 10mm; }

                    .routine-name { font-size: 18px; font-weight: 900; letter-spacing: 1px; margin: 0; }
                    .student-bar { 
                        background-color: #4DE38F; 
                        color: #000; 
                        text-align: center;
                        font-size: 12px; 
                        font-weight: 800;
                        padding: 6px;
                        border-radius: 0 0 8px 8px;
                        margin-bottom: 25px; 
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }

                    .day-section { page-break-inside: avoid; }
                    
                    /* 🔥 Título do Dia agora desgrudado do topo 🔥 */
                    .day-title { 
                        font-size: 13px; 
                        color: #FFF; 
                        background-color: #222;
                        padding: 6px 14px;
                        border-radius: 6px;
                        margin-top: 15px; /* Espaço adicionado aqui! */
                        margin-bottom: 15px; 
                        font-weight: 800;
                        display: inline-block;
                        letter-spacing: 0.5px;
                    }

                    /* Título exclusivo do Guia para não ter margem extra no topo */
                    .guide-title {
                        font-size: 13px; 
                        color: #FFF; 
                        background-color: #222;
                        padding: 5px 12px;
                        border-radius: 6px;
                        margin-top: 0px; 
                        margin-bottom: 10px; 
                        font-weight: 800;
                        display: inline-block;
                        letter-spacing: 0.5px;
                    }

                    .workout-table { width: 100%; border-collapse: collapse; }
                    .workout-table td { 
                        padding: 12px 0; 
                        vertical-align: middle; 
                        border-bottom: 1px solid #E5E5EA; 
                    }
                    .ex-row:last-child td { border-bottom: none; }

                    .ex-number { width: 28px; text-align: left; font-weight: 900; color: #4DE38F; font-size: 16px;}
                    
                    .ex-image-container { width: 62px; text-align: left; padding-right: 12px; }
                    .ex-thumbnail { 
                        width: 54px; 
                        height: 96px; 
                        border-radius: 8px; 
                        object-fit: cover; 
                        border: 1px solid #CCC; 
                        background-color: #F2F2F7; 
                    }
                    
                    .ex-details { padding-left: 0px; }
                    .exercise-title { font-size: 12px; color: #000; font-weight: 800; display: block; margin-bottom: 8px; letter-spacing: 0.3px; }

                    .exercise-blocks { margin-top: 2px; }
                    .block-item { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
                    .sets-reps { font-size: 11px; color: #444; font-weight: 600; white-space: nowrap; }
                    .technique-tag { font-size: 9px; background-color: #F2F2F7; padding: 3px 6px; border-radius: 4px; margin-left: 6px; font-weight: 800; color: #000; border: 1px solid #DDD; }
                    .anotacao-carga { font-size: 10px; color: #888; white-space: nowrap; margin-left: 15px; font-weight: 600; }
                    .cardio-info { font-size: 11px; color: #555; font-style: italic; font-weight: bold; }
                    
                    /* 🔥 Guias Otimizados para caber em 1 página 🔥 */
                    .guide-section {
                        padding: 12px 14px;
                        border: 1px dashed #CCC;
                        border-radius: 12px;
                        background-color: #FAFAFA;
                    }
                    .guide-section p { margin: 6px 0; font-size: 10px; color: #333; line-height: 1.5; }
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