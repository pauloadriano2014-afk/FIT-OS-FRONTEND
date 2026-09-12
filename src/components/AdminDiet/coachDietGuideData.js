// src/components/AdminDiet/coachDietGuideData.js
// Conteúdo explicativo voltado pro COACH, usado pela DietInfoModal em vários
// pontos da montagem de dieta (TMB/TDEE, déficit/superávit, ajuste fino,
// Raio-X do Aluno). Mesmo padrão de tom já usado em coachTechGuideData.js:
// explica pro coach como aplicar/entender, não como se ele fosse o aluno.
// 🔥 A escolha de modelo de IA NÃO é explicada aqui de propósito — a pedido
// do Paulo, essa parte não deve aparecer pros coachs parceiros. O tópico
// RAIO_X abaixo é sobre o painel "Raio-X do Aluno" (DietRaioX.js), acessível
// direto no cabeçalho da tela de dieta — NÃO é a aba interna do gerador de
// dieta por IA (ModelSelectorModal), que hoje não tem ponto de entrada.
export const DIET_GUIDE_TOPICS = {
    TMB_TDEE: {
        title: 'TMB E TDEE',
        icon: 'calculator-variant-outline',
        color: '#32ADE6',
        description: `TMB (TAXA METABÓLICA BASAL):
É quanto o corpo do aluno gasta em repouso total, só pra manter as funções vitais — sem contar nenhuma atividade do dia.

TDEE (GASTO TOTAL DIÁRIO):
É a TMB somada ao gasto com treino, atividades do dia e digestão dos alimentos. É o número de manutenção real do aluno: comendo essa quantidade, ele não ganha nem perde peso.

COMO VIRA A META DE KCAL:
A meta calórica da dieta é o TDEE mais ou menos um ajuste. Abaixo do TDEE gera déficit (emagrecimento); acima gera superávit (ganho de massa). Quanto maior a diferença, mais rápido o resultado — mas maior o risco de perder performance ou acumular gordura.

NA PRÁTICA:
Os dois vêm calculados automaticamente a partir do peso, altura, idade, sexo e frequência de treino da anamnese do aluno. Você não precisa calcular nada na mão — só usar esse entendimento pra decidir se a meta faz sentido pra esse aluno.`,
    },
    DEFICIT_SUPERAVIT: {
        title: 'DÉFICIT E SUPERÁVIT SEMANAL',
        icon: 'scale-balance',
        color: '#FF9500',
        description: `O QUE SIGNIFICA:
A estimativa de "kg por semana" é uma projeção de quanto peso o aluno tende a perder (déficit) ou ganhar (superávit), baseada na diferença entre a meta de kcal definida e o TDEE dele.

COMO É CALCULADO:
1kg de gordura equivale a cerca de 7700 kcal. A diferença diária de calorias é multiplicada por 7 dias e dividida por 7700 pra chegar na estimativa semanal.

NA PRÁTICA:
É uma estimativa, não uma promessa — varia com metabolismo, adesão e hormônios de cada aluno. Use como referência pra calibrar o ritmo: déficits muito agressivos (bem acima de 0,5-1% do peso corporal por semana) tendem a derrubar performance no treino e a adesão do aluno.`,
    },
    AJUSTE_FINO: {
        title: 'AJUSTE FINO: POR QUE SÓ AFETA ALGUNS ALIMENTOS',
        icon: 'tune',
        color: '#AF52DE',
        description: `O QUE FAZ:
Aumenta ou reduz a quantidade dos alimentos que já são a fonte PRINCIPAL do macro escolhido — não a dieta toda de forma igual.

COMO O APP DECIDE:
Pra cada alimento, o sistema identifica qual macro (carboidrato, proteína ou gordura) é o mais presente nele. Se você escolher "Carboidratos" e pedir +10%, só sobem os alimentos onde o carboidrato já é dominante (arroz, batata, aveia, por exemplo). Um alimento misto, com macros parecidos entre si, pode não ser afetado.

QUANDO USAR:
Ideal pra ajustes rápidos e direcionados, sem precisar editar alimento por alimento na mão. Se quiser mudar TUDO proporcionalmente — não só a fonte dominante de um macro — use a opção "Tudo (Calorias)".

DICA:
Se o resultado não bater com o esperado, use "Desfazer Ajuste Fino" pra restaurar a dieta e tentar de novo com outro escopo ou macro.`,
    },
    RAIO_X: {
        title: 'RAIO-X DO ALUNO',
        icon: 'file-find-outline',
        color: '#10A37F',
        description: `O QUE É:
Um resumo rápido da anamnese do aluno — objetivo e perfil, rotina, metas de macro do dia, restrições e saúde, suplementos e observações — tudo num painel só.

PRA QUE SERVE:
Consulta rápida enquanto você monta a dieta manualmente, sem precisar sair da tela ou abrir a anamnese completa em outro lugar. Útil pra conferir alergias, aversões, condições de saúde e a rotina do aluno antes de decidir os alimentos de cada refeição.

NA PRÁTICA:
Toque no botão "Raio-X" no topo da tela de dieta pra abrir e fechar esse painel a qualquer momento — ele é só consulta, não altera nada na dieta.`,
    },
};
