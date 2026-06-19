// src/components/DayWorkout/workoutMaskUtils.js

// 🔥 MATEMÁTICA INTELIGENTE DE TEXTOS 🔥
// Pega qualquer texto ("20kgs de cada lado", "10 a 12") e multiplica APENAS os números.
export const applyMaskToString = (str, multiplier) => {
  if (!str) return str;
  return String(str).replace(/(\d+([.,]\d+)?)/g, (match) => {
    const num = parseFloat(match.replace(',', '.'));
    // Multiplica e arredonda para 1 casa decimal
    let calc = Math.round(num * multiplier * 10) / 10;
    return calc.toString().replace('.', ',');
  });
};

// Aplica a máscara de intensidade (deload 0.8x ou choque >1.0x) nos blocos
// de um exercício, retornando os blocos ajustados + a observação atualizada.
// Regras preservadas exatamente como estavam no fetchWorkoutData original:
// - deload (0.8): suspende técnica avançada (exceto TUT) e avisa na observação
// - choque (>1.0): aumenta o descanso em +30s e avisa na observação
export const applyIntensityMaskToBlocks = (blocks, multiplier, observation) => {
  let realObs = observation;

  const newBlocks = blocks.map(block => {
    let newBlock = { ...block };

    if (newBlock.load) {
      newBlock.load = applyMaskToString(newBlock.load, multiplier);
    }

    if (multiplier === 0.8) {
      if (newBlock.technique && newBlock.technique !== 'NORMAL' && newBlock.technique !== 'TUT') {
        newBlock.technique = 'NORMAL';
        realObs = `⚠️ DELOAD: Técnica avançada suspensa. ${realObs}`;
      }
    }

    if (multiplier > 1.0) {
      let currentRest = parseInt(newBlock.restTime) || 60;
      newBlock.restTime = String(currentRest + 30);
      if (!realObs.includes("CHOQUE")) {
        realObs = `🔥 CHOQUE: Descanso prolongado para +carga. ${realObs}`;
      }
    }
    return newBlock;
  });

  return { blocks: newBlocks, observation: realObs };
};