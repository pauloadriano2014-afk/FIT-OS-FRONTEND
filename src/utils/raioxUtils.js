// src/utils/raioxUtils.js

export const fetchAndProcessRaioxData = async (alunoId, activeWorkouts, archivedWorkouts) => {
    try {
        const res = await fetch(`https://fitos-final.onrender.com/api/user/history?userId=${alunoId}&t=${Date.now()}`);
        if (!res.ok) return [];
        const historyList = await res.json();

        let mapaMatriz = {};
        let mapaDias = {}; 
        let mapaOrdem = {}; 
        let mapaIsCardio = {}; 
        let mapaExpectedSets = {}; 

        const todosTreinos = [...activeWorkouts, ...archivedWorkouts];
        const knownPrograms = new Set();

        todosTreinos.forEach(w => {
            const programName = (w.name || "").trim().toUpperCase();
            knownPrograms.add(programName);

            if (w.exercises && Array.isArray(w.exercises)) {
                w.exercises.forEach((ex, exIndex) => {
                    const exDay = ex.day || "Treino Geral";
                    const exNameForFallback = (ex.exercise?.name || ex.name || "Exercício").trim().toUpperCase();

                    if (ex.exerciseId) mapaDias[`${programName}_${ex.exerciseId}`] = exDay;
                    mapaDias[`${programName}_${exNameForFallback}`] = exDay;

                    if (ex.exerciseId) {
                        let finalExDay = exDay;
                        if (finalExDay.length === 1) finalExDay = `TREINO ${finalExDay.toUpperCase()}`;
                        const dayKey = finalExDay.toUpperCase();

                        const keyBase = `${programName}_${dayKey}_${ex.exerciseId}`;
                        const fallbackBase = `${programName}_${ex.exerciseId}`;

                        mapaOrdem[keyBase] = exIndex;
                        mapaOrdem[fallbackBase] = exIndex;
                        mapaOrdem[`${programName}_${exNameForFallback}`] = exIndex; 

                        const isCardioFlag = !!(
                            ex.isCardio || ex.category === 'CARDIO' || ex.type === 'CARDIO' || 
                            (ex.exercise && (ex.exercise.isCardio || ex.exercise.category === 'CARDIO' || ex.exercise.type === 'CARDIO'))
                        );
                        mapaIsCardio[ex.exerciseId] = isCardioFlag;
                        mapaIsCardio[exNameForFallback] = isCardioFlag;

                        let blockIndex = 0;
                        if (ex.blocks && Array.isArray(ex.blocks) && ex.blocks.length > 0) {
                            ex.blocks.forEach(blk => {
                                const sets = parseInt(blk.sets) || 1;
                                const rArr = String(blk.reps || "12").split(/[-/]/);
                                const tArr = String(blk.technique || "").split(/[-/]/);
                                for(let i=0; i<sets; i++) {
                                    mapaMatriz[`${keyBase}_${blockIndex}`] = { r: rArr[i] || rArr[0], t: tArr[i] || tArr[0] };
                                    mapaMatriz[`${fallbackBase}_${blockIndex}`] = { r: rArr[i] || rArr[0], t: tArr[i] || tArr[0] };
                                    blockIndex++;
                                }
                            });
                        } else {
                            let parsedFromTech = false;
                            if (typeof ex.technique === 'string' && ex.technique.includes('{')) {
                                try {
                                    const parsed = JSON.parse(ex.technique);
                                    const blocks = parsed.b || parsed.B;
                                    if (blocks && Array.isArray(blocks)) {
                                        blocks.forEach(blk => {
                                            const sets = parseInt(blk.sets || blk.SETS) || 1;
                                            const rArr = String(blk.reps || blk.REPS || "12").split(/[-/]/);
                                            const tArr = String(blk.technique || blk.TECHNIQUE || "").split(/[-/]/);
                                            for (let i = 0; i < sets; i++) {
                                                mapaMatriz[`${keyBase}_${blockIndex}`] = { r: rArr[i] || rArr[0], t: tArr[i] || tArr[0] };
                                                mapaMatriz[`${fallbackBase}_${blockIndex}`] = { r: rArr[i] || rArr[0], t: tArr[i] || tArr[0] };
                                                blockIndex++;
                                            }
                                        });
                                        parsedFromTech = true;
                                    }
                                } catch(e) {}
                            }
                            if (!parsedFromTech) {
                                const numSets = parseInt(ex.sets) || 3;
                                const rArr = String(ex.reps || "12").split(/[-/]/);
                                const tArr = String(ex.technique || "").split(/[-/]/);
                                for (let i = 0; i < numSets; i++) {
                                    mapaMatriz[`${keyBase}_${blockIndex}`] = { r: rArr[i] || rArr[0], t: tArr[i] || tArr[0] };
                                    mapaMatriz[`${fallbackBase}_${blockIndex}`] = { r: rArr[i] || rArr[0], t: tArr[i] || tArr[0] };
                                    blockIndex++;
                                }
                            }
                        }
                        mapaExpectedSets[keyBase] = blockIndex;
                        mapaExpectedSets[fallbackBase] = blockIndex;
                    }
                });
            }
        });

        let listaPlana = [];
        
        if (Array.isArray(historyList)) {
            historyList.forEach(hist => {
                const dataFormatada = new Date(hist.date).toLocaleDateString('pt-BR');
                const rpeDoTreino = hist.rpe || null; 

                let rawName = (hist.name || "Treino Geral").trim().toUpperCase();
                let rawWorkoutName = (hist.workoutName || "Sem Programa").trim().toUpperCase();

                let resolvedProgram = "Sem Programa";
                let resolvedDayFallback = "Treino Geral";

                if (knownPrograms.has(rawName)) {
                    resolvedProgram = hist.name;
                    resolvedDayFallback = hist.workoutName || "Treino Geral";
                } else if (knownPrograms.has(rawWorkoutName)) {
                    resolvedProgram = hist.workoutName;
                    resolvedDayFallback = hist.name || "Treino Geral";
                } else {
                    resolvedProgram = hist.workoutName || "Sem Programa";
                    resolvedDayFallback = hist.name || "Treino Geral";
                    if (resolvedProgram.length === 1 && resolvedDayFallback.length > 1) {
                        const temp = resolvedProgram;
                        resolvedProgram = resolvedDayFallback;
                        resolvedDayFallback = temp;
                    }
                }

                const programKey = resolvedProgram.trim().toUpperCase();

                let sessionDays = {};
                if (hist.details && hist.details.length > 0) {
                    hist.details.forEach(d => {
                        let pDay = mapaDias[`${programKey}_${d.exerciseId}`];
                        if (pDay) sessionDays[pDay] = (sessionDays[pDay] || 0) + 1;
                    });
                }
                
                let votedDay = resolvedDayFallback;
                if (!votedDay || votedDay.toUpperCase() === 'TREINO GERAL' || votedDay.toUpperCase() === 'SEM PROGRAMA') {
                    let maxCount = 0;
                    for (const [day, count] of Object.entries(sessionDays)) {
                        if (count > maxCount) {
                            maxCount = count;
                            votedDay = day;
                        }
                    }
                }
                
                let finalDay = votedDay || "Treino Geral";
                if (finalDay.length === 1) finalDay = `TREINO ${finalDay.toUpperCase()}`;
                const dayKey = finalDay.trim().toUpperCase();

                if (hist.details && hist.details.length > 0) {
                    let exMap = {};
                    const detalhesOrdenados = [...hist.details].sort((a, b) => a.setNumber - b.setNumber);

                    detalhesOrdenados.forEach((detail) => {
                        const exIdSafe = detail.exerciseId || "sem_id";
                        const exNameSafe = detail.exerciseName || "Exercício";
                        const nameUpper = exNameSafe.toUpperCase();
                        const chaveUnica = `${exIdSafe}_${exNameSafe}_${hist.id}`; 

                        const searchKeyBase = `${programKey}_${dayKey}_${exIdSafe}`;
                        const searchFallback = `${programKey}_${exIdSafe}`;
                        const searchNameFallback = `${programKey}_${nameUpper}`;

                        const isCardioFallback = nameUpper.includes('ESCADA') || nameUpper.includes('ESTEIRA') || nameUpper.includes('BICICLETA') || nameUpper.includes('BIKE') || nameUpper.includes('ELÍPTICO') || nameUpper.includes('CARDIO');
                        const isCardio = mapaIsCardio[exIdSafe] || mapaIsCardio[nameUpper] || isCardioFallback;

                        let finalOrder = 999;
                        if (mapaOrdem[searchKeyBase] !== undefined) finalOrder = mapaOrdem[searchKeyBase];
                        else if (mapaOrdem[searchFallback] !== undefined) finalOrder = mapaOrdem[searchFallback];
                        else if (mapaOrdem[searchNameFallback] !== undefined) finalOrder = mapaOrdem[searchNameFallback];
                        if (isCardio && finalOrder === 999) finalOrder = 1000; 

                        if (!exMap[chaveUnica]) {
                            exMap[chaveUnica] = {
                                exerciseName: exNameSafe,
                                programName: resolvedProgram,
                                dayName: finalDay,
                                isCardio: isCardio, 
                                maxWeight: 0,
                                totalVolume: 0, 
                                max1RM: 0,      
                                rpe: rpeDoTreino,
                                setsData: [],
                                orderIndex: finalOrder,
                                searchKeyBase,
                                searchFallback,
                                rawWeightsArray: [] 
                            };
                        }
                        
                        let wStr = detail.weight || "0";
                        if (typeof wStr === 'string' && (wStr.includes('/') || wStr.includes('-'))) {
                            const parts = wStr.split(/[-/]/);
                            parts.forEach(p => exMap[chaveUnica].rawWeightsArray.push(parseFloat(p) || 0));
                        } else {
                            exMap[chaveUnica].rawWeightsArray.push(parseFloat(wStr) || 0);
                        }
                    });

                    Object.keys(exMap).forEach(chave => {
                        const exObj = exMap[chave];
                        let expectedSets = mapaExpectedSets[exObj.searchKeyBase] || mapaExpectedSets[exObj.searchFallback] || 0;
                        const weights = exObj.rawWeightsArray;
                        
                        if (expectedSets === 0) expectedSets = weights.length || 3;

                        let wPointer = 0;
                        let sIndex = 0;

                        while (wPointer < weights.length) {
                            let currentWeights = [];
                            
                            if (sIndex === expectedSets - 1 && weights.length > expectedSets) {
                                while (wPointer < weights.length) {
                                    currentWeights.push(weights[wPointer]);
                                    wPointer++;
                                }
                            } else {
                                currentWeights.push(weights[wPointer]);
                                wPointer++;
                            }

                            // 🔥 A LIMPEZA DO ZERO FANTASMA 🔥
                            // Arranca os zeros do começo caso o aluno tenha deixado a caixa principal em branco
                            while (currentWeights.length > 1 && currentWeights[0] === 0) {
                                currentWeights.shift();
                            }

                            const maxW = Math.max(...currentWeights);
                            if (maxW > exObj.maxWeight) exObj.maxWeight = maxW;

                            const infoMatriz = mapaMatriz[`${exObj.searchKeyBase}_${sIndex}`] || mapaMatriz[`${exObj.searchFallback}_${sIndex}`] || {};
                            let repExata = infoMatriz.r || "12";
                            let techExata = infoMatriz.t || null;

                            if (typeof repExata === 'string' && (repExata.includes('{') || repExata.includes('[{'))) {
                                try {
                                    const parsed = JSON.parse(repExata);
                                    if (parsed.B && Array.isArray(parsed.B)) repExata = parsed.B[0]?.REPS || "12";
                                    else if (Array.isArray(parsed)) repExata = parsed[0]?.reps || "12";
                                    else repExata = "Falha";
                                } catch(e) { repExata = "Falha"; }
                            }
                            if (typeof techExata === 'string' && techExata.includes('{')) techExata = null;

                            if (!exObj.isCardio) {
                                const repsNum = parseInt(repExata) || 1;
                                currentWeights.forEach(cw => { exObj.totalVolume += (cw * repsNum); });
                                const estimated1RM = maxW * (1 + (repsNum / 30));  
                                if (estimated1RM > exObj.max1RM) exObj.max1RM = Math.round(estimated1RM);
                            }

                            exObj.setsData.push({
                                setLabel: `S${sIndex + 1}`,
                                weight: maxW, 
                                rawWeights: currentWeights, 
                                reps: repExata, 
                                technique: techExata && techExata !== 'NORMAL' ? techExata : null
                            });
                            sIndex++;
                        }
                        
                        const { searchKeyBase, searchFallback, rawWeightsArray, ...restoDoObjeto } = exObj;
                        listaPlana.push({ ...restoDoObjeto, dateObj: new Date(hist.date), dateFormatted: dataFormatada });
                    });
                }
            });
        }

        listaPlana.sort((a,b) => b.dateObj - a.dateObj);
        return listaPlana;
        
    } catch (e) {
        console.log("Erro", e);
        return [];
    }
};