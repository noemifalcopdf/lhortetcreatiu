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

const bonosLista = document.getElementById("bonosLista");
const bonosListaPublica = document.getElementById("bonosListaPublica");

const toggleAdmin = document.getElementById("toggleAdmin");

const PASSWORD = "hortet2026";

let reservas = [];
let bonos = {};

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

    Object.entries(map).forEach(([id,list])=>{

      const n = list.length;

      const div = document.createElement("div");
      div.className = "slot";

      div.innerHTML = `
        <strong>${id}</strong>
        <div>${n}/8</div>
        <div class="bar" style="width:${(n/8)*100}%"></div>

        <div>${list.map(r=>`👤 ${r.nombre}`).join("<br>")}</div>

        <button>Reservar</button>
      `;

      div.querySelector("button").onclick = async ()=>{

        const nombre = nombreInput.value;
        if(!nombre) return alert("Pon nombre");

        const bono = bonos[nombre]?.horas || 0;
        if(bono <= 0) return alert("Sin bonos");

        await setDoc(doc(db,"bonos",nombre),{
          horas: bono - 1,
          publico: bonos[nombre]?.publico ?? true
        });

        await addDoc(collection(db,"reservas"),{
          nombre,
          horarioId: id,
          timestamp: Date.now()
        });
      };

      col.appendChild(div);
    });

    calendar.appendChild(col);
  });
}

/* ADMIN */
loginAdminBtn.onclick = ()=>{
  if(adminPass.value === PASSWORD){
    adminContent.classList.remove("hidden");
  }
};

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
      <div class="bono">
        ${n}: ${b.horas}h
      </div>
    `).join("");
}

/* BONOS PUBLICOS (ALUMNAS) */
function renderBonosPublicos(){

  const visibles = Object.entries(bonos)
    .filter(([_,b])=>b.publico !== false);

  if(visibles.length > 0){
    document.getElementById("bonosPublicos").classList.remove("hidden");
  }

  bonosListaPublica.innerHTML = visibles
    .map(([n,b])=>`
      <div class="bono-item">
        <strong>${n}</strong> → ${b.horas}h
      </div>
    `).join("");
}

/* FOOTER TOGGLE */
toggleAdmin.onclick = ()=>{
  adminContent.classList.toggle("hidden");
};
