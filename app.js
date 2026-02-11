// =====================
// 1) Series
// =====================

const series = [
  "Stranger Things",
  "La Casa de Papel",
  "The Crown",
  "Bridgerton",
  "Wednesday",
  "Dark",
  "Narcos",
  "Black Mirror",
  "Élite",
  "Ozark",
  "The Witcher",
  "Sex Education"
];

const segmentos = {
  "J": "Jóvenes (15–22)",
  "A": "Adultos (23–40)",
  "T": "Público general / Familiar",
  "C": "Amantes del crimen y suspenso",
  "R": "Amantes del romance / drama"
};

const contextos = {
  "E": "¿Cuál serie recomiendas para entretenimiento ligero?",
  "S": "¿Cuál serie recomiendas para suspenso o adrenalina?",
  "P": "¿Cuál serie recomiendas para profundidad y reflexión?",
  "M": "¿Cuál serie recomiendas para maratón intensa?"
};

// Elo
const RATING_INICIAL = 1000;
const K = 32;

const STORAGE_KEY = "netflixmash_state_v1";

function defaultState(){
  const buckets = {};
  for (const seg of Object.keys(segmentos)){
    for (const ctx of Object.keys(contextos)){
      const key = `${seg}__${ctx}`;
      buckets[key] = {};
      series.forEach(s => buckets[key][s] = RATING_INICIAL);
    }
  }
  return { buckets, votes: [] };
}

function loadState(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultState();
  return JSON.parse(raw);
}

function saveState(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let state = loadState();

function expectedScore(ra, rb){
  return 1 / (1 + Math.pow(10, (rb - ra) / 400));
}

function updateElo(bucket, A, B, winner){
  const ra = bucket[A];
  const rb = bucket[B];

  const ea = expectedScore(ra, rb);
  const eb = expectedScore(rb, ra);

  const sa = winner === "A" ? 1 : 0;
  const sb = winner === "B" ? 1 : 0;

  bucket[A] = ra + K * (sa - ea);
  bucket[B] = rb + K * (sb - eb);
}

function randomPair(){
  const a = series[Math.floor(Math.random() * series.length)];
  let b = a;
  while (b === a){
    b = series[Math.floor(Math.random() * series.length)];
  }
  return [a, b];
}

function bucketKey(seg, ctx){
  return `${seg}__${ctx}`;
}

function topN(bucket, n=10){
  const arr = Object.entries(bucket).map(([serie, rating]) => ({serie, rating}));
  arr.sort((a,b) => b.rating - a.rating);
  return arr.slice(0,n);
}

// UI

const segmentSelect = document.getElementById("segmentSelect");
const contextSelect = document.getElementById("contextSelect");
const labelA = document.getElementById("labelA");
const labelB = document.getElementById("labelB");
const questionEl = document.getElementById("question");
const topBox = document.getElementById("topBox");

function fillSelect(selectEl, obj){
  selectEl.innerHTML = "";
  for (const [k,v] of Object.entries(obj)){
    const opt = document.createElement("option");
    opt.value = k;
    opt.textContent = v;
    selectEl.appendChild(opt);
  }
}

fillSelect(segmentSelect, segmentos);
fillSelect(contextSelect, contextos);

let currentA, currentB;

function newDuel(){
  [currentA, currentB] = randomPair();
  labelA.textContent = currentA;
  labelB.textContent = currentB;
  questionEl.textContent = contextos[contextSelect.value];
}

function renderTop(){
  const key = bucketKey(segmentSelect.value, contextSelect.value);
  const bucket = state.buckets[key];
  const rows = topN(bucket);

  topBox.innerHTML = rows.map((r,i)=>`
    <div class="toprow">
      <div><b>${i+1}.</b> ${r.serie}</div>
      <div>${r.rating.toFixed(1)}</div>
    </div>
  `).join("");
}

function vote(winner){
  const key = bucketKey(segmentSelect.value, contextSelect.value);
  const bucket = state.buckets[key];

  updateElo(bucket, currentA, currentB, winner);

  state.votes.push({
    serieA: currentA,
    serieB: currentB,
    ganador: winner === "A" ? currentA : currentB
  });

  saveState();
  renderTop();
  newDuel();
}

document.getElementById("btnA").onclick = () => vote("A");
document.getElementById("btnB").onclick = () => vote("B");
document.getElementById("btnNewPair").onclick = newDuel;
document.getElementById("btnShowTop").onclick = renderTop;

document.getElementById("btnReset").onclick = () => {
  if(confirm("¿Reiniciar ranking?")){
    state = defaultState();
    saveState();
    renderTop();
    newDuel();
  }
};

newDuel();
renderTop();
