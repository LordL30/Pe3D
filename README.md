# Pé 3D · Haglund

Modelo anatômico 3D interativo do **pé direito**, da pele aos ossos, construído a partir de fotos do pé (vistas medial, lateral e posterior) e de proporções anatômicas de referência. O modelo reproduz a **deformidade de Haglund**: proeminência póstero-súpero-lateral do calcâneo, com bursite retrocalcânea, bursite subcutânea (retroaquileana) e calosidade na face póstero-lateral do calcanhar, como aparece nas fotos.

> Modelo ilustrativo e educativo. Não é um exame de imagem e não substitui avaliação médica.

## O que dá para fazer

- **Girar, aproximar e mover**: arraste para girar, role (ou pinça) para zoom, botão direito (ou dois dedos) para mover; duplo clique centraliza numa estrutura.
- **Tirar e colocar camadas**: 11 camadas (pele, tecido subcutâneo, fáscias e retináculos, artérias e veias, nervos, músculos, tendões, bursas e coxins, ligamentos, cartilagem, ossos), cada uma com liga/desliga e opacidade. Cada camada abre a lista das suas estruturas, que podem ser ligadas e desligadas uma a uma. Há busca por nome.
- **Clicar numa estrutura** para ver nome e descrição, centralizar, isolar ou ocultar.
- **Vistas prontas**: lateral, medial, posterior, anterior, dorsal, plantar e calcanhar (teclas 1–6).
- **Explodir** os ossos para ver as superfícies articulares.
- **Cortes** sagital, frontal e transversal, com a face de corte colorida por tecido.
- **Haglund**: destaque da proeminência em laranja, comparação com o contorno de um calcâneo normal e **tour guiado** em 7 passos (da pele ao osso, com corte sagital pela proeminência).

## Como rodar

É um site estático (HTML + módulos JavaScript). Os módulos precisam ser servidos por HTTP:

```bash
python3 -m http.server 8000
# abra http://localhost:8000
```

Também funciona no GitHub Pages sem etapa de build. O Three.js (r160) é carregado do jsDelivr.

## Como o modelo é construído

Nada é baixado como malha pronta: toda a anatomia é descrita em código e gerada no navegador.

- **Ossos, pele, coxins e bursas** são funções de distância com sinal (SDF): uniões suaves de elipsoides, cones arredondados e caixas. As articulações são "conformadas" subtraindo o osso vizinho com uma folga de 1,6 mm. As malhas saem de um *surface nets* com refinamento em dois níveis, gerado em Web Workers em paralelo.
- **Tendões, músculos, ligamentos, fáscias, vasos e nervos** são tubos de seção elíptica ao longo de curvas Catmull-Rom.
- A **pele** é feita de *lofts* (seções que variam ao longo da perna e do pé, ajustadas às fotos), unidos aos ossos subcutâneos (maléolos, face medial da tíbia, proeminência de Haglund, navicular, 1º e 5º metatarsos), a dedos com polpa, articulações e unhas. A cor varia por região (perna mais morena, planta mais pálida, dedos e calcanhar mais avermelhados), as dobras recebem oclusão ambiente calculada do próprio campo de distância e um shader adiciona poros, vincos, translucidez avermelhada e a textura descamativa da calosidade. Há pelos na perna e no dorso, como nas fotos. O **tecido subcutâneo** é a pele recuada 1,9 mm.
- Um teste verifica cada estrutura interna contra o campo de distância da pele, para que nada a atravesse.
- A **deformidade de Haglund** é uma primitiva separada unida ao calcâneo; o destaque em laranja é proporcional ao excesso ósseo em relação ao contorno normal.

Coordenadas em milímetros: `x` anterior (do calcanhar para os dedos), `y` superior, `z` lateral. Solo em `y = 0`; a perna é cortada a 20 cm do solo.

```
index.html              interface (painel, ficha, tour) e estilos
src/main.js             cena Three.js, camadas, seleção, cortes, explodir, tour
src/sdf.js              primitivas SDF e gerador de malha (surface nets)
src/tube.js             gerador de tubos de seção elíptica
src/meshWorker.js       worker que gera as malhas SDF
src/buildMesh.js        malha SDF + pesos de cor (destaque/calosidade)
src/tour.js             passos do tour guiado
src/anatomy/bones.js    ossos e cartilagens (inclui a proeminência de Haglund)
src/anatomy/soft.js     pele, unhas, gordura de Kager, coxim do calcanhar, bursas
src/anatomy/tubes.js    tendões, músculos, ligamentos, fáscias, vasos e nervos
src/anatomy/info.js     textos das estruturas
src/anatomy/layers.js   camadas e cores
```

Para ajustar a anatomia (por exemplo, o tamanho da proeminência), edite `haglundBump` em `src/anatomy/bones.js`.
