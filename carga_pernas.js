const axios = require('axios');

const API_BASE = 'https://fitos-final.onrender.com/api';

const novosExercicios = [
  // PERNAS
  { name: "Agachamento Livre", category: "Pernas", muscleGroup: "Quadríceps", videoUrl: "" },
  { name: "Cadeira Extensora", category: "Pernas", muscleGroup: "Quadríceps", videoUrl: "" },
  { name: "Leg Press 45", category: "Pernas", muscleGroup: "Quadríceps/Glúteo", videoUrl: "" },
  { name: "Leg Press Horizontal", category: "Pernas", muscleGroup: "Quadríceps", videoUrl: "" },
  { name: "Cadeira Flexora", category: "Pernas", muscleGroup: "Posterior", videoUrl: "" },
  { name: "Mesa Flexora", category: "Pernas", muscleGroup: "Posterior", videoUrl: "" },
  { name: "Cadeira Abdutora", category: "Pernas", muscleGroup: "Glúteo Médio", videoUrl: "" },
  { name: "Cadeira Adutora", category: "Pernas", muscleGroup: "Adutores", videoUrl: "" },
  { name: "Avanço com Halteres", category: "Pernas", muscleGroup: "Quadríceps/Glúteo", videoUrl: "" },
  { name: "Panturrilha Sentado", category: "Pernas", muscleGroup: "Gastrocnêmio", videoUrl: "" },
  { name: "Panturrilha em pé", category: "Pernas", muscleGroup: "Gastrocnêmio", videoUrl: "" },
  { name: "Stiff com Barra", category: "Pernas", muscleGroup: "Posterior/Lombar", videoUrl: "" },

  // OMBROS (Para completar o que faltava)
  { name: "Desenvolvimento com Halteres", category: "Ombros", muscleGroup: "Deltoide", videoUrl: "" },
  { name: "Elevação Lateral", category: "Ombros", muscleGroup: "Deltoide Lateral", videoUrl: "" },
  { name: "Elevação Frontal", category: "Ombros", muscleGroup: "Deltoide Frontal", videoUrl: "" },
  { name: "Encolhimento com Halteres", category: "Ombros", muscleGroup: "Trapézio", videoUrl: "" },
  { name: "Desenvolvimento Arnold", category: "Ombros", muscleGroup: "Deltoide", videoUrl: "" }
];

async function subirCarga() {
  console.log("🚀 Iniciando carga de Membros Inferiores e Ombros...");
  let cont = 0;

  for (const ex of novosExercicios) {
    try {
      await axios.post(`${API_BASE}/exercises`, ex);
      console.log(`✅ Adicionado: ${ex.name}`);
      cont++;
    } catch (e) {
      console.log(`⚠️ Erro ao adicionar ${ex.name}: Talvez já exista.`);
    }
  }

  console.log(`--- CARGA FINALIZADA: ${cont} novos exercícios no banco! ---`);
}

subirCarga();