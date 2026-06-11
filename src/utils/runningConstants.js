// src/utils/runningConstants.js

export const PROTOCOL_DATA = {
  1: {
    label: 'Bloco 1 — Adaptação', weeks: '1 e 2',
    objective: 'Adaptação, pulmão, articulações e coordenação da corrida.',
    sessions: {
      QUARTA: { title: 'Caminhada + Corrida Leve', phases: [
        { fase: 'Caminhada', tempo: '5 min', esteira: '5.5–6.0 km/h', rua: '10:00 /km' },
        { fase: 'Corrida leve', tempo: '2 min', esteira: '7.5 km/h', rua: '7:45–8:00 /km' },
        { fase: 'Caminhada', tempo: '2 min', esteira: '5.5 km/h', rua: '10:00 /km' },
        { fase: 'Repetir', tempo: '× 6', esteira: '—', rua: '—' },
        { fase: 'Total', tempo: '30 min', esteira: '—', rua: '—' },
      ]},
      SEXTA: { title: 'Intervalado Leve', phases: [
        { fase: 'Aquecimento', tempo: '5 min', esteira: '6.0–7.0 km/h', rua: '9:30 /km' },
        { fase: 'Corrida moderada', tempo: '1 min', esteira: '8.0–8.5 km/h', rua: '6:50–7:10 /km' },
        { fase: 'Caminhada', tempo: '1 min', esteira: '5.5–6.0 km/h', rua: '10:00 /km' },
        { fase: 'Repetir', tempo: '× 10', esteira: '—', rua: '—' },
        { fase: 'Total', tempo: '25 min', esteira: '—', rua: '—' },
      ]},
      DOMINGO: { title: 'Longão Leve', phases: [
        { fase: 'Corrida leve', tempo: '30 min', esteira: '7.5–7.8 km/h', rua: '7:45–8:15 /km' },
      ]},
    },
  },
  2: {
    label: 'Bloco 2 — Resistência Base', weeks: '3 e 4',
    objective: 'Correr mais tempo sem parar (base sólida de resistência).',
    sessions: {
      QUARTA: { title: 'Corrida Cont Continuous', phases: [
        { fase: 'Leve', tempo: '5 min', esteira: '7.5 km/h', rua: '8:20 /km' },
        { fase: 'Corrida contínua', tempo: '15–20 min', esteira: '7.8–8.0 km/h', rua: '7:30–8:00 /km' },
        { fase: 'Leve', tempo: '5 min', esteira: '7.0 km/h', rua: '8:40 /km' },
      ]},
      SEXTA: { title: 'Intervalado Moderado', phases: [
        { fase: 'Aquecimento', tempo: '5 min', esteira: '7.0 km/h', rua: '9:00 /km' },
        { fase: 'Forte', tempo: '2 min', esteira: '9.0 km/h', rua: '6:20–6:50 /km' },
        { fase: 'Caminhada', tempo: '1 min', esteira: '5.5 km/h', rua: '10:00 /km' },
        { fase: 'Repetir', tempo: '× 8', esteira: '—', rua: '—' },
        { fase: 'Leve', tempo: '3–4 min', esteira: '7.0 km/h', rua: '9:00 /km' },
      ]},
      DOMINGO: { title: 'Longão Aumentado', phases: [
        { fase: 'Corrida leve', tempo: '35–40 min', esteira: '7.5–7.8 km/h', rua: '7:50–8:20 /km' },
      ]},
    },
  },
  3: {
    label: 'Bloco 3 — Sustentar Ritmo', weeks: '5 e 6',
    objective: 'Aprender a sustentar ritmo e correr 25+ min direto.',
    sessions: {
      QUARTA: { title: 'Ritmo Leve', phases: [
        { fase: 'Leve', tempo: '5 min', esteira: '7.5 km/h', rua: '8:30 /km' },
        { fase: 'Corrida contínua', tempo: '25 min', esteira: '8.0–8.2 km/h', rua: '7:20–7:45 /km' },
        { fase: 'Leve', tempo: '3 min', esteira: '7.0 km/h', rua: '9:00 /km' },
      ]},
      SEXTA: { title: 'Intervalado Forte', phases: [
        { fase: 'Aquecimento', tempo: '5 min', esteira: '7.0 km/h', rua: '9:00 /km' },
        { fase: 'Forte', tempo: '2 min', esteira: '9.5–10.0 km/h', rua: '6:00–6:30 /km' },
        { fase: 'Leve', tempo: '1 min', esteira: '6.0 km/h', rua: '9:20 /km' },
        { fase: 'Repetir', tempo: '× 10', esteira: '—', rua: '—' },
      ]},
      DOMINGO: { title: 'Treino Mental + Ritmo', phases: [
        { fase: 'Leve', tempo: '10 min', esteira: '7.5 km/h', rua: '8:40 /km' },
        { fase: 'Ritmo moderado', tempo: '15 min', esteira: '8.3–8.6 km/h', rua: '7:00–7:20 /km' },
        { fase: 'Leve', tempo: '10 min', esteira: '7.0 km/h', rua: '9:10 /km' },
      ]},
    },
  },
  4: {
    label: 'Bloco 4 — Pré-Performance', weeks: '7',
    objective: 'Ficar muito perto dos 5 km (entre 3,5 e 4,5 km).',
    sessions: {
      QUARTA: { title: 'Ritmo Contínuo', phases: [
        { fase: 'Corrida contínua', tempo: '30 min', esteira: '8.0–8.4 km/h', rua: '7:00–7:30 /km' },
      ]},
      SEXTA: { title: 'Intervalado Limiar', phases: [
        { fase: 'Aquecimento', tempo: '5 min', esteira: '7.0 km/h', rua: '9:00 /km' },
        { fase: 'Forte', tempo: '3 min', esteira: '9.5–10.0 km/h', rua: '6:00–6:40 /km' },
        { fase: 'Leve', tempo: '1 min', esteira: '6.0 km/h', rua: '9:20 /km' },
        { fase: 'Repetir', tempo: '× 6', esteira: '—', rua: '—' },
      ]},
      DOMINGO: { title: 'Treino Mental + Ritmo', phases: [
        { fase: 'Corrida contínua', tempo: '4 km', esteira: '7.8–8.4 km/h', rua: '7:10–7:40 /km' },
      ]},
    },
  },
  5: {
    label: 'Bloco 5 — O 5KM', weeks: '8',
    objective: 'Alcançar a distância completa.',
    sessions: {
      QUARTA: { title: 'Corrida Leve', phases: [
        { fase: 'Corrida leve', tempo: '20 min', esteira: '7.5–7.8 km/h', rua: '8:00–8:30 /km' },
      ]},
      SEXTA: { title: 'Ativação', phases: [
        { fase: 'Forte', tempo: '1 min', esteira: '10.0–11.0 km/h', rua: '5:20–6:00 /km' },
        { fase: 'Leve', tempo: '1 min', esteira: '6.0 km/h', rua: '9:30 /km' },
        { fase: 'Repetir', tempo: '× 6', esteira: '—', rua: '—' },
      ]},
      DOMINGO: { title: '🏁 O 5KM', phases: [
        { fase: 'Corrida contínua', tempo: '5 KM', esteira: '8.0–8.3 km/h', rua: '7:10–7:45 /km' },
      ]},
    },
  },
};

export const SESSION_ICONS = { 
  QUARTA: 'run', 
  SEXTA: 'lightning-bolt', 
  DOMINGO: 'flag-checkered' 
};

export const SESSION_COLORS = { 
  QUARTA: '#22c55e', 
  SEXTA: '#f59e0b', 
  DOMINGO: '#3b82f6' 
};