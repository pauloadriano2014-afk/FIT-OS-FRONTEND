const axios = require('axios');

const API_URL = 'https://fitos-final.onrender.com/api/exercises';

// Pegando sua lista gigante e transformando em objetos
const nomes = [
    "TESTE API NOVA", "Abdominal canivete", "Abdominal crunch", "Abdominal crunch c/pernas apoiadas", 
    "Abdominal crunch c/pernas elevadas", "Abdominal crunch no colchonete", "Abdominal infra c/bola", 
    "Abdominal infra na paralela", "Abdominal infra no colchonete", "Abdominal infra no espaldar", 
    "Abdominal máquina", "Abdominal no banco", "Abdominal no cross ajoelhado", "Abdominal no cross em pé", 
    "Abdominal remador", "Abdominal supra no banco declinado", "Máquina de abdômen Seven", "Prancha abdominal", 
    "Prancha com variação", "Prancha isométrica", "Prancha lateral", "Rodinha abdominal",
    "Crucifixo inclinado c/halteres", "Crucifixo reto c/halteres", "Cross-over polia alta", "Cross-over polia baixa", 
    "Flexão de braços", "Flexão com joelhos apoiados", "Peito na máquina", "Supino articulado", 
    "Supino articulado inclinado", "Supino articulado neutro", "Supino declinado c/halteres", 
    "Supino inclinado c/barra", "Supino inclinado c/halteres", "Supino máquina", "Supino no Smith", 
    "Supino turbo", "Supino reto c/halteres", "Voador frontal", "Voador frontal Cimerian",
    "Barra fixa pegada aberta", "Barra fixa pegada fechada", "Barra livre", "Graviton pegada aberta", 
    "Graviton pegada neutra fechada", "Levantamento terra", "Levantamento terra sumô", "Lombar no banco romano", 
    "Pulldown máquina", "Pulldown no cross barra", "Pulldown no cross barrinha", "Pulldown no cross corda", 
    "Puxada articulada", "Puxada articulada aberta", "Puxada c/triângulo", "Puxada frente aberta", 
    "Puxada frente c/triângulo", "Puxada frente pegada aberta pronada", "Puxada frente pegada aberta neutra", 
    "Puxada máquina", "Puxada supinada máquina", "Remada alta no cross", "Remada articulada", 
    "Remada articulada supinada", "Remada baixa", "Remada baixa c/triângulo", "Remada cavalinho", 
    "Remada cavalinho pegada aberta", "Remada cavalinho Seven", "Remada curvada c/barra", 
    "Remada curvada c/halteres", "Remada curvada máquina", "Remada curvada no banco 45°", 
    "Remada curvada no Smith", "Remada curvada pronada", "Remada curvada supinada", "Remada máquina", 
    "Remada máquina pegada neutra", "Remada no cross", "Remada no TRX", "Remada Seven", "Remada T", 
    "Remada T máquina", "Remada T Seven", "Serrote", "Terra com barra", "Terra no Smith", 
    "Voador invertido", "Voador invertido pegada neutra inversa"
];

// Função simples para categorizar baseado no nome (aproximado)
function getCategory(name) {
    if (name.toLowerCase().includes("abdominal") || name.toLowerCase().includes("prancha")) return "Abdominal";
    if (name.toLowerCase().includes("supino") || name.toLowerCase().includes("voador frontal") || name.toLowerCase().includes("crucifixo") || name.toLowerCase().includes("peito")) return "Peito";
    return "Costas"; // Simplificando para o teste
}

async function subirTudo() {
    console.log("⏳ Iniciando carga na Render... Isso pode demorar um pouco.");
    for (const nome of nomes) {
      try {
        await axios.post(API_URL, {
          name: nome,
          category: getCategory(nome),
          videoUrl: "",
          instructions: "Execução padrão FIT OS."
        });
        console.log(`✅ ${nome} enviado!`);
      } catch (e) {
        console.log(`❌ Erro no ${nome}: ${e.response?.data?.error || "Já existe"}`);
      }
    }
    console.log("🏁 Carga concluída!");
}

subirTudo();