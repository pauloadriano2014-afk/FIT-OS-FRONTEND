const axios = require('axios');

const API_BASE = 'https://fitos-final.onrender.com/api';
const USER_ID = "1420f7f4-674c-4636-9c74-3f131f39cc44"; // <--- COLE SEU ID NOVO AQUI

async function montarTreinoSeguro() {
  try {
    console.log("🔍 Buscando exercícios na biblioteca...");
    const exRes = await axios.get(`${API_BASE}/exercises`);
    const biblioteca = exRes.data;

    if (biblioteca.length === 0) {
      return console.log("❌ Erro: Sua biblioteca de exercícios está vazia no banco!");
    }

    console.log(`📚 Encontrados ${biblioteca.length} exercícios. Montando treino...`);

    // Pegamos os 3 primeiros exercícios que existirem no banco, não importa o nome
    const listaParaEnviar = biblioteca.slice(0, 3).map(ex => ({
      exerciseId: ex.id,
      sets: 3,
      reps: 12
    }));

    const dadosTreino = {
      userId: USER_ID,
      name: "Peito e Tríceps Alpha",
      exercises: listaParaEnviar
    };

    const response = await axios.post(`${API_BASE}/workouts`, dadosTreino);
    
    console.log("✅ SUCESSO! Treino criado para o ID:", USER_ID);
    console.log("🚀 Verifique o celular agora!");

  } catch (error) {
    // Aqui ele vai cuspir o erro real se houver
    console.error("❌ Detalhe do erro:");
    console.log(error.response?.data || error.message);
  }
}

montarTreinoSeguro();