import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const nombreInput = document.getElementById("nombre");
const calendar = document.getElementById("calendar");
const loading = document.getElementById("loading");

const adminPass = document.getElementById("adminPass");
const loginAdminBtn = document.getElementById("loginAdmin");

const adminContent = document.getElementById("adminContent");
const adminReservas = document.getElementById("adminReservas");

const adminNombre = document.getElementById("adminNombre");
const bonosInput = document.getElementById("bonos");
const bonoPublico = document.getElementById("bonoPublico");
const guardarBono = document.getElementById("guardarBono");

const bonosListaPublica = document.getElementById("bonosListaPublica");
const bonosLista = document.getElementById("bonosLista");
const bonosPublicos = document.getElementById("bonosPublicos");

const PASSWORD = "hortet2026";

let reservas = [];
let bonos = {};

/* HORARIOS FIJOS */
const slots = [
  { id:"mar-18", dia:"Martes", hora:"18:00 - 19:00" },
  { id:"mar-19", dia:"Martes", hora:"19:00 - 20:00" },
  { id:"mie-19", dia:"Miércoles", hora:"19:30 - 20:30" },
  { id:"jue-19", dia:"Jueves", hora:"19:00 - 20:00" },
  { id:"vie-1830", dia:"Viernes", hora:"18:30 - 19:30" },
  { id:"vie-1930", dia:"Viernes", hora:"19:30 - 20:30" }
];

/* RESERVAS */
onSnapshot(collection(db,"reservas"), (snap)=>{
  reservas = snap.docs.map(d=>({id:d.id,...d.data()}));
  render();
  renderAdmin();
});

/* BONOS */
onSnapshot(collection(db,"bonos"), (snap)=>{
  bonos = {};
  snap.forEach(d=>{
    bonos[d.id] = d.data();
  });
  renderBonos();
  renderBonosPublicos();
});

/* LOGIN ADMIN */
loginAdminBtn.onclick = ()=>{
  if(adminPass.value === PASSWORD){
    adminContent.classList.remove("hidden");
    document.getElementById("loginBox").classList.add("hidden");
  } else {
    alert("Contraseña incorrecta");
  }
};

/* CALENDARIO */
function agrupar(){
  const m = {};
  for(const r of reservas){
    if(!m[r.horarioId]) m[r.horarioId] = [];
    m[r.horarioId].push(r);
  }
  return m;
}

function render(){

  loading.style.display = "none";
  calendar.innerHTML = "";

  const map = agrupar();

  const dias = ["Martes","Miércoles","Jueves","Viernes"];

  dias.forEach(dia=>{

    const col = document.createElement("div");
    col.className = "dia";

    col.innerHTML = `<h3>${dia}</h3>`;

    slots.filter(s=>s.dia===dia).forEach(slot=>{

      const list = map[slot.id] || [];
      const n = list.length;

      const div = document.createElement("div");
      div.className = "slot";

      if(n >= 8) div.classList.add("full");

      div.innerHTML = `
        <strong>${slot.hora}</strong>
        <div>${n}/8</div>
        <div class="bar" style="width:${(n/8)*100}%"></div>

        <div>${list.map(r=>`👤 ${r.nombre}`).join("<br>")}</div>

        <button>Reservar</button>
      `;

      div.querySelector("button").onclick = async ()=>{

        const nombre = nombreInput.value;
        if(!nombre) return alert("Pon tu nombre");

        const bono = bonos[nombre]?.horas || 0;
        if(bono <= 0) return alert("No tienes bonos");

        await setDoc(doc(db,"bonos",nombre),{
          horas: bono - 1,
          publico: bonos[nombre]?.publico ?? true
        });

        await addDoc(collection(db,"reservas"),{
          nombre,
          horarioId: slot.id,
          timestamp: Date.now()
        });
      };

      col.appendChild(div);
    });

    calendar.appendChild(col);
  });
}

/* ADMIN RESERVAS */
function renderAdmin(){

  if(adminContent.classList.contains("hidden")) return;

  adminReservas.innerHTML = "";

  reservas.forEach(r=>{
    const d = document.createElement("div");

    d.innerHTML = `
      <div>${r.nombre} - ${r.hora || ""}</div>
      <button>🗑</button>
    `;

    d.querySelector("button").onclick = async ()=>{
      await deleteDoc(doc(db,"reservas",r.id));
    };

    adminReservas.appendChild(d);
  });
}

/* BONOS ADMIN */
guardarBono.onclick = async ()=>{

  const nombre = adminNombre.value;
  const horas = Number(bonosInput.value);
  const publico = bonoPublico.checked;

  if(!nombre) return;

  const actual = bonos[nombre]?.horas || 0;

  await setDoc(doc(db,"bonos",nombre),{
    horas: actual + horas,
    publico
  });
};

/* BONOS ADMIN LISTA */
function renderBonos(){
  bonosLista.innerHTML = Object.entries(bonos)
    .map(([n,b])=>`
      <div class="bono">${n}: ${b.horas}h</div>
    `).join("");
}

/* BONOS PUBLICOS */
function renderBonosPublicos(){

  const visibles = Object.entries(bonos)
    .filter(([_,b])=>b.publico !== false);

  if(visibles.length > 0){
    bonosPublicos.classList.remove("hidden");
  }

  bonosListaPublica.innerHTML = visibles
    .map(([n,b])=>`
      <div class="bono-item">${n} → ${b.horas}h</div>
    `).join("");
}
