// src/data/foodPortions.js
//
// Mapeamento de porções reais por alimento (keyed by food ID)
// Formato de cada entrada:
//   [unidade]: gramas equivalentes
//   default_amount: quantidade padrão ao adicionar o alimento
//   default_unit:   unidade padrão ao adicionar o alimento
//
// O toGrams() consulta aqui primeiro; se não encontrar, usa o UNIT_GRAM_FACTOR global.

export const FOOD_PORTIONS = {

    // ─── FRIOS E LATICÍNIOS ─────────────────────────────────────────────────
    "007db8e3-a973-42b1-bfc6-2fbe4db8203c": { // Queijo Cottage Tradicional
        colher: 30, xícara: 200,
        default_amount: 100, default_unit: 'g',
    },
    "cd8c60da-8274-4ca4-860c-2f90efa3852b": { // Queijo Cottage Zero Lactose
        colher: 30, xícara: 200,
        default_amount: 100, default_unit: 'g',
    },
    "113ea8da-304f-4e50-a179-3928ec9a45d3": { // Presunto Magro
        fatia: 20, unid: 20,
        default_amount: 3, default_unit: 'fatia',
    },
    "b0401676-2436-4cb7-bc3a-fec7d3c926e8": { // Peito de Peru
        fatia: 20, unid: 20,
        default_amount: 3, default_unit: 'fatia',
    },
    "70593cb8-1b57-4568-bce5-e5df4d0ca573": { // Peito de Frango Fatiado
        fatia: 20, unid: 20,
        default_amount: 3, default_unit: 'fatia',
    },
    "37933f71-d0f4-40e8-a5f7-2f1a421dc3e5": { // Queijo Mussarela Light
        fatia: 20, unid: 20,
        default_amount: 2, default_unit: 'fatia',
    },
    "c4ef1a39-239f-4ef3-9311-547d2e4e6c17": { // Queijo Minas Frescal Light
        fatia: 30, unid: 50,
        default_amount: 1, default_unit: 'fatia',
    },
    "2f97eec4-3960-4f00-a837-de29816952d0": { // Queijo Minas Frescal Zero Lactose
        fatia: 30, unid: 50,
        default_amount: 1, default_unit: 'fatia',
    },
    "5b756560-1b27-4585-8b29-895c1331841d": { // Queijo Ricota Fresca
        fatia: 30, colher: 30, xícara: 200,
        default_amount: 50, default_unit: 'g',
    },
    "5173b746-5df8-41a6-a4a9-b9f05b0d9728": { // Requeijão Light
        colher: 30, unid: 30,
        default_amount: 1, default_unit: 'colher',
    },
    "f4853385-a860-4f75-a211-e980284ccb8d": { // Requeijão Zero Lactose
        colher: 30, unid: 30,
        default_amount: 1, default_unit: 'colher',
    },
    "dcf4bf32-0625-4153-9f18-9b2a2f19456b": { // Requeijão Tradicional
        colher: 30, unid: 30,
        default_amount: 1, default_unit: 'colher',
    },
    "66d58061-8fef-443c-a2ea-9ad352947b67": { // Cream Cheese Light
        colher: 30,
        default_amount: 1, default_unit: 'colher',
    },
    "20b6367c-224f-4b5e-86d5-798d72cfe1c2": { // Cream Cheese Zero Lactose
        colher: 30,
        default_amount: 1, default_unit: 'colher',
    },
    "495230df-6c3e-471f-b748-826726d8051b": { // Creme de Ricota Light
        colher: 30,
        default_amount: 1, default_unit: 'colher',
    },
    "e7bdae09-3a03-49c1-9354-07a7104b5485": { // Iogurte Natural Desnatado
        colher: 50, xícara: 200,
        default_amount: 200, default_unit: 'g',
    },
    "278f4db6-05cc-46ff-b61d-ea7f25dc18dd": { // Iogurte Natural Integral
        colher: 50, xícara: 200,
        default_amount: 200, default_unit: 'g',
    },
    "3a622feb-79dc-4370-840f-6c14b7f74b5f": { // Iogurte Grego Tradicional
        colher: 50, xícara: 200,
        default_amount: 100, default_unit: 'g',
    },
    "3a90b75d-1a78-4e32-a8bc-34b45bb88f22": { // Iogurte Grego Zero/Light
        colher: 50, xícara: 200,
        default_amount: 100, default_unit: 'g',
    },
    "f86484b3-5bb8-481b-8960-348838b3dcfe": { // Leite Desnatado
        xícara: 240, colher: 15,
        default_amount: 200, default_unit: 'ml',
    },
    "170938c7-3d40-4870-a975-a12267948ce2": { // Leite Integral
        xícara: 240, colher: 15,
        default_amount: 200, default_unit: 'ml',
    },
    "d0e79c1d-ac84-476e-88d9-34b87f4c821f": { // Leite Zero Lactose
        xícara: 240, colher: 15,
        default_amount: 200, default_unit: 'ml',
    },
    "bc64560d-4a02-452e-996e-bc9cd11e50a5": { // Lombo Defumado Fatiado
        fatia: 25, unid: 25,
        default_amount: 3, default_unit: 'fatia',
    },

    // ─── CARNES E PROTEÍNAS ─────────────────────────────────────────────────
    "67b01945-62f7-46f7-99a2-3da821043103": { // Ovos Inteiros
        unid: 60,
        default_amount: 2, default_unit: 'unid',
    },
    "f222d975-044d-46fe-8545-461730743f81": { // Ovos Mexidos
        unid: 60,
        default_amount: 2, default_unit: 'unid',
    },
    "fffd8a66-8193-4efa-bb0f-6de4fd4c8488": { // Clara de Ovo
        unid: 33,
        default_amount: 3, default_unit: 'unid',
    },
    // Carnes em geral: base_unit já é 'g', default 150g
    "7fa55081-0dd9-451d-8c4a-4a8afb44bded": { default_amount: 150, default_unit: 'g' }, // Frango Grelhado
    "b2c9bdb7-9e51-446f-993d-cb1bd828230f": { default_amount: 150, default_unit: 'g' }, // Frango Desfiado
    "76ba67e7-bbde-49d8-a5fd-f007e3d30d95": { default_amount: 150, default_unit: 'g' }, // Patinho
    "96d11aa4-1368-4b41-a110-36a636f54773": { default_amount: 150, default_unit: 'g' }, // Carne Moída
    "928041e8-b77b-488d-ae0e-4864da283de2": { default_amount: 150, default_unit: 'g' }, // Tilápia
    "bdeb253d-07fe-49d3-baf7-d7f9aa3c4b15": { default_amount: 150, default_unit: 'g' }, // Salmão

    // ─── CARBOIDRATOS ───────────────────────────────────────────────────────
    "fa4ba3b8-fcf4-4583-90bc-b25adea4fc83": { // Arroz Branco (cozido)
        colher: 30, xícara: 160,
        default_amount: 4, default_unit: 'colher',
    },
    "eccd514c-e738-4ee0-a738-64f43e6e84d3": { // Arroz Integral (cozido)
        colher: 30, xícara: 160,
        default_amount: 4, default_unit: 'colher',
    },
    "edc8a4fd-6003-4b34-8d6f-107b230285e9": { // Batata Inglesa Cozida
        unid: 150, fatia: 30,
        default_amount: 1, default_unit: 'unid',
    },
    "7ff6a7f4-fed3-4c3f-925b-c0d3e342e948": { // Batata Doce Cozida
        unid: 120, fatia: 30,
        default_amount: 1, default_unit: 'unid',
    },
    "03855a07-e9d9-4a90-99b5-3b3c0bf14c36": { // Purê de Batata
        colher: 50, xícara: 200,
        default_amount: 200, default_unit: 'g',
    },
    "c7d2240a-bbc7-4da6-a756-74fcefae834e": { // Mandioca Cozida
        fatia: 50, unid: 150,
        default_amount: 150, default_unit: 'g',
    },
    "8bb16ab4-95db-4938-b65b-158e7587e550": { // Macarrão Cozido
        colher: 50, xícara: 200,
        default_amount: 200, default_unit: 'g',
    },
    "5c9cde6a-80af-4f4a-917c-1503a0eebaf2": { // Macarrão Integral
        colher: 50, xícara: 200,
        default_amount: 200, default_unit: 'g',
    },
    "4b6eb78f-05e5-4651-9d00-cab24c986933": { // Pão de Forma Tradicional
        fatia: 25, unid: 25,
        default_amount: 2, default_unit: 'fatia',
    },
    "a416e4fe-77e0-459b-bbab-836a3ede4e4c": { // Pão Francês
        unid: 50,
        default_amount: 1, default_unit: 'unid',
    },
    "08301bb2-f4e4-4a49-8e98-8123ef56ba87": { // Pão Integral
        fatia: 25, unid: 50,
        default_amount: 2, default_unit: 'fatia',
    },
    "1f1f1fef-c237-4a0b-ab5c-81e958ae1525": { // Tapioca (Goma)
        colher: 20, xícara: 80,
        default_amount: 40, default_unit: 'g',
    },
    "7e243728-4e02-4c0f-ba69-eea10fa54b09": { // Rap10
        unid: 30,
        default_amount: 1, default_unit: 'unid',
    },
    "bdb59103-6887-4140-811c-5ede8da11a8b": { // Aveia em Flocos
        colher: 15, xícara: 80,
        default_amount: 4, default_unit: 'colher',
    },
    "d7496913-168c-4a93-bcd3-4d87dd9a1839": { // Aveia em Flocos Fina
        colher: 15, xícara: 80,
        default_amount: 4, default_unit: 'colher',
    },
    "6ee92b18-57fe-44ef-9725-d3e6649bddf8": { // Farinha de Aveia
        colher: 15, xícara: 80,
        default_amount: 4, default_unit: 'colher',
    },
    "c5de1014-accc-47f9-a8e2-9aa3054468c3": { // Farelo de Aveia
        colher: 10, xícara: 60,
        default_amount: 2, default_unit: 'colher',
    },
    "9d36b48b-2477-4e00-b3e7-3c49d0544d93": { // Cuscuz de Milho
        colher: 35, xícara: 160,
        default_amount: 150, default_unit: 'g',
    },
    "6fecb9d2-fe2f-45b7-957e-c87d9d190bae": { // Feijão Carioca Cozido
        colher: 45, xícara: 170,
        default_amount: 3, default_unit: 'colher',
    },
    "7b85d6df-5842-4a4b-b2fa-a60e6cdf3710": { // Feijão Preto Cozido
        colher: 45, xícara: 170,
        default_amount: 3, default_unit: 'colher',
    },
    "33e2a094-a7e3-4bc1-9c7b-b698ac220286": { // Lentilha Cozida
        colher: 45, xícara: 170,
        default_amount: 150, default_unit: 'g',
    },
    "38432feb-91a7-4b86-901a-49d1cb9835ee": { // Grão de Bico Cozido
        colher: 45, xícara: 170,
        default_amount: 100, default_unit: 'g',
    },
    "91473bf8-08c8-4b6b-a64b-b03b0cc36ee6": { // Chia
        colher: 10,
        default_amount: 1, default_unit: 'colher',
    },
    "d6289c5c-0e46-4f0f-a972-5f8ddb0a30b2": { // Farinha de Linhaça
        colher: 10,
        default_amount: 1, default_unit: 'colher',
    },
    "54233fa3-2c99-4a4e-a8ad-2351d23d940d": { // Biscoito de Arroz
        unid: 12,
        default_amount: 3, default_unit: 'unid',
    },
    "c0ed9025-fc41-431c-8602-82a4fdca4989": { // Torrada Integral
        unid: 10, fatia: 10,
        default_amount: 3, default_unit: 'unid',
    },
    "1837aac1-0130-4af8-afc1-b41f1224dcd6": { // Granola Tradicional
        colher: 30, xícara: 100,
        default_amount: 3, default_unit: 'colher',
    },
    "f18d2eba-655c-4ec2-96ef-c2e9af1f7e22": { // Granola Sem Açúcar
        colher: 30, xícara: 100,
        default_amount: 3, default_unit: 'colher',
    },
    "938cacd3-6c3d-4abe-be38-27fedcaa3349": { // Mel de Abelha
        colher: 20,
        default_amount: 1, default_unit: 'colher',
    },
    "5f510aa0-ea56-4035-9182-e78da7f663d4": { // Geleia de Frutas Tradicional
        colher: 20,
        default_amount: 1, default_unit: 'colher',
    },
    "638a0cc5-0b55-41b4-9c47-a6d63ab992c1": { // Geleia 100% Fruta
        colher: 20,
        default_amount: 1, default_unit: 'colher',
    },
    "0bcd050b-fb6a-44ed-8476-29843a3073e0": { // Açúcar
        colher: 10,
        default_amount: 1, default_unit: 'colher',
    },
    "9b1aebc9-8047-4ed0-8e36-30a9196f9dcf": { // Chocolate Meio Amargo
        fatia: 30, unid: 30,
        default_amount: 30, default_unit: 'g',
    },
    "cda302e6-87d8-4088-8991-08d9e1c907ac": { // Leite Condensado
        colher: 30,
        default_amount: 2, default_unit: 'colher',
    },

    // ─── VEGETAIS E LEGUMES ─────────────────────────────────────────────────
    "32176cad-4be1-488b-b832-418e5a4b73b6": { // Brócolis
        colher: 30, xícara: 90,
        default_amount: 100, default_unit: 'g',
    },
    "72a49b38-678d-4a86-bfad-edbd9e43144a": { // Cenoura Cozida
        unid: 80, fatia: 15,
        default_amount: 1, default_unit: 'unid',
    },
    "de9983d1-e91a-4ec8-a332-ac4e1fb88c1b": { // Cenoura Crua
        unid: 80, fatia: 15,
        default_amount: 1, default_unit: 'unid',
    },
    "07ee0c78-a5d0-4e15-958f-99ec793f0c07": { // Abóbora Cabotiá
        colher: 40, xícara: 150, fatia: 80,
        default_amount: 100, default_unit: 'g',
    },
    "ba4cb07b-d4aa-4fdd-bcdc-f87f65b48947": { // Beterraba
        unid: 100, fatia: 20,
        default_amount: 100, default_unit: 'g',
    },
    "260caaae-d322-4698-a038-9019dd6ec6be": { // Alface
        xícara: 30,
        default_amount: 100, default_unit: 'g',
    },
    "50f4acaa-7e2b-4301-a955-4b53ed859115": { // Tomate
        unid: 100, fatia: 25,
        default_amount: 1, default_unit: 'unid',
    },
    "1ec4a304-075f-42c6-896a-37d4e32e59dd": { // Cebola
        unid: 100,
        default_amount: 0.5, default_unit: 'unid',
    },

    // ─── FRUTAS ─────────────────────────────────────────────────────────────
    "0ce696b0-b106-4e62-b573-adb10cedf5cb": { // Banana
        unid: 120, fatia: 60,
        default_amount: 1, default_unit: 'unid',
    },
    "c6135c45-4ef6-4400-8dfb-15b0f9d348a9": { // Maçã
        unid: 150,
        default_amount: 1, default_unit: 'unid',
    },
    "28800928-9e99-40e7-8083-c3971f515c58": { // Mamão
        fatia: 150, unid: 400,
        default_amount: 1, default_unit: 'fatia',
    },
    "d2405198-da0f-4315-8695-884113fad06d": { // Morango
        unid: 12,
        default_amount: 8, default_unit: 'unid',
    },
    "6bfd6d71-ca30-408f-ad2d-619db96539c6": { // Uva
        unid: 5,
        default_amount: 20, default_unit: 'unid',
    },
    "fa1e0345-27ec-48f1-ac54-0cb253dbf115": { // Melancia
        fatia: 200, unid: 500,
        default_amount: 1, default_unit: 'fatia',
    },
    "47610ca2-9832-46dc-8cbc-ea01e975b378": { // Melão
        fatia: 150, unid: 400,
        default_amount: 1, default_unit: 'fatia',
    },
    "1dd3926b-15ce-4eb6-97a3-d6fdde82eece": { // Abacaxi
        fatia: 80, unid: 800,
        default_amount: 1, default_unit: 'fatia',
    },
    "e1ba74a1-b412-4ea9-98ca-ecba737d2ceb": { // Laranja
        unid: 180,
        default_amount: 1, default_unit: 'unid',
    },
    "0fc98662-67ee-4839-afa1-ef0fc0073c66": { // Tangerina
        unid: 100,
        default_amount: 1, default_unit: 'unid',
    },
    "eeae57e2-1be0-4bfc-87db-aa4bc11a882e": { // Kiwi
        unid: 80,
        default_amount: 1, default_unit: 'unid',
    },
    "7903ce58-fe38-4656-b0dc-7e934cbe4755": { // Pera
        unid: 170,
        default_amount: 1, default_unit: 'unid',
    },

    // ─── GORDURAS E OLEAGINOSAS ─────────────────────────────────────────────
    "745c31e4-42df-441a-9f9c-11cc14d5de1a": { // Azeite de Oliva
        colher: 15,
        default_amount: 1, default_unit: 'colher',
    },
    "9696c9b6-9bd9-447d-bb16-052eef5132c9": { // Pasta de Amendoim
        colher: 32,
        default_amount: 1, default_unit: 'colher',
    },
    "0c1231ef-f333-4d16-a7e9-7166d7effbab": { // Castanha do Pará
        unid: 5,
        default_amount: 4, default_unit: 'unid',
    },
    "200b4eb5-4d0b-4ac8-ad48-dea90e29cc02": { // Nozes
        unid: 7,
        default_amount: 4, default_unit: 'unid',
    },
    "1813dae5-8b33-4042-8e2c-0449b470c61d": { // Manteiga
        colher: 14, fatia: 10,
        default_amount: 1, default_unit: 'colher',
    },
    "82a2525d-5289-41c8-9462-e41626e57f6c": { // Abacate
        fatia: 50, colher: 30,
        default_amount: 100, default_unit: 'g',
    },

    // ─── SUPLEMENTOS ────────────────────────────────────────────────────────
    "5e622521-7d89-4b94-b2b3-0e9cc0d18c2c": { // Whey Protein Concentrado
        colher: 30,
        default_amount: 1, default_unit: 'colher',
    },
    "89342d9f-e9c8-425e-b821-f9538e8257de": { // Whey Protein Isolado
        colher: 30,
        default_amount: 1, default_unit: 'colher',
    },
    "ffb77725-d6de-4141-8f3c-5bab89b4179a": { // Albumina
        colher: 30,
        default_amount: 1, default_unit: 'colher',
    },
    "4aada106-afd7-4c25-baad-d81838d10912": { // Caseína
        colher: 30,
        default_amount: 1, default_unit: 'colher',
    },
    "34c424a4-0dfd-43a8-87a4-f480980bc7f9": { // Barra de Proteína Bold
        unid: 60,
        default_amount: 1, default_unit: 'unid',
    },
    "bd4ad270-97ca-434a-86b3-79c07f8d1579": { // Barra Darkness
        unid: 60,
        default_amount: 1, default_unit: 'unid',
    },
    "392c9ff5-61d3-4282-8d1d-94b5ddc07844": { // Barra Crisp
        unid: 45,
        default_amount: 1, default_unit: 'unid',
    },
    "533f3771-9ba7-4736-9698-d8984ca3b65e": { // Barra Whey Bar
        unid: 50,
        default_amount: 1, default_unit: 'unid',
    },
    "62": { // Barra de Proteína genérica
        unid: 60,
        default_amount: 1, default_unit: 'unid',
    },
    "40d69ef4-0def-4490-9143-9d780f46f002": { // YoPRO 15g
        unid: 250,
        default_amount: 1, default_unit: 'unid',
    },
    "7b22ccb6-5da7-4429-831b-f3af86df6a0a": { // YoPRO 25g
        unid: 250,
        default_amount: 1, default_unit: 'unid',
    },
    "b568f5c7-5efe-4f15-9933-9304eda7b1ed": { // Bebida Láctea Piracanjuba
        unid: 250,
        default_amount: 1, default_unit: 'unid',
    },

    // ─── BEBIDAS ────────────────────────────────────────────────────────────
    "08a0c3cb-6df4-4794-96f1-a6f69e54d73d": { // Café sem Açúcar
        xícara: 200,
        default_amount: 1, default_unit: 'xícara',
    },
    "19aa03fc-dc1e-46e6-bcfc-3900b56cb84d": { // Chá sem Açúcar
        xícara: 200,
        default_amount: 1, default_unit: 'xícara',
    },
    "752dbe21-1f55-4d8d-8599-8f5bc6a29a59": { // Refrigerante Zero
        xícara: 200,
        default_amount: 350, default_unit: 'ml',
    },
};