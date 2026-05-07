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
const bonosLista = document.getElementById("bonosLista");

const adminNombre = document.getElementById("adminNombre");
const bonosInput = document.getElementById("bonos");
const guardarBono = document.getElementById("guardarBono");

const PASSWORD = "hortet2026";

const dias = ["Martes","Miércoles","Jueves","Viernes"];

const slots = [
  { id:"mar-18", dia:"Martes", hora:"18-19" },
  { id:"mar-19", dia:"Martes", hora:"19-20" },
  { id:"mie-1930", dia:"Miércoles", hora:"19:30-20:30" },
  { id:"jue-19", dia:"Jueves", hora:"19-20" },
  { id:"vie-1830", dia:"Viernes", hora:"18:30-19:30" },
  { id:"vie-1930", dia:"Viernes", hora:"19:30-20:30" }
];

let reservas = [];
let bonos = {};

// ================= RESERVAS =================

onSnapshot(collection(db,"reservas"), (snap)=>{
  reservas = snap.docs.map(d=>({id:d.id,...d.data()}));
  render();
  renderAdmin();
});

// ================= BONOS =================

onSnapshot(collection(db,"bonos"), (snap)=>{
  bonos = {};
  snap.forEach(d=>{
    bonos[d.id] = d.data().horas;
  });
  renderBonos();
});

// ================= CALENDARIO =================

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

        <div>
          ${list.map(r=>`👤 ${r.nombre}`).join("<br>")}
        </div>

        <button>Reservar</button>
      `;

      div.querySelector("button").onclick = async ()=>{

        const nombre = nombreInput.value;
        if(!nombre) return alert("Pon tu nombre");
        if(n >= 8) return alert("Completo");

        const horas = bonos[nombre] || 0;

        if(horas <= 0){
          return alert("No tienes bonos disponibles");
        }

        // 🔥 AUTODESCUENTO
        await setDoc(doc(db,"bonos",nombre),{
          horas: horas - 1
        });

        await addDoc(collection(db,"reservas"),{
          nombre,
          horarioId: slot.id,
          dia: slot.dia,
          hora: slot.hora,
          timestamp: Date.now()
        });
      };

      col.appendChild(div);
    });

    calendar.appendChild(col);
  });
}

// ================= ADMIN LOGIN =================

loginAdminBtn.onclick = ()=>{
  if(adminPass.value === PASSWORD){
    adminContent.classList.remove("hidden");
  } else {
    alert("Incorrecto");
  }
};

// ================= ADMIN RESERVAS =================

function renderAdmin(){
  if(adminContent.classList.contains("hidden")) return;

  adminReservas.innerHTML = "";

  reservas.forEach(r=>{
    const d = document.createElement("div");

    d.innerHTML = `
      <div>
        <strong>${r.nombre}</strong><br>
        <small>${r.dia} ${r.hora}</small>
      </div>
      <button>🗑</button>
    `;

    d.querySelector("button").onclick = async ()=>{
      await deleteDoc(doc(db,"reservas",r.id));
    };

    adminReservas.appendChild(d);
  });
}

// ================= BONOS ADMIN =================

guardarBono.onclick = async ()=>{
  const nombre = adminNombre.value;
  const horas = Number(bonosInput.value);

  if(!nombre) return alert("Nombre");
  if(isNaN(horas)) return alert("Horas inválidas");

  const actual = bonos[nombre] || 0;

  await setDoc(doc(db,"bonos",nombre),{
    horas: actual + horas
  });
};

// ================= BONOS UI =================

function renderBonos(){
  bonosLista.innerHTML = Object.entries(bonos)
    .map(([n,h])=>`
      <div class="bono">
        <div>
          <strong>${n}</strong><br>
          ${h} horas
        </div>

        <div>
          <button onclick="sumar('${n}',1)">+</button>
          <button onclick="restar('${n}',1)">-</button>
        </div>
      </div>
    `).join("");

  window.sumar = async (n,h)=>{
    await setDoc(doc(db,"bonos",n),{
      horas: (bonos[n] || 0) + h
    });
  };

  window.restar = async (n,h)=>{
    await setDoc(doc(db,"bonos",n),{
      horas: Math.max(0,(bonos[n] || 0) - h)
    });
  };
}
