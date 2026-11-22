// Camadas, da mais superficial para a mais profunda.
export const LAYERS = [
  { id: 'skin', name: 'Pele', color: '#d9a58a', order: 10, hint: 'Pele e unhas; calosidade póstero-lateral no calcanhar.' },
  { id: 'fat', name: 'Tecido subcutâneo', color: '#e9c25c', order: 9, hint: 'Camada de gordura logo abaixo da pele.' },
  { id: 'fascia', name: 'Fáscias e retináculos', color: '#cfc8b4', order: 8, hint: 'Fáscia plantar e faixas que contêm os tendões no tornozelo.' },
  { id: 'vessels', name: 'Artérias e veias', color: '#c0392b', order: 7, hint: 'Artérias em vermelho, veias em azul.' },
  { id: 'nerves', name: 'Nervos', color: '#e8b923', order: 7, hint: 'Nervos tibial, plantares, sural, fibulares e safeno.' },
  { id: 'muscles', name: 'Músculos', color: '#a8322d', order: 6, hint: 'Porção distal dos músculos da perna e músculos intrínsecos do pé.' },
  { id: 'tendons', name: 'Tendões', color: '#e8e1d0', order: 5, hint: 'Inclui o tendão do calcâneo (Aquiles).' },
  { id: 'bursae', name: 'Bursas e coxins', color: '#a8548a', order: 4, hint: 'Bursas do calcanhar, gordura de Kager e coxim do calcanhar.' },
  { id: 'ligaments', name: 'Ligamentos', color: '#bdb39a', order: 3, hint: 'Ligamentos do tornozelo, do arco e do mediopé.' },
  { id: 'cartilage', name: 'Cartilagem articular', color: '#9fcbd8', order: 2, hint: 'Superfícies articulares (visíveis no modo explodido).' },
  { id: 'bones', name: 'Ossos', color: '#e4d8bc', order: 1, hint: '26 ossos do pé + 2 sesamoides, tíbia e fíbula distais.' },
];

// Cores por tipo de estrutura (sRGB)
export const KIND_COLORS = {
  skin: '#d9a58a',
  callus: '#e9dcbc',
  nail: '#e9bfb2',
  fat: '#e9c25c',
  bone: '#e6dabd',
  cartilage: '#a9d2de',
  tendon: '#ece6d6',
  ligament: '#c9bf9f',
  fascia: '#ddd6c2',
  retinaculum: '#d6cfb9',
  muscle: '#a63a33',
  artery: '#c42a2a',
  vein: '#2f57b0',
  nerve: '#eec12b',
  bursa: '#b45a9a',
  kager: '#efcb62',
  heelpad: '#f0d27a',
  haglund: '#e0532f',
};
