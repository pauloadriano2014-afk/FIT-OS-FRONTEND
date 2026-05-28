import * as Print from 'expo-print';
import { Alert, Platform } from 'react-native';
import * as Sharing from 'expo-sharing';

export const generateWorkoutPDF = async (aluno, daysToPrint, exercisesByDay, workoutName = "PLANEJAMENTO DE TREINO") => {
    try {
        let htmlTreinos = '';

        daysToPrint.forEach((day) => {
            const exercicios = exercisesByDay[day] || [];
            htmlTreinos += `
                <div class="day-section">
                    <h2 class="day-title">DIA: ${day.toUpperCase()}</h2>
                    <table class="workout-table">
                        <tbody>`;

            exercicios.forEach((ex, idx) => {
                let blocksHtml = '';

                const isCardio = ex.category?.toLowerCase() === 'cardio' || ex.title?.toLowerCase().includes('esteira');

                if (isCardio) {
                    // Formato para Cardio: "30 kcal em 300 min"
                    blocksHtml = `<span class="cardio-info">${ex.blocks?.[0]?.sets || '30'} kcal em ${ex.blocks?.[0]?.reps || '300'} min</span>`;
                } else if (ex.blocks) {
                    ex.blocks.forEach(b => {
                        let cargaSpaces = '____'; // Padrão de 1 espaço
                        let techniqueDisplay = '';

                        if (b.technique?.toLowerCase() === 'drop-set') {
                            cargaSpaces = '____ | ____'; // CORRIGIDO: DOIS ESPAÇOS COM '|' PARA DROP-SET, CONFORME O PDF
                            techniqueDisplay = 'DROPSET';
                        } else if (b.technique?.toLowerCase() === '21') {
                            cargaSpaces = '____ | ____ | ____'; // TRÊS ESPAÇOS COM '|' PARA 21
                            techniqueDisplay = '21';
                        } else if (b.technique) {
                            techniqueDisplay = b.technique.toUpperCase();
                        }

                        // Lógica para "FALHA" e "RESTPAUSE"
                        let repsDisplay = b.reps;
                        if (b.reps?.toLowerCase() === 'falha') {
                            repsDisplay = 'FALHA';
                        }

                        // Ajuste para RESTPAUSE: aparece junto com as reps
                        if (techniqueDisplay === 'RESTPAUSE') {
                            repsDisplay = `${repsDisplay} RESTPAUSE`;
                            techniqueDisplay = ''; // Não exibe a tag separada se já está nas reps
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

                htmlTreinos += `
                    <tr class="ex-row">
                        <td class="ex-number">${idx + 1}</td>
                        <td class="ex-details">
                            <span class="exercise-title">${ex.title.toUpperCase()}</span>
                            <div class="exercise-blocks">${blocksHtml}</div>
                        </td>
                    </tr>`;
            });
            htmlTreinos += `
                        </tbody>
                    </table>
                </div>`;
        });

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>${workoutName} - ${aluno.name}</title>
                <style>
                    @page { size: A5 portrait; margin: 10mm; }
                    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 10px; line-height: 1.4; color: #333; }

                    /* Faixa para o nome da rotina */
                    .routine-header { 
                        text-align: center; 
                        color: #000; 
                        font-size: 16px; 
                        font-weight: bold;
                        margin-bottom: 5px; 
                        padding-bottom: 5px;
                        border-bottom: 2px solid #000; /* Faixa preta sólida */
                    }
                    .student-name { 
                        text-align: center; 
                        color: #555; 
                        font-size: 14px; 
                        margin-bottom: 15px; 
                    }

                    .day-section { margin-bottom: 20px; page-break-inside: avoid; }
                    .day-title { 
                        font-size: 14px; 
                        color: #000; 
                        margin-top: 15px; 
                        margin-bottom: 10px; 
                        padding-bottom: 5px; 
                        border-bottom: 1px solid #ccc; /* Contorno cinza sólido */
                    }
                    .workout-table { width: 100%; border-collapse: collapse; }
                    .workout-table td { padding: 4px 0; vertical-align: top; border-bottom: 1px dashed #eee; }
                    .ex-row:last-child td { border-bottom: none; }

                    .ex-number { width: 20px; text-align: center; font-weight: bold; color: #555; }
                    .ex-details { padding-left: 8px; }
                    .exercise-title { font-size: 12px; color: #000; font-weight: bold; display: block; margin-bottom: 4px; }

                    .exercise-blocks { margin-top: 2px; }
                    .block-item { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px; }
                    .sets-reps { font-size: 10px; color: #333; white-space: nowrap; }
                    .technique-tag { font-size: 8px; background-color: #eee; padding: 2px 4px; border-radius: 3px; margin-left: 4px; font-weight: bold; }
                    .anotacao-carga { font-size: 9px; color: #666; white-space: nowrap; margin-left: 10px; }
                    .cardio-info { font-size: 10px; color: #555; font-style: italic; }
                    strong { font-weight: bold; }
                </style>
            </head>
            <body>
                <div class="routine-header">${workoutName.toUpperCase()}</div>
                <div class="student-name">Aluno: ${aluno.name}</div>
                ${htmlTreinos}
                <div class="day-section" style="margin-top: 30px;">
                    <h2 class="day-title">GUIA DE TÉCNICAS</h2>
                    <p><strong>REST-PAUSE:</strong> Série até a falha, descanse 10-15s e retome.</p>
                    <p><strong>BI-SET:</strong> Dois exercícios sem descanso.</p>
                    <p><strong>DROP-SET:</strong> Faça até a falha, reduza 20-30% da carga e falhe novamente.</p>
                    <p><strong>MÉTODO 21:</strong> 7 parciais baixas, 7 altas, 7 completas.</p>
                </div>
            </body>
            </html>`;

        if (Platform.OS === 'web') {
            const win = window.open('', '_blank', 'width=800,height=600');
            win.document.write(htmlContent);
            win.document.close();
            win.onload = () => {
                win.print();
            };
        } else {
            const { uri } = await Print.printToFileAsync({ html: htmlContent });
            await Sharing.shareAsync(uri);
        }
    } catch (error) {
        console.error("Erro ao gerar PDF:", error);
        Alert.alert("Erro", "Não foi possível gerar o PDF. Tente novamente mais tarde.");
    }
};