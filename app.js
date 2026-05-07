import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* ================= DOM ================= */

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
const bonosPublicos = document.getElementById("bonosPublicos");

const PASSWORD = "hortet2026";

/* ================= ESTADO ================= */

let reservas = [];
let bonos = {};

/* ================= HORARIOS ================= */

const slots = [
  { id:"mar-18", dia:"Martes", hora:"18:00 - 19:00" },
  { id:"mar-19", dia:"Martes", hora:"19:00 - 20:00" },
  { id:"mie-19", dia:"Miércoles", hora:"19:30 - 20:30" },
  { id:"jue-19", dia:"Jueves", hora:"19:00 - 20:00" },
  { id:"vie-1830", dia:"Viernes", hora:"18:30 - 19:30" },
  { id:"vie-1930", dia:"Viernes", hora:"19:30 - 20:30" }
];

/* ================= FIREBASE ================= */

onSnapshot(collection(db,"reservas"), snap=>{
  reservas = snap.docs.map(d=>({id:d.id,...d.data()}));
  render();
  renderAdmin();
});

onSnapshot(collection(db,"bonos"), snap=>{
  bonos = {};
  snap.forEach(d=>{
    bonos[d.id] = d.data();
  });

  renderBonos();
  renderBonosPublicos();
});

/* ================= LOGIN ================= */

loginAdminBtn.onclick = ()=>{
  if(adminPass.value === PASSWORD){
    adminContent.classList.remove("hidden");
  } else {
    alert("Contraseña incorrecta");
  }
};

/* ================= CALENDARIO ================= */

function agrupar(){
  const map = {};
  reservas.forEach(r=>{
    if(!map[r.horarioId]) map[r.horarioId]=[];
    map[r.horarioId].push(r);
  });
  return map;
}

function render(){

  loading.style.display="none";
  calendar.innerHTML="";

  const map = agrupar();

  const dias = ["Martes","Miércoles","Jueves","Viernes"];

  dias.forEach(dia=>{
    const col=document.createElement("div");
    col.className="dia";

    col.innerHTML=`<h3>${dia}</h3>`;

    slots.filter(s=>s.dia===dia).forEach(slot=>{

      const list = map[slot.id]||[];

      const div=document.createElement("div");
      div.className="slot";

      div.innerHTML=`
        <strong>${slot.hora}</strong>
        <div>${list.length}/8</div>

        <div class="listado">
          ${list.map(r=>`👤 ${r.nombre}`).join("<br>")}
        </div>

        <button>Reservar</button>
      `;

      div.querySelector("button").onclick=async()=>{

        const nombre = nombreInput.value;
        if(!nombre) return alert("Pon tu nombre");

        const bono = bonos[nombre]?.horas||0;
        if(bono<=0) return alert("Sin bonos");

        await setDoc(doc(db,"bonos",nombre),{
          horas:bono-1,
          publico:bonos[nombre]?.publico??true
        });

        await addDoc(collection(db,"reservas"),{
          nombre,
          horarioId:slot.id,
          hora:slot.hora
        });
      };

      col.appendChild(div);
    });

    calendar.appendChild(col);
  });
}

/* ================= ADMIN RESERVAS ================= */

function renderAdmin(){

  if(adminContent.classList.contains("hidden")) return;

  adminReservas.innerHTML="";

  reservas.forEach(r=>{
    const div=document.createElement("div");

    div.innerHTML=`
      <div>
        <strong>${r.nombre}</strong><br>
        ${r.hora||""}
      </div>
      <button class="borrar">🗑</button>
    `;

    div.querySelector(".borrar").onclick=async()=>{
      await deleteDoc(doc(db,"reservas",r.id));
    };

    adminReservas.appendChild(div);
  });
}

/* ================= BONOS ADMIN ================= */

guardarBono.onclick=async()=>{

  const nombre=adminNombre.value;
  const horas=Number(bonosInput.value);
  const publico=bonoPublico.checked;

  if(!nombre) return alert("Falta nombre");

  const actual=bonos[nombre]?.horas||0;

  await setDoc(doc(db,"bonos",nombre),{
    horas:actual+horas,
    publico
  });
};

/* ================= BONOS ADMIN PANEL ================= */

function renderBonos(){

  bonosLista.innerHTML="";

  Object.entries(bonos).forEach(([nombre,data])=>{

    const div=document.createElement("div");
    div.className="bono";

    div.innerHTML=`
      <div>
        <strong>${nombre}</strong><br>
        ${data.horas}h
      </div>

      <div class="acciones">
        <button class="mas">+</button>
        <button class="menos">-</button>
        <button class="borrar">🗑</button>
      </div>
    `;

    div.querySelector(".mas").onclick=async()=>{
      await setDoc(doc(db,"bonos",nombre),{
        horas:(data.horas||0)+1,
        publico:data.publico??true
      });
    };

    div.querySelector(".menos").onclick=async()=>{
      await setDoc(doc(db,"bonos",nombre),{
        horas:Math.max(0,(data.horas||0)-1),
        publico:data.publico??true
      });
    };

    div.querySelector(".borrar").onclick=async()=>{
      await deleteDoc(doc(db,"bonos",nombre));
    };

    bonosLista.appendChild(div);
  });
}

/* ================= BONOS PUBLICOS ================= */

function renderBonosPublicos(){

  const visibles=Object.entries(bonos)
    .filter(([_,b])=>b.publico!==false);

  bonosPublicos.innerHTML=visibles.length
    ? `<h2>💳 Bonos</h2>` +
      visibles.map(([n,b])=>`
        <div class="bono-item">
          <strong>${n}</strong> → ${b.horas}h
        </div>
      `).join("")
    : "";
}
