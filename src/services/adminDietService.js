// src/services/adminDietService.js
const BASE_URL = 'https://fitos-final.onrender.com/api/admin';

export const fetchUserData = async (userId) => {
    const res = await fetch(`${BASE_URL}/user/${userId}?t=${Date.now()}`);
    if (!res.ok) throw new Error("Erro ao buscar usuário");
    return res.json();
};

export const fetchDietData = async (userId) => {
    const res = await fetch(`https://fitos-final.onrender.com/api/diet/${userId}?t=${Date.now()}`);

    // Se for 404 (não tem dieta), retorna nulo pacificamente sem dar erro no console
    if (res.status === 404) {
        return null; 
    }

    if (!res.ok) throw new Error("Erro ao buscar dieta");
    return res.json();
};

export const fetchStudentsList = async () => {
    const res = await fetch(`${BASE_URL}/user`);
    if (!res.ok) throw new Error("Erro ao buscar alunos");
    return res.json();
};

export const fetchDietTemplates = async () => {
    const res = await fetch(`${BASE_URL}/diet-templates`);
    if (!res.ok) throw new Error("Erro ao buscar templates de dieta");
    return res.json();
};

export const fetchMealTemplates = async () => {
    const res = await fetch(`${BASE_URL}/meal-templates`);
    if (!res.ok) throw new Error("Erro ao buscar templates de refeição");
    return res.json();
};

export const cloneDietFromStudent = async (sourceStudentId) => {
    const res = await fetch(`${BASE_URL}/diet/${sourceStudentId}?t=${Date.now()}`);
    if (!res.ok) throw new Error("Dieta não encontrada");
    return res.json();
};

export const saveDietTemplate = async (payload) => {
    const res = await fetch(`${BASE_URL}/diet-templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error("Falha ao guardar modelo");
    return res.json();
};

export const saveMealTemplate = async (payload) => {
    const res = await fetch(`${BASE_URL}/meal-templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error("Falha ao guardar modelo de refeição");
    return res.json();
};

export const generateAIDiet = async (anamnese) => {
    const res = await fetch(`${BASE_URL}/generate-diet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ anamnese })
    });
    if (!res.ok) throw new Error("Falha ao comunicar com a IA.");
    return res.json();
};

export const saveDiet = async (payload) => {
    const res = await fetch(`${BASE_URL}/diet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error("Erro no servidor ao salvar.");
    return res.json();
};