const axios = require('axios');

const API_BASE = 'https://fitos-final.onrender.com/api';
const USER_ID = "57932790-1f7a-4c6c-868d-122e2f6f050c"; 

const RESTRICOES = {
  "Joelho": ["Levantamento terra", "Terra com barra"], 
  "Lombar": ["Levantamento terra", "Remada curvada c/barra"],
  "Punho": ["Barra fixa"]
};

const SUBSTITUTOS = {
  "Agachamento Livre": "Cadeira Extensora", 
  "Leg Press 45": "Cadeira Extensora",
  "Levantamento terra": "Lombar no banco romano", 
  "Remada curvada c/barra": "Remada baixa c/triângulo",
  "Supino reto c/halteres": "Voador frontal" 
};

async function gerarTreinoAutomatico() {
  console.log("--- INICIANDO GERADOR INTELIGENTE FIT OS ---");
  try {
    // 1. LER ANAMNESE
    console.log("📥 Lendo Anamnese do aluno...");
    const anaRes = await axios.get(`${API_BASE}/anamnese?userId=${USER_ID}`);
    const dores = anaRes.data?.limitacoes || [];
    console.log(`⚠️ Limitações identificadas: ${dores.join(', ') || 'Nenhuma'}`);

    // 2. BUSCAR BIBLIOTECA
    console.log("📚 Acessando biblioteca de exercícios...");
    const exRes = await axios.get(`${API_BASE}/exercises`);
    const biblioteca = exRes.data;

    // 3. PLANO DESEJADO (Nomes exatos da sua lista de 90)
    const planoDesejado = [
      "Levantamento terra", 
      "Supino reto c/halteres", 
      "Remada curvada c/barra",
      "Abdominal crunch"
    ];

    let treinoFinal = [];

    // 4. LÓGICA DE TROCA
    planoDesejado.forEach(nomeOriginal => {
      let exercicioParaAdicionar = nomeOriginal;

      dores.forEach(dor => {
        if (RESTRICOES[dor]?.some(r => nomeOriginal.toLowerCase().includes(r.toLowerCase()))) {
          const sugestao = SUBSTITUTOS[nomeOriginal];
          if (sugestao) {
            console.log(`🔄 [SEGURANÇA] Trocando ${nomeOriginal} por ${sugestao} devido a dor no(a) ${dor}`);
            exercicioParaAdicionar = sugestao;
          }
        }
      });

      const exEncontrado = biblioteca.find(e => 
        e.name.toLowerCase().trim() === exercicioParaAdicionar.toLowerCase().trim()
      );

      if (exEncontrado) {
        treinoFinal.push({ exerciseId: exEncontrado.id, sets: 3, reps: 15 });
        console.log(`✅ Confirmado: ${exEncontrado.name}`);
      } else {
        console.log(`⚠️ Erro: "${exercicioParaAdicionar}" não encontrado no banco.`);
      }
    });

    // 5. POST FINAL
    if (treinoFinal.length > 0) {
      console.log("📤 Enviando treino para o app...");
      await axios.post(`${API_BASE}/workouts`, {
        userId: USER_ID,
        name: "Treino Inteligente Alpha",
        exercises: treinoFinal
      });
      console.log("✅ SUCESSO! Treino criado e enviado ao App.");
    }

  } catch (error) {
    console.error("❌ Erro fatal:", error.message);
  }
}

// IMPORTANTE: Essa linha abaixo é que faz o script rodar!
gerarTreinoAutomatico();