// URLs consumidas a partir do config.js
const N8N_URL_SLOTS = CONFIG.N8N_URL_SLOTS;
const N8N_URL_AGENDAR = CONFIG.N8N_URL_AGENDAR;
const N8N_URL_CONSULTAR = CONFIG.N8N_URL_CONSULTAR;
const N8N_URL_REAGENDAR = CONFIG.N8N_URL_REAGENDAR;

// Estados Globais
let modoOperacao = "novo"; // 'novo' | 'consultar' | 'reagendar'
let eventoParaReagendar = null;
let agendaDisponivel = {};
let dataSelecionada = null;
let horarioSelecionado = null;

// Elementos da Interface
const screenInitial = document.getElementById("screenInitial");
const screenBuscar = document.getElementById("screenBuscar");
const screenDetalhesConsulta = document.getElementById(
  "screenDetalhesConsulta",
);
const screenAgendamento = document.getElementById("screenAgendamento");
const consultaEncontradaCard = document.getElementById(
  "consultaEncontradaCard",
);
const loadingSlots = document.getElementById("loadingSlots");
const slotsWrapper = document.getElementById("slotsWrapper");
const diasContainer = document.getElementById("diasContainer");
const horariosWrapper = document.getElementById("horariosWrapper");
const slotsContainer = document.getElementById("slotsContainer");
const bookingForm = document.getElementById("bookingForm");
const reagendarActionBox = document.getElementById("reagendarActionBox");
const statusMessage = document.getElementById("statusMessage");

// Eventos de Navegação
document
  .getElementById("btnGoNovo")
  .addEventListener("click", iniciarNovoAgendamento);
document
  .getElementById("btnGoConsultar")
  .addEventListener("click", iniciarModoConsultar);
document
  .getElementById("btnGoReagendar")
  .addEventListener("click", iniciarModoReagendar);
document
  .getElementById("btnVoltarBusca")
  .addEventListener("click", resetarParaInicio);
document
  .getElementById("btnVoltarDetalhes")
  .addEventListener("click", resetarParaInicio);
document
  .getElementById("btnVoltarAgendamento")
  .addEventListener("click", resetarParaInicio);
document
  .getElementById("btnBuscarConsulta")
  .addEventListener("click", buscarConsultaPorTelefone);
document
  .getElementById("btnQueroReagendar")
  .addEventListener("click", transicionarParaReagendamento);
document
  .getElementById("btnConfirmarReagendamento")
  .addEventListener("click", executarReagendamento);

// Formatação automática do telefone
document.querySelectorAll('input[type="tel"]').forEach((input) => {
  input.addEventListener("input", (e) => {
    let v = e.target.value.replace(/\D/g, "");
    if (v.length > 11) v = v.slice(0, 11);
    if (v.length > 10) {
      e.target.value = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
    } else if (v.length > 5) {
      e.target.value = `(${v.slice(0, 2)}) ${v.slice(2, 6)}-${v.slice(6)}`;
    } else if (v.length > 2) {
      e.target.value = `(${v.slice(0, 2)}) ${v.slice(2)}`;
    } else {
      e.target.value = v;
    }
  });
});

function resetarParaInicio() {
  screenInitial.classList.remove("hidden");
  screenBuscar.classList.add("hidden");
  screenDetalhesConsulta.classList.add("hidden");
  screenAgendamento.classList.add("hidden");
  consultaEncontradaCard.classList.add("hidden");
  statusMessage.className = "status-box hidden";
  statusMessage.innerText = "";
  document.getElementById("headerTitle").innerText = "Agendamento de Consultas";
  document.getElementById("headerSubtitle").innerText =
    "Cuide do sorriso e da saúde do seu pet com a Dra. Mariana Ramos";
}

// 1. INICIAR NOVO AGENDAMENTO
function iniciarNovoAgendamento() {
  modoOperacao = "novo";
  screenInitial.classList.add("hidden");
  screenAgendamento.classList.remove("hidden");
  document.getElementById("headerTitle").innerText = "Agendar Avaliação";
  document.getElementById("labelStepDia").innerText =
    "Escolha o Dia Disponível";
  carregarSlots();
}

// 2. INICIAR CONSULTA
function iniciarModoConsultar() {
  modoOperacao = "consultar";
  screenInitial.classList.add("hidden");
  screenBuscar.classList.remove("hidden");
  document.getElementById("headerTitle").innerText = "Consultar Agendamento";
  document.getElementById("labelBuscaTitulo").innerText =
    "Localizar Minha Consulta";
}

// 3. INICIAR REAGENDAMENTO DIRETO
function iniciarModoReagendar() {
  modoOperacao = "reagendar";
  screenInitial.classList.add("hidden");
  screenBuscar.classList.remove("hidden");
  document.getElementById("headerTitle").innerText = "Reagendar Consulta";
  document.getElementById("labelBuscaTitulo").innerText =
    "Localizar seu Agendamento";
}

// 4. BUSCA POR TELEFONE
async function buscarConsultaPorTelefone() {
  const telLimpo = document
    .getElementById("inputBuscaTelefone")
    .value.replace(/\D/g, "");
  if (telLimpo.length < 10) {
    alert("Por favor, informe o DDD e o número completo do WhatsApp.");
    return;
  }

  const btn = document.getElementById("btnBuscarConsulta");
  btn.disabled = true;
  btn.innerText = "Consultando agenda...";
  statusMessage.className = "status-box hidden";

  try {
    const res = await fetch(
      `${N8N_URL_CONSULTAR}?telefone=${encodeURIComponent(telLimpo)}`,
    );
    const data = await res.json();

    const payload = Array.isArray(data) ? data[0] : data;

    if (!payload || payload.encontrado === false || !payload.evento) {
      statusMessage.className = "status-box error";
      statusMessage.innerText =
        "Nenhuma consulta futura foi localizada com este número.";
      return;
    }

    eventoParaReagendar = {
      supabaseId: payload.evento.id,
      googleEventId: payload.evento.google_event_id,
      nomePet: payload.evento.nomePet,
      nomeTutor: payload.evento.nomeTutor,
      tipoPet: payload.evento.tipoPet,
      startTime: payload.evento.start_time,
    };

    screenBuscar.classList.add("hidden");

    if (modoOperacao === "consultar") {
      // Exibe a tela de detalhes
      document.getElementById("viewPet").innerText =
        `${eventoParaReagendar.nomePet} (${eventoParaReagendar.tipoPet || "Pet"})`;
      document.getElementById("viewTutor").innerText =
        eventoParaReagendar.nomeTutor;
      document.getElementById("viewDataHora").innerText = formatarDataHora(
        eventoParaReagendar.startTime,
      );
      screenDetalhesConsulta.classList.remove("hidden");
    } else {
      // Direto para o calendário de reagendamento
      abrirCalendarioReagendamento();
    }
  } catch (err) {
    statusMessage.className = "status-box error";
    statusMessage.innerText = "Falha ao buscar agendamento. Tente novamente.";
  } finally {
    btn.disabled = false;
    btn.innerText = "Buscar Consulta";
  }
}

// Transição da tela de visualização para o reagendamento
function transicionarParaReagendamento() {
  modoOperacao = "reagendar";
  screenDetalhesConsulta.classList.add("hidden");
  document.getElementById("headerTitle").innerText = "Reagendar Consulta";
  abrirCalendarioReagendamento();
}

function abrirCalendarioReagendamento() {
  document.getElementById("resumoPet").innerText =
    eventoParaReagendar.nomePet || "Pet";
  document.getElementById("resumoTutor").innerText =
    eventoParaReagendar.nomeTutor || "Tutor";
  document.getElementById("resumoDataHora").innerText = formatarDataHora(
    eventoParaReagendar.startTime,
  );

  consultaEncontradaCard.classList.remove("hidden");
  screenAgendamento.classList.remove("hidden");
  document.getElementById("labelStepDia").innerText = "Escolha a Nova Data";
  carregarSlots();
}

// 5. CARREGAR SLOTS DE HORÁRIOS LIVRES
async function carregarSlots() {
  loadingSlots.classList.remove("hidden");
  slotsWrapper.classList.add("hidden");
  horariosWrapper.classList.add("hidden");
  bookingForm.classList.add("hidden");
  reagendarActionBox.classList.add("hidden");

  try {
    const res = await fetch(N8N_URL_SLOTS);
    const data = await res.json();

    if (Array.isArray(data) && data[0]?.agenda) {
      agendaDisponivel = data[0].agenda;
    } else if (data.agenda) {
      agendaDisponivel = data.agenda;
    } else {
      agendaDisponivel = data;
    }

    const dias = Object.keys(agendaDisponivel).filter((d) =>
      /^\d{4}-\d{2}-\d{2}$/.test(d),
    );
    loadingSlots.classList.add("hidden");

    if (dias.length === 0) {
      statusMessage.className = "status-box error";
      statusMessage.innerText =
        "Não há horários disponíveis nos próximos dias.";
      return;
    }

    slotsWrapper.classList.remove("hidden");
    diasContainer.innerHTML = "";

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
    loadingSlots.innerHTML =
      '<p style="color:#ef4444;">Erro ao consultar a agenda. Recarregue a página.</p>';
  }
}

// 6. RENDERIZAR HORÁRIOS LIVRES
function renderHorarios(diaISO) {
  horarioSelecionado = null;
  horariosWrapper.classList.remove("hidden");
  bookingForm.classList.add("hidden");
  reagendarActionBox.classList.add("hidden");
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

      if (modoOperacao === "novo") {
        bookingForm.classList.remove("hidden");
      } else {
        reagendarActionBox.classList.remove("hidden");
      }
    });

    slotsContainer.appendChild(btn);
  });
}

// 7. CONFIRMAR NOVO AGENDAMENTO
bookingForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const btn = document.getElementById("btnSubmitNovo");
  btn.disabled = true;
  btn.innerHTML = "<span>Confirmando Consulta...</span>";
  statusMessage.className = "status-box hidden";

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
    statusMessage.innerText = "✅ Consulta agendada com sucesso!";
    slotsWrapper.classList.add("hidden");
    bookingForm.reset();
  } catch (err) {
    statusMessage.className = "status-box error";
    statusMessage.innerText =
      "❌ Não foi possível agendar. Tente outro horário.";
  } finally {
    btn.disabled = false;
    btn.innerHTML = "<span>Confirmar Agendamento</span>";
  }
});

// 8. EXECUTAR REAGENDAMENTO
async function executarReagendamento() {
  if (!dataSelecionada || !horarioSelecionado) {
    alert("Por favor, selecione a nova data e horário.");
    return;
  }

  const btn = document.getElementById("btnConfirmarReagendamento");
  btn.disabled = true;
  btn.innerHTML = "<span>Atualizando Horário...</span>";
  statusMessage.className = "status-box hidden";

  const payload = {
    eventId: eventoParaReagendar.googleEventId,
    supabaseId: eventoParaReagendar.supabaseId,
    nova_start_time: new Date(
      `${dataSelecionada}T${horarioSelecionado}:00-03:00`,
    ).toISOString(),
  };

  try {
    const res = await fetch(N8N_URL_REAGENDAR, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);

    statusMessage.className = "status-box success";
    statusMessage.innerText = "✅ Consulta reagendada com sucesso!";
    slotsWrapper.classList.add("hidden");
    consultaEncontradaCard.classList.add("hidden");
  } catch (err) {
    statusMessage.className = "status-box error";
    statusMessage.innerText = "❌ Falha ao reagendar. Tente novamente.";
  } finally {
    btn.disabled = false;
    btn.innerHTML = "<span>Salvar Novo Horário</span>";
  }
}

function formatarDataHora(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  });
}
