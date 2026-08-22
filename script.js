// Substitua pelas URLs de Webhook Production do seu n8n
const N8N_URL_SLOTS = CONFIG.N8N_URL_SLOTS;
const N8N_URL_AGENDAR = CONFIG.N8N_URL_AGENDAR;
const N8N_URL_CONSULTAR = CONFIG.N8N_URL_CONSULTAR;
const N8N_URL_REAGENDAR = CONFIG.N8N_URL_REAGENDAR;

let agendaDisponivel = {};
let dataSelecionada = null;
let horarioSelecionado = null;

const loading = document.getElementById("loading");
const bookingContent = document.getElementById("bookingContent");
const diasContainer = document.getElementById("diasContainer");
const horariosWrapper = document.getElementById("horariosWrapper");
const slotsContainer = document.getElementById("slotsContainer");
const bookingForm = document.getElementById("bookingForm");
const statusMessage = document.getElementById("statusMessage");
const btnSubmit = document.getElementById("btnSubmit");

// 1. Inicializa buscando os dias e horários livres
window.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch(N8N_URL_SLOTS);
    const data = await res.json();

    // Normaliza caso o n8n envie envelopado
    if (Array.isArray(data) && data[0]?.agenda) {
      agendaDisponivel = data[0].agenda;
    } else if (data.agenda) {
      agendaDisponivel = data.agenda;
    } else {
      agendaDisponivel = data;
    }

    // Filtra apenas chaves com formato YYYY-MM-DD
    const dias = Object.keys(agendaDisponivel).filter((d) =>
      /^\d{4}-\d{2}-\d{2}$/.test(d),
    );

    loading.classList.add("hidden");

    if (dias.length === 0) {
      statusMessage.className = "status-box error";
      statusMessage.innerText =
        "Não encontramos horários disponíveis nos próximos dias.";
      return;
    }

    bookingContent.classList.remove("hidden");
    diasContainer.innerHTML = "";

    // Renderiza cada dia livre
    dias.forEach((diaISO) => {
      const [ano, mes, dia] = diaISO.split("-");
      const dataObj = new Date(Number(ano), Number(mes) - 1, Number(dia));
      const diaSemana = dataObj
        .toLocaleDateString("pt-BR", { weekday: "short" })
        .replace(".", "");

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "dia-btn";
      btn.innerHTML = `<div class="dia-nome">${diaSemana}</div><div class="dia-num">${dia}/${mes}</div>`;

      btn.addEventListener("click", () => {
        document
          .querySelectorAll(".dia-btn")
          .forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
        dataSelecionada = diaISO;
        renderHorarios(diaISO);
      });

      diasContainer.appendChild(btn);
    });
  } catch (err) {
    loading.innerHTML =
      '<p style="color:#ef4444;">Erro ao carregar a agenda da VET.FACE. Recarregue a página.</p>';
    console.error(err);
  }
});

// 2. Renderiza os horários livres ao clicar em um dia
function renderHorarios(diaISO) {
  horarioSelecionado = null;
  bookingForm.classList.add("hidden");
  horariosWrapper.classList.remove("hidden");
  slotsContainer.innerHTML = "";

  const horarios = agendaDisponivel[diaISO] || [];

  horarios.forEach((hora) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "slot-btn";
    btn.innerText = hora;

    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".slot-btn")
        .forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      horarioSelecionado = hora;
      bookingForm.classList.remove("hidden");
    });

    slotsContainer.appendChild(btn);
  });
}

// 3. Envio do formulário para gravar no Google Calendar
bookingForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  btnSubmit.disabled = true;
  btnSubmit.innerHTML = "<span>Confirmando Consulta...</span>";
  statusMessage.className = "status-box";
  statusMessage.innerText = "";

  const payload = {
    nome: document.getElementById("nome").value.trim(),
    telefone: document.getElementById("telefone").value.trim(),
    email: document.getElementById("email").value.trim(),
    nomePet: document.getElementById("nomePet").value.trim(),
    tipoPet: document.getElementById("tipoPet").value,
    start_time: new Date(
      `${dataSelecionada}T${horarioSelecionado}:00-03:00`,
    ).toISOString(),
  };

  try {
    const res = await fetch(N8N_URL_AGENDAR, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error();

    statusMessage.className = "status-box success";
    statusMessage.innerText =
      "✅ Consulta agendada com sucesso! Em breve entraremos em contato para confirmar.";
    bookingForm.reset();
    horariosWrapper.classList.add("hidden");
    bookingForm.classList.add("hidden");
  } catch (err) {
    statusMessage.className = "status-box error";
    statusMessage.innerText =
      "❌ Erro ao confirmar o agendamento. Tente novamente.";
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.innerHTML = "<span>Confirmar Agendamento</span>";
  }
});
