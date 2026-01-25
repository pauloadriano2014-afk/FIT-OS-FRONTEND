const axios = require('axios');
const USER_ID = "1420f7f4-674c-4636-9c74-3f131f39cc44"; // Seu ID

async function atualizarDores() {
  await axios.post('https://fitos-final.onrender.com/api/anamnese', {
    userId: USER_ID,
    objetivo: "Hipertrofia",
    nivel: "Avançado",
    frequencia: 5,
    limitacoes: ["Joelho"], // Adicionamos a dor aqui para testar
    equipamentos: ["Halteres", "Máquinas"]
  });
  console.log("✅ Anamnese atualizada! Agora tente rodar o geradorInteligente.js");
}
atualizarDores();