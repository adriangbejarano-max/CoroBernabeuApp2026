const STORAGE_KEY = "coro-bernabeu-checkin-state-v1";
const SESSION_KEY = "coro-bernabeu-supabase-session-v1";
const supabaseConfig = window.SUPABASE_CONFIG || {};
const supabaseEnabled = Boolean(supabaseConfig.url && supabaseConfig.publishableKey);

const categoryColors = {
  Cantante: "#0f8fb3",
  Bailarin: "#ff5a5f",
  Solista: "#7c4dff",
  Productor: "#ff9f1c",
  Orquesta: "#2ec4b6",
  Invitado: "#ffb703",
  Tecnico: "#3d5a80",
  Staff: "#4e657a",
};

const seedState = {
  currentUserId: null,
  activeTab: "checkin",
  activeEventId: "misa-bernabeu",
  search: {
    dni: "",
    name: "",
  },
  adminFilters: {
    category: "",
    source: "",
    createdDate: "",
  },
  entrySearch: {
    firstName: "",
    lastName: "",
    dni: "",
  },
  reports: {
    selectedEventId: "",
    compareRaw: "",
    missingNames: [],
  },
  users: [],
  events: [
    {
      id: "misa-bernabeu",
      name: "Encuentro Coral Santiago Bernabeu",
      date: "2026-06-14",
      location: "Estadio Santiago Bernabeu",
    },
    {
      id: "ensayo-general",
      name: "Ensayo general",
      date: "2026-06-12",
      location: "Zona de escenario",
    },
    {
      id: "acreditaciones",
      name: "Acreditaciones previas",
      date: "2026-06-11",
      location: "Acceso principal",
    },
  ],
  attendees: [
    {
      id: "a-1",
      dni: "12345678A",
      fullName: "Maria Gomez Salas",
      category: "Cantante",
      group: "Soprano",
      email: "",
      birthDate: "",
      accreditation: "GRADA",
      source: "manual",
      rehearsal01: false,
      rehearsal02: false,
      ticketStatus: "ACREDITADO",
      createdAt: "2026-06-02T00:00:00.000Z",
      phone: "600 111 222",
      notes: "Coro parroquial San Juan",
      checkins: {},
    },
    {
      id: "a-2",
      dni: "87654321B",
      fullName: "Lucia Martin Prieto",
      category: "Bailarin",
      group: "Danza joven",
      email: "",
      birthDate: "",
      accreditation: "ZONA CERO",
      source: "manual",
      rehearsal01: false,
      rehearsal02: false,
      ticketStatus: "ACREDITADO",
      createdAt: "2026-06-02T00:00:00.000Z",
      phone: "600 222 333",
      notes: "Entrada con grupo de danza",
      checkins: {},
    },
    {
      id: "a-3",
      dni: "55555555C",
      fullName: "Ana Ruiz Torres",
      category: "Invitado",
      group: "Familias",
      email: "",
      birthDate: "",
      accreditation: "GRADA",
      source: "manual",
      rehearsal01: false,
      rehearsal02: false,
      ticketStatus: "ACREDITADO",
      createdAt: "2026-06-02T00:00:00.000Z",
      phone: "600 333 444",
      notes: "Madre de Pablo y Clara",
      checkins: {},
    },
    {
      id: "a-4",
      dni: "55555555C",
      fullName: "Pablo Ruiz Torres",
      category: "Cantante",
      group: "Infantil",
      email: "",
      birthDate: "",
      accreditation: "GRADA",
      source: "manual",
      rehearsal01: false,
      rehearsal02: false,
      ticketStatus: "ACREDITADO",
      createdAt: "2026-06-02T00:00:00.000Z",
      phone: "600 333 444",
      notes: "Menor asociado al DNI familiar",
      checkins: {},
    },
    {
      id: "a-5",
      dni: "55555555C",
      fullName: "Clara Ruiz Torres",
      category: "Cantante",
      group: "Infantil",
      email: "",
      birthDate: "",
      accreditation: "GRADA",
      source: "manual",
      rehearsal01: false,
      rehearsal02: false,
      ticketStatus: "ACREDITADO",
      createdAt: "2026-06-02T00:00:00.000Z",
      phone: "600 333 444",
      notes: "Menor asociado al DNI familiar",
      checkins: {},
    },
    {
      id: "a-6",
      dni: "11223344D",
      fullName: "Javier Navarro Ortega",
      category: "Orquesta",
      group: "Cuerda",
      email: "",
      birthDate: "",
      accreditation: "ZONA CERO",
      source: "manual",
      rehearsal01: false,
      rehearsal02: false,
      ticketStatus: "ACREDITADO",
      createdAt: "2026-06-02T00:00:00.000Z",
      phone: "600 444 555",
      notes: "Violin",
      checkins: {},
    },
    {
      id: "a-7",
      dni: "99887766E",
      fullName: "Carolina Vega Leon",
      category: "Productor",
      group: "Produccion",
      email: "",
      birthDate: "",
      accreditation: "ZONA CERO",
      source: "manual",
      rehearsal01: false,
      rehearsal02: false,
      ticketStatus: "ACREDITADO",
      createdAt: "2026-06-02T00:00:00.000Z",
      phone: "600 555 666",
      notes: "Coordinacion de backstage",
      checkins: {},
    },
  ],
};

let state = loadState();
let editingAttendeeId = null;
let toastTimer = null;
let cloudSession = loadCloudSession();
let cloudReady = false;
let cloudError = "";

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return normalizeState(structuredClone(seedState));
  try {
    return normalizeState({ ...structuredClone(seedState), ...JSON.parse(saved) });
  } catch {
    return normalizeState(structuredClone(seedState));
  }
}

function normalizeState(nextState) {
  nextState.search = { ...seedState.search, ...(nextState.search || {}) };
  nextState.adminFilters = { ...seedState.adminFilters, ...(nextState.adminFilters || {}) };
  nextState.entrySearch = { ...seedState.entrySearch, ...(nextState.entrySearch || {}) };
  nextState.reports = { ...seedState.reports, ...(nextState.reports || {}) };
  nextState.attendees = (nextState.attendees || []).map((person) => ({
    email: "",
    birthDate: "",
    accreditation: "",
    source: "manual",
    rehearsal01: false,
    rehearsal02: false,
    ticketStatus: "ACREDITADO",
    createdAt: new Date().toISOString(),
    ...person,
  }));
  return nextState;
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadCloudSession() {
  const saved = localStorage.getItem(SESSION_KEY);
  if (!saved) return null;
  try {
    return JSON.parse(saved);
  } catch {
    return null;
  }
}

function saveCloudSession(session) {
  cloudSession = session;
  if (session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
}

function cloudHeaders(extra = {}) {
  const token = cloudSession?.access_token || supabaseConfig.publishableKey;
  return {
    apikey: supabaseConfig.publishableKey,
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

async function supabaseRequest(path, options = {}) {
  if (!supabaseEnabled) throw new Error("Supabase no esta configurado.");
  const response = await fetch(`${supabaseConfig.url}${path}`, {
    ...options,
    headers: cloudHeaders(options.headers),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Supabase respondio ${response.status}`);
  }
  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function signInWithSupabase(email, password) {
  const data = await supabaseRequest("/auth/v1/token?grant_type=password", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  saveCloudSession(data);
  return data;
}

async function loadCloudData() {
  if (!supabaseEnabled || !cloudSession?.access_token) return false;
  const [profiles, events, attendees, checkins, settings] = await Promise.all([
    supabaseRequest("/rest/v1/profiles?select=*&order=created_at.asc"),
    supabaseRequest("/rest/v1/events?select=*&order=event_date.asc"),
    supabaseRequest("/rest/v1/attendees?select=*&order=full_name.asc"),
    supabaseRequest("/rest/v1/checkins?select=*"),
    supabaseRequest("/rest/v1/app_settings?select=key,value&key=eq.active_event_id"),
  ]);

  const checkinsByAttendee = checkins.reduce((acc, row) => {
    acc[row.attendee_id] = acc[row.attendee_id] || {};
    acc[row.attendee_id][row.event_id] = {
      time: new Date(row.checked_in_at).toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      by: row.checked_by || "Equipo",
      byName: profiles.find((profile) => profile.id === row.checked_by)?.full_name || "",
      iso: row.checked_in_at,
    };
    return acc;
  }, {});

  state.users = profiles.map((profile) => ({
    id: profile.id,
    name: profile.full_name,
    email: profile.email || "",
    password: "",
    role: profile.role,
  }));
  state.events = events.map((event) => ({
    id: event.id,
    name: event.name,
    date: event.event_date,
    location: event.location,
  }));
  state.attendees = attendees.map((person) => ({
    id: person.id,
    dni: person.dni,
    fullName: person.full_name,
    category: person.category,
    group: person.group_name,
    email: person.email || "",
    birthDate: person.birth_date || "",
    accreditation: person.accreditation || "",
    source: person.source || "manual",
    rehearsal01: Boolean(person.rehearsal_01),
    rehearsal02: Boolean(person.rehearsal_02),
    ticketStatus: person.ticket_status || "ACREDITADO",
    createdAt: person.created_at,
    phone: person.phone,
    notes: person.notes,
    checkins: checkinsByAttendee[person.id] || {},
  }));
  const activeSetting = settings.find((setting) => setting.key === "active_event_id");
  state.activeEventId = activeSetting?.value || "";
  cloudReady = true;
  cloudError = "";
  saveState();
  return true;
}

async function tryCloudSync(showMessage = false) {
  try {
    const loaded = await loadCloudData();
    if (loaded && showMessage) showToast("Datos sincronizados con Supabase.");
  } catch (error) {
    cloudReady = false;
    cloudError = "Supabase pendiente de configurar tablas o usuarios.";
    console.warn(error);
    if (showMessage) showToast("No se pudo sincronizar con Supabase.");
  }
}

function isCloudUser() {
  return Boolean(cloudReady && cloudSession?.access_token && currentUser()?.password === "");
}

function byId(id) {
  return document.getElementById(id);
}

function currentUser() {
  return state.users.find((user) => user.id === state.currentUserId) || null;
}

function setDefaultTabForUser() {
  const user = currentUser();
  if (!user) return;
  if (user.role === "supervisor" && !["entry-checkin", "reports"].includes(state.activeTab)) {
    state.activeTab = "entry-checkin";
  }
  if (user.role === "volunteer") {
    state.activeTab = "checkin";
  }
}

function activeEvent() {
  return state.events.find((event) => event.id === state.activeEventId) || null;
}

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function isMinor(birthDate) {
  if (!birthDate) return false;
  const birth = new Date(`${birthDate}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return false;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age -= 1;
  return age < 18;
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function dateInputValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function hasActiveSearch() {
  return Boolean(normalize(state.search.dni) || normalize(state.search.name));
}

function showToast(message) {
  const toast = byId("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function render() {
  const user = currentUser();
  byId("app").innerHTML = user ? renderApp(user) : renderLogin();
  bindEvents();
}

function renderLogin() {
  return `
    <main class="login-screen">
      <section class="brand-panel">
        <div class="crest">♪</div>
        <div class="brand-copy">
          <span class="login-kicker">Madrid 2026</span>
          <h1>Visita Papa Leon XIV Madrid 2026</h1>
          <p>Un acceso rapido para acompanar con orden, alegria y ritmo el encuentro del Santiago Bernabeu.</p>
          <div class="music-notes" aria-hidden="true">
            <span>♪</span>
            <span>♫</span>
            <span>♬</span>
          </div>
        </div>
        <p class="muted">Check-in de asistentes, coros y equipos</p>
      </section>
      <section class="login-panel">
        <form class="login-card" id="loginForm">
          <div class="login-icon" aria-hidden="true">♫</div>
          <h2>Hola, voluntario/a</h2>
          <p>Accede para comenzar el check-in.</p>
          <label class="field">
            <span>Email</span>
            <input name="email" type="email" autocomplete="email" required />
          </label>
          <label class="field">
            <span>Contrasena</span>
            <input name="password" type="password" autocomplete="current-password" required />
          </label>
          <button class="btn primary" type="submit">Entrar</button>
        </form>
      </section>
      <div class="toast" id="toast"></div>
    </main>
  `;
}

function renderApp(user) {
  if (user.role === "volunteer") return renderVolunteerApp(user);
  if (user.role === "supervisor") return renderSupervisorApp(user);

  const adminTabs =
    user.role === "admin"
      ? `
        <button class="btn tab ${state.activeTab === "attendees" ? "active" : ""}" data-tab="attendees">Editar asistentes</button>
        <button class="btn tab ${state.activeTab === "users" ? "active" : ""}" data-tab="users">Usuarios</button>
        <button class="btn tab ${state.activeTab === "events" ? "active" : ""}" data-tab="events">Eventos</button>
        <button class="btn tab ${state.activeTab === "reports" ? "active" : ""}" data-tab="reports">Registros</button>
      `
      : "";

  return `
    <main class="app-shell">
      <header class="topbar">
        <div class="topbar-brand">
          <div class="mini-crest">CB</div>
          <div>
            <strong>Coro Bernabeu 2026</strong>
            <span>Check-in visita papa Leon XIV</span>
          </div>
        </div>
        <div class="top-actions">
          <div class="badge ${cloudReady ? "checked" : ""}" title="${escapeHtml(cloudError || "Estado de conexion")}">
            ${cloudReady ? "Supabase" : "Sin conexion"}
          </div>
          <div class="user-box">
            <strong>${escapeHtml(user.name)}</strong>
            <span>${roleLabel(user.role)}</span>
          </div>
          <button class="btn ghost" id="logoutBtn" type="button">Salir</button>
        </div>
      </header>

      <div class="layout">
        <nav class="sidebar">
          <button class="btn tab ${state.activeTab === "checkin" ? "active" : ""}" data-tab="checkin">Check-in</button>
          <button class="btn tab ${state.activeTab === "dashboard" ? "active" : ""}" data-tab="dashboard">Resumen</button>
          ${adminTabs}
        </nav>
        <section class="content">
          ${renderActiveView(user)}
        </section>
      </div>
      <div class="toast" id="toast"></div>
    </main>
  `;
}

function roleLabel(role) {
  if (role === "admin") return "Administrador";
  if (role === "supervisor") return "Supervisor";
  return "Voluntario";
}

function renderSupervisorApp(user) {
  return `
    <main class="app-shell">
      <header class="topbar">
        <div class="topbar-brand">
          <div class="mini-crest">CB</div>
          <div>
            <strong>Supervision</strong>
            <span>Entradas y registros</span>
          </div>
        </div>
        <div class="top-actions">
          <div class="badge checked">Supabase</div>
          <div class="user-box">
            <strong>${escapeHtml(user.name)}</strong>
            <span>Supervisor</span>
          </div>
          <button class="btn ghost" id="logoutBtn" type="button">Salir</button>
        </div>
      </header>
      <div class="layout">
        <nav class="sidebar">
          <button class="btn tab ${state.activeTab === "entry-checkin" ? "active" : ""}" data-tab="entry-checkin">Check-in entradas</button>
          <button class="btn tab ${state.activeTab === "reports" ? "active" : ""}" data-tab="reports">Registros</button>
        </nav>
        <section class="content">
          ${state.activeTab === "reports" ? renderReports() : renderEntryCheckin()}
        </section>
      </div>
      <div class="toast" id="toast"></div>
    </main>
  `;
}

function renderVolunteerApp(user) {
  return `
    <main class="app-shell volunteer-shell">
      <header class="topbar volunteer-topbar">
        <div class="topbar-brand">
          <div class="mini-crest">CB</div>
          <div>
            <strong>Check-in</strong>
            <span>Visita Papa Leon XIV Madrid 2026</span>
          </div>
        </div>
        <div class="top-actions">
          <div class="user-box">
            <strong>${escapeHtml(user.name)}</strong>
            <span>Voluntario/a</span>
          </div>
          <button class="btn ghost" id="logoutBtn" type="button">Salir</button>
        </div>
      </header>
      <section class="volunteer-content">
        ${renderVolunteerEventStatus()}
        ${renderCheckin()}
      </section>
      <div class="toast" id="toast"></div>
    </main>
  `;
}

function renderVolunteerEventStatus() {
  const event = activeEvent();
  if (!event) {
    return `
      <section class="empty-state no-event-state">
        <strong>PIDELE A TU ADMIN QUE ACTIVE UN EVENTO</strong>
        <span>Cuando haya un evento activo, podras empezar a registrar check-ins.</span>
      </section>
    `;
  }
  return `
    <section class="event-strip readonly-event">
      <div>
        <span class="muted">Evento activo</span>
        <strong>${escapeHtml(event.name)}</strong>
      </div>
      <div class="badge">${escapeHtml(event.location)}</div>
    </section>
  `;
}

function renderActiveView(user) {
  if (state.activeTab === "dashboard") return renderDashboard();
  if (state.activeTab === "attendees" && user.role === "admin") return renderAttendeesAdmin();
  if (state.activeTab === "users" && user.role === "admin") return renderUsersAdmin();
  if (state.activeTab === "events" && user.role === "admin") return renderEventsAdmin();
  if (state.activeTab === "reports" && (user.role === "admin" || user.role === "supervisor")) return renderReports();
  return renderCheckin();
}

function renderDashboard() {
  const event = activeEvent();
  const checked = event ? state.attendees.filter((person) => person.checkins[event.id]).length : 0;
  const total = state.attendees.length;
  const categories = Object.keys(categoryColors);

  return `
    <section class="stats-grid">
      <div class="stat"><span>Total asistentes</span><strong>${total}</strong></div>
      <div class="stat"><span>Check-in realizados</span><strong>${checked}</strong></div>
      <div class="stat"><span>Pendientes</span><strong>${total - checked}</strong></div>
      <div class="stat"><span>Eventos</span><strong>${state.events.length}</strong></div>
    </section>
    <section class="panel">
      <div class="panel-title">
        <div>
          <h2>Resumen por categoria</h2>
          <p>${event ? escapeHtml(event.name) : "Sin evento activo"}</p>
        </div>
      </div>
      <div class="admin-list">
        ${categories
          .map((category) => {
            const people = state.attendees.filter((person) => person.category === category);
            if (!people.length) return "";
            const categoryChecked = event ? people.filter((person) => person.checkins[event.id]).length : 0;
            return `
              <div class="admin-item" style="--category-color:${categoryColors[category]}">
                <div>
                  <h3><span class="badge category">${category}</span></h3>
                  <p class="muted">${categoryChecked} de ${people.length} acreditados</p>
                </div>
                <strong>${Math.round((categoryChecked / people.length) * 100)}%</strong>
              </div>
            `;
          })
          .join("")}
      </div>
    </section>
  `;
}

function renderCheckin() {
  const event = activeEvent();
  if (!event) {
    return `
      <section class="empty-state no-event-state">
        <strong>PIDELE A TU ADMIN QUE ACTIVE UN EVENTO</strong>
        <span>No hay un evento activo para registrar check-ins.</span>
      </section>
    `;
  }
  const results = getSearchResults();
  return `
    <section class="panel">
      <div class="panel-title">
        <div>
          <h2>Check-in de asistentes</h2>
          <p>Introduce un DNI o un nombre completo para ver asistentes y marcar el check-in.</p>
        </div>
      </div>
      <div class="search-grid">
        <label class="field">
          <span>Busqueda rapida por DNI</span>
          <input id="dniSearch" placeholder="Ej. 55555555C" inputmode="text" value="${escapeHtml(state.search.dni)}" />
        </label>
        <label class="field">
          <span>Busqueda avanzada por nombre</span>
          <input id="nameSearch" placeholder="Nombre y apellidos" value="${escapeHtml(state.search.name)}" />
        </label>
      </div>
      <div class="hint">Evento: ${escapeHtml(event.name)}. Si un DNI tiene varios perfiles, apareceran todos.</div>
    </section>
    <section class="result-list" id="results">${renderResults(results)}</section>
  `;
}

function getSearchResults() {
  const dni = normalize(state.search.dni).replace(/\s/g, "");
  const name = normalize(state.search.name);
  let results = state.attendees;

  if (dni) {
    results = results.filter((person) => normalize(person.dni).replace(/\s/g, "").includes(dni));
  }
  if (name) {
    const terms = name.split(/\s+/).filter(Boolean);
    results = results.filter((person) => terms.every((term) => normalize(person.fullName).includes(term)));
  }

  return dni || name ? results : [];
}

function renderResults(results) {
  if (!hasActiveSearch()) {
    return `<div class="empty-state search-empty"><strong>Busca un asistente para empezar</strong><span>Usa el DNI para ir rapido o el nombre completo si necesitas una busqueda avanzada.</span></div>`;
  }
  if (!results.length) {
    return `<div class="empty-state">No hay asistentes que coincidan con la busqueda.</div>`;
  }
  return results.map(renderPersonCard).join("");
}

function renderEntryCheckin() {
  const results = getEntrySearchResults();
  return `
    <section class="panel">
      <div class="panel-title">
        <div>
          <h2>Check-in entradas</h2>
          <p>Busca por nombre, apellido o DNI. Con un solo campo relleno ya se realiza la busqueda.</p>
        </div>
      </div>
      <div class="entry-search-grid">
        <label class="field">
          <span>Nombre</span>
          <input id="entryFirstNameSearch" placeholder="Nombre" value="${escapeHtml(state.entrySearch.firstName)}" />
        </label>
        <label class="field">
          <span>Apellido</span>
          <input id="entryLastNameSearch" placeholder="Apellido" value="${escapeHtml(state.entrySearch.lastName)}" />
        </label>
        <label class="field">
          <span>DNI</span>
          <input id="entryDniSearch" placeholder="DNI" value="${escapeHtml(state.entrySearch.dni)}" />
        </label>
      </div>
    </section>
    <section class="entry-list">
      ${hasEntrySearch() ? renderEntryRows(results) : `<div class="empty-state search-empty"><strong>Busca para ver participantes</strong><span>No se muestra ningun registro hasta introducir nombre, apellido o DNI.</span></div>`}
    </section>
  `;
}

function hasEntrySearch() {
  return Boolean(normalize(state.entrySearch.firstName) || normalize(state.entrySearch.lastName) || normalize(state.entrySearch.dni));
}

function getEntrySearchResults() {
  const firstName = normalize(state.entrySearch.firstName);
  const lastName = normalize(state.entrySearch.lastName);
  const dni = normalize(state.entrySearch.dni).replace(/\s/g, "");
  if (!firstName && !lastName && !dni) return [];
  return state.attendees.filter((person) => {
    const name = normalize(person.fullName);
    const personDni = normalize(person.dni).replace(/\s/g, "");
    if (firstName && !name.includes(firstName)) return false;
    if (lastName && !name.includes(lastName)) return false;
    if (dni && !personDni.includes(dni)) return false;
    return true;
  });
}

function renderEntryRows(results) {
  if (!results.length) return `<div class="empty-state">No hay participantes con esos datos.</div>`;
  return `
    <div class="entry-table">
      ${results.map(renderEntryRow).join("")}
    </div>
  `;
}

function renderEntryRow(person) {
  return `
    <article class="entry-row">
      <div>
        <h3>${escapeHtml(person.fullName)} ${isMinor(person.birthDate) ? `<span class="badge minor">MENOR DE EDAD</span>` : ""}</h3>
        <p class="muted">DNI ${escapeHtml(person.dni)} · ${escapeHtml(person.category)} · ${escapeHtml(person.accreditation || "Sin acreditacion")}</p>
      </div>
      <label class="check-field">
        <input type="checkbox" data-entry-field="rehearsal01" data-entry-id="${person.id}" ${person.rehearsal01 ? "checked" : ""} />
        <span>ENSAYO 01</span>
      </label>
      <label class="check-field">
        <input type="checkbox" data-entry-field="rehearsal02" data-entry-id="${person.id}" ${person.rehearsal02 ? "checked" : ""} />
        <span>ENSAYO 02</span>
      </label>
      <label class="field compact-field">
        <span>Entrada</span>
        <select data-ticket-status="${person.id}">
          ${["ACREDITADO", "ENTRADA", "ENTRADA ASIGNADA"]
            .map((status) => `<option value="${status}" ${person.ticketStatus === status ? "selected" : ""}>${status}</option>`)
            .join("")}
        </select>
      </label>
    </article>
  `;
}

function renderReports() {
  const rows = getReportRows();
  return `
    <section class="panel">
      <div class="panel-title">
        <div>
          <h2>Registros de eventos</h2>
          <p>Descarga los check-ins y consulta quien los ha realizado.</p>
        </div>
        <button class="btn primary" id="downloadCheckinsBtn" type="button">Descargar CSV</button>
      </div>
      <label class="field">
        <span>Evento</span>
        <select id="reportEventFilter">
          <option value="">Todos los eventos</option>
          ${state.events
            .map((event) => `<option value="${event.id}" ${state.reports.selectedEventId === event.id ? "selected" : ""}>${escapeHtml(event.name)} - ${escapeHtml(event.date)}</option>`)
            .join("")}
        </select>
      </label>
      <div class="report-table">
        ${rows.length ? rows.slice(0, 80).map(renderReportRow).join("") : `<div class="empty-state">No hay check-ins para este filtro.</div>`}
      </div>
    </section>
    <section class="panel">
      <div class="panel-title">
        <div>
          <h2>Comparar lista</h2>
          <p>Sube o pega una lista de nombres/DNI para ver cuales no estan en la base.</p>
        </div>
        <button class="btn ghost" id="downloadMissingBtn" type="button" ${state.reports.missingNames.length ? "" : "disabled"}>Descargar no encontrados</button>
      </div>
      <label class="field">
        <span>Subir lista CSV/TXT</span>
        <input id="compareFileInput" type="file" accept=".csv,.txt" />
      </label>
      <label class="field">
        <span>O pegar lista</span>
        <textarea id="compareListInput" rows="7" placeholder="Un nombre o DNI por linea">${escapeHtml(state.reports.compareRaw)}</textarea>
      </label>
      <button class="btn primary" id="compareListBtn" type="button">Buscar nombres que NO ESTAN</button>
      <div class="missing-list">
        ${state.reports.missingNames.length ? state.reports.missingNames.map((name) => `<div class="admin-item"><strong>${escapeHtml(name)}</strong></div>`).join("") : `<div class="empty-state">Aun no hay resultados de comparacion.</div>`}
      </div>
    </section>
  `;
}

function getReportRows() {
  const rows = [];
  const usersById = Object.fromEntries(state.users.map((user) => [user.id, user]));
  const eventsById = Object.fromEntries(state.events.map((event) => [event.id, event]));
  state.attendees.forEach((person) => {
    Object.entries(person.checkins || {}).forEach(([eventId, checkin]) => {
      if (state.reports.selectedEventId && eventId !== state.reports.selectedEventId) return;
      rows.push({
        event: eventsById[eventId]?.name || eventId,
        eventDate: eventsById[eventId]?.date || "",
        attendee: person.fullName,
        dni: person.dni,
        category: person.category,
        checkedAt: checkin.iso || checkin.time || "",
        checkedBy: usersById[checkin.by]?.name || checkin.byName || checkin.by || "",
      });
    });
  });
  return rows.sort((a, b) => String(b.checkedAt).localeCompare(String(a.checkedAt)));
}

function renderReportRow(row) {
  return `
    <article class="admin-item">
      <div>
        <h3>${escapeHtml(row.attendee)} <span class="badge category">${escapeHtml(row.category)}</span></h3>
        <p class="muted">DNI ${escapeHtml(row.dni)} · ${escapeHtml(row.event)} · ${escapeHtml(row.eventDate)}</p>
      </div>
      <div>
        <strong>${escapeHtml(row.checkedBy || "Sin usuario")}</strong>
        <p class="muted">${escapeHtml(formatDate(row.checkedAt) || row.checkedAt)}</p>
      </div>
    </article>
  `;
}

function renderPersonCard(person) {
  const event = activeEvent();
  if (!event) return "";
  const checked = person.checkins[event.id];
  const color = categoryColors[person.category] || categoryColors.Staff;
  return `
    <article class="person-card" style="--category-color:${color}">
      <div>
        <h3 class="person-name">${escapeHtml(person.fullName)}</h3>
        <div class="person-meta">
          <span class="badge category">${escapeHtml(person.category)}</span>
          ${isMinor(person.birthDate) ? `<span class="badge minor">MENOR DE EDAD</span>` : ""}
          ${person.accreditation ? `<span class="badge">${escapeHtml(person.accreditation)}</span>` : ""}
          <span>DNI ${escapeHtml(person.dni)}</span>
          <span>${escapeHtml(person.group)}</span>
          ${checked ? `<span class="badge checked">Check-in ${escapeHtml(checked.time)}</span>` : `<span>Pendiente</span>`}
        </div>
        ${person.notes ? `<p class="muted">${escapeHtml(person.notes)}</p>` : ""}
      </div>
      <div class="card-actions">
        <button class="btn ${checked ? "ghost" : "primary"}" data-checkin="${person.id}" type="button">
          ${checked ? "Desmarcar CHECK-IN" : "Marcar CHECK-IN"}
        </button>
      </div>
    </article>
  `;
}

function renderAttendeesAdmin() {
  const editing = state.attendees.find((person) => person.id === editingAttendeeId);
  const filteredAttendees = getFilteredAdminAttendees();
  const values = editing || {
    fullName: "",
    dni: "",
    category: "Cantante",
    group: "",
    email: "",
    birthDate: "",
    accreditation: "",
    source: "manual",
    phone: "",
    notes: "",
  };

  return `
    <section class="admin-grid">
      <form class="panel" id="attendeeForm">
        <div class="panel-title">
          <div>
            <h2>${editing ? "Editar ficha" : "Nuevo asistente"}</h2>
            <p>Datos visibles para el equipo de check-in.</p>
          </div>
        </div>
        <input type="hidden" name="id" value="${editing ? editing.id : ""}" />
        <div class="form-grid">
          <label class="field full"><span>Nombre completo</span><input name="fullName" value="${escapeHtml(values.fullName)}" required /></label>
          <label class="field"><span>DNI</span><input name="dni" value="${escapeHtml(values.dni)}" required /></label>
          <label class="field"><span>Categoria</span>${renderCategorySelect(values.category)}</label>
          <label class="field"><span>Parroquia, colegio o grupo</span><input name="group" value="${escapeHtml(values.group)}" /></label>
          <label class="field"><span>Acreditacion</span><input name="accreditation" value="${escapeHtml(values.accreditation || "")}" /></label>
          <label class="field"><span>Telefono</span><input name="phone" value="${escapeHtml(values.phone)}" /></label>
          <label class="field"><span>Email</span><input name="email" type="email" value="${escapeHtml(values.email || "")}" /></label>
          <label class="field"><span>Fecha nacimiento</span><input name="birthDate" type="date" value="${escapeHtml(values.birthDate || "")}" /></label>
          <label class="field full"><span>Notas</span><textarea name="notes" rows="3">${escapeHtml(values.notes)}</textarea></label>
        </div>
        <button class="btn primary" type="submit">${editing ? "Guardar cambios" : "Crear asistente"}</button>
        ${editing ? `<button class="btn ghost" id="cancelEditBtn" type="button">Cancelar edicion</button>` : ""}
      </form>
      <section class="panel">
        <div class="panel-title">
          <div>
            <h2>Asistentes</h2>
            <p>${filteredAttendees.length} de ${state.attendees.length} fichas visibles.</p>
          </div>
        </div>
        <div class="filters-grid">
          <label class="field">
            <span>Categoria</span>
            <select id="adminCategoryFilter">
              <option value="">Todas</option>
              ${Object.keys(categoryColors)
                .map((category) => `<option value="${category}" ${state.adminFilters.category === category ? "selected" : ""}>${category}</option>`)
                .join("")}
            </select>
          </label>
          <label class="field">
            <span>Origen</span>
            <select id="adminSourceFilter">
              <option value="">Todos</option>
              <option value="excel" ${state.adminFilters.source === "excel" ? "selected" : ""}>Excel</option>
              <option value="manual" ${state.adminFilters.source === "manual" ? "selected" : ""}>Manual</option>
            </select>
          </label>
          <label class="field">
            <span>Creado el dia</span>
            <input id="adminCreatedDateFilter" type="date" value="${escapeHtml(state.adminFilters.createdDate)}" />
          </label>
        </div>
        <div class="import-box">
          <strong>Importacion del Excel</strong>
          <span class="muted">Cuando tengas el archivo definitivo, se mapearan columnas como DNI, nombre, categoria, grupo, telefono y notas. Esta primera version ya admite el modelo de datos.</span>
        </div>
        <div class="admin-list">
          ${filteredAttendees.length ? filteredAttendees.map(renderAdminAttendee).join("") : `<div class="empty-state">No hay asistentes con esos filtros.</div>`}
        </div>
      </section>
    </section>
  `;
}

function getFilteredAdminAttendees() {
  return state.attendees.filter((person) => {
    if (state.adminFilters.category && person.category !== state.adminFilters.category) return false;
    if (state.adminFilters.source && (person.source || "manual") !== state.adminFilters.source) return false;
    if (state.adminFilters.createdDate && dateInputValue(person.createdAt) !== state.adminFilters.createdDate) return false;
    return true;
  });
}

function renderCategorySelect(selected) {
  return `
    <select name="category">
      ${Object.keys(categoryColors)
        .map((category) => `<option value="${category}" ${category === selected ? "selected" : ""}>${category}</option>`)
        .join("")}
    </select>
  `;
}

function renderAdminAttendee(person) {
  const color = categoryColors[person.category] || categoryColors.Staff;
  return `
    <article class="admin-item" style="--category-color:${color}">
      <div>
        <h3>${escapeHtml(person.fullName)} <span class="badge category">${escapeHtml(person.category)}</span> ${isMinor(person.birthDate) ? `<span class="badge minor">MENOR DE EDAD</span>` : ""}</h3>
        <p class="muted">DNI ${escapeHtml(person.dni)} · ${escapeHtml(person.group || "Sin grupo")} · ${escapeHtml(person.accreditation || "Sin acreditacion")}</p>
        <p class="muted">Origen: ${person.source === "excel" ? "Excel" : "Manual"} · Creado: ${escapeHtml(formatDate(person.createdAt) || "Sin fecha")}</p>
      </div>
      <div class="card-actions">
        <button class="btn ghost" data-edit-attendee="${person.id}" type="button">Editar</button>
        <button class="btn danger" data-delete-attendee="${person.id}" type="button">Borrar</button>
      </div>
    </article>
  `;
}

function renderUsersAdmin() {
  const volunteers = state.users.filter((user) => user.role === "volunteer");
  const supervisors = state.users.filter((user) => user.role === "supervisor");
  const admins = state.users.filter((user) => user.role === "admin");
  return `
    <section class="admin-grid">
      <form class="panel" id="userForm">
        <div class="panel-title">
          <div>
            <h2>Crear usuario</h2>
            <p>Los administradores pueden crear voluntarios, supervisores y otros administradores.</p>
          </div>
        </div>
        <label class="field"><span>Nombre</span><input name="name" required /></label>
        <label class="field"><span>Email</span><input name="email" type="email" required /></label>
        <label class="field"><span>Contrasena inicial</span><input name="password" required /></label>
        <label class="field">
          <span>Rol</span>
          <select name="role">
            <option value="volunteer">Voluntario</option>
            <option value="supervisor">Supervisor</option>
            <option value="admin">Administrador</option>
          </select>
        </label>
        <button class="btn primary" type="submit">Crear usuario</button>
      </form>
      <section class="panel">
        <div class="panel-title">
          <div>
            <h2>Usuarios</h2>
            <p>${admins.length} administradores · ${supervisors.length} supervisores · ${volunteers.length} voluntarios.</p>
          </div>
        </div>
        <div class="admin-list">
          ${state.users
            .map(
              (user) => `
                <article class="admin-item">
                  <div>
                    <h3>${escapeHtml(user.name)} <span class="badge category">${escapeHtml(roleLabel(user.role))}</span></h3>
                    <p class="muted">${escapeHtml(user.email)}</p>
                  </div>
                  <button class="btn danger" data-delete-user="${user.id}" type="button">Borrar</button>
                </article>
              `,
            )
            .join("")}
        </div>
      </section>
    </section>
  `;
}

function renderEventsAdmin() {
  const event = activeEvent();
  return `
    <section class="admin-grid">
      <form class="panel" id="eventForm">
        <div class="panel-title">
          <div>
            <h2>Nuevo evento</h2>
            <p>Cada evento mantiene su propio historial de check-in.</p>
          </div>
        </div>
        <label class="field"><span>Nombre</span><input name="name" required /></label>
        <label class="field"><span>Fecha</span><input name="date" type="date" required /></label>
        <label class="field"><span>Ubicacion</span><input name="location" required /></label>
        <button class="btn primary" type="submit">Crear evento</button>
      </form>
      <section class="panel">
        <div class="panel-title">
          <div>
            <h2>Evento activo</h2>
            <p>${event ? `${escapeHtml(event.name)} · ${escapeHtml(event.date)}` : "No hay evento activo para los voluntarios."}</p>
          </div>
          ${event ? `<button class="btn ghost" data-clear-active-event type="button">Desactivar evento</button>` : ""}
        </div>
        <div class="admin-list">
          ${state.events
            .map(
              (item) => `
                <article class="admin-item ${item.id === state.activeEventId ? "active-event-item" : ""}">
                  <div>
                    <h3>${escapeHtml(item.name)} ${item.id === state.activeEventId ? `<span class="badge checked">Activo</span>` : ""}</h3>
                    <p class="muted">${escapeHtml(item.date)} · ${escapeHtml(item.location)}</p>
                  </div>
                  <div class="card-actions">
                    <button class="btn ${item.id === state.activeEventId ? "ghost" : "primary"}" data-activate-event="${item.id}" type="button" ${item.id === state.activeEventId ? "disabled" : ""}>Activar</button>
                    <button class="btn danger" data-delete-event="${item.id}" type="button" ${state.events.length === 1 ? "disabled" : ""}>Borrar</button>
                  </div>
                </article>
              `,
            )
            .join("")}
        </div>
      </section>
    </section>
  `;
}

function bindEvents() {
  byId("loginForm")?.addEventListener("submit", handleLogin);
  byId("logoutBtn")?.addEventListener("click", handleLogout);

  document.querySelectorAll("[data-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeTab = button.dataset.tab;
      saveState();
      render();
    });
  });

  byId("dniSearch")?.addEventListener("input", updateSearchResults);
  byId("nameSearch")?.addEventListener("input", updateSearchResults);
  byId("entryFirstNameSearch")?.addEventListener("input", updateEntrySearch);
  byId("entryLastNameSearch")?.addEventListener("input", updateEntrySearch);
  byId("entryDniSearch")?.addEventListener("input", updateEntrySearch);
  byId("attendeeForm")?.addEventListener("submit", handleAttendeeSave);
  byId("userForm")?.addEventListener("submit", handleUserSave);
  byId("eventForm")?.addEventListener("submit", handleEventSave);
  byId("adminCategoryFilter")?.addEventListener("change", updateAdminFilters);
  byId("adminSourceFilter")?.addEventListener("change", updateAdminFilters);
  byId("adminCreatedDateFilter")?.addEventListener("change", updateAdminFilters);
  byId("reportEventFilter")?.addEventListener("change", updateReportFilter);
  byId("downloadCheckinsBtn")?.addEventListener("click", downloadCheckinsCsv);
  byId("compareListBtn")?.addEventListener("click", compareList);
  byId("downloadMissingBtn")?.addEventListener("click", downloadMissingCsv);
  byId("compareFileInput")?.addEventListener("change", handleCompareFile);
  byId("cancelEditBtn")?.addEventListener("click", () => {
    editingAttendeeId = null;
    render();
  });

  document.querySelectorAll("[data-checkin]").forEach((button) => {
    button.addEventListener("click", () => toggleCheckin(button.dataset.checkin));
  });
  document.querySelectorAll("[data-edit-attendee]").forEach((button) => {
    button.addEventListener("click", () => {
      editingAttendeeId = button.dataset.editAttendee;
      render();
    });
  });
  document.querySelectorAll("[data-delete-attendee]").forEach((button) => {
    button.addEventListener("click", () => deleteAttendee(button.dataset.deleteAttendee));
  });
  document.querySelectorAll("[data-delete-user]").forEach((button) => {
    button.addEventListener("click", () => deleteUser(button.dataset.deleteUser));
  });
  document.querySelectorAll("[data-delete-event]").forEach((button) => {
    button.addEventListener("click", () => deleteEvent(button.dataset.deleteEvent));
  });
  document.querySelectorAll("[data-activate-event]").forEach((button) => {
    button.addEventListener("click", () => activateEvent(button.dataset.activateEvent));
  });
  document.querySelectorAll("[data-clear-active-event]").forEach((button) => {
    button.addEventListener("click", () => activateEvent(""));
  });
  document.querySelectorAll("[data-entry-field]").forEach((input) => {
    input.addEventListener("change", () => updateEntryField(input.dataset.entryId, input.dataset.entryField, input.checked));
  });
  document.querySelectorAll("[data-ticket-status]").forEach((select) => {
    select.addEventListener("change", () => updateEntryField(select.dataset.ticketStatus, "ticketStatus", select.value));
  });
}

async function saveActiveEventSetting(eventId) {
  await supabaseRequest("/rest/v1/app_settings?on_conflict=key", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ key: "active_event_id", value: eventId || "" }),
  });
}

async function activateEvent(eventId) {
  state.activeEventId = eventId || "";
  saveState();
  if (isCloudUser() && currentUser()?.role === "admin") {
    try {
      await saveActiveEventSetting(state.activeEventId);
      await tryCloudSync();
    } catch (error) {
      console.warn(error);
      showToast("No se pudo actualizar el evento activo en Supabase.");
    }
  }
  render();
  showToast(state.activeEventId ? "Evento activado para voluntarios." : "Evento desactivado.");
}

function updateAdminFilters() {
  state.adminFilters.category = byId("adminCategoryFilter")?.value || "";
  state.adminFilters.source = byId("adminSourceFilter")?.value || "";
  state.adminFilters.createdDate = byId("adminCreatedDateFilter")?.value || "";
  saveState();
  render();
}

async function handleLogin(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const rawEmail = String(form.get("email") || "").trim();
  const password = String(form.get("password") || "");

  if (!supabaseEnabled) {
    showToast("Supabase no esta configurado.");
    return;
  }

  try {
    const session = await signInWithSupabase(rawEmail, password);
    state.currentUserId = session.user.id;
    await loadCloudData();
    setDefaultTabForUser();
    saveState();
    render();
    showToast("Sesion iniciada con Supabase.");
  } catch (error) {
    cloudReady = false;
    cloudError = "Login Supabase no disponible.";
    saveCloudSession(null);
    state.currentUserId = null;
    saveState();
    console.warn(error);
    showToast("Credenciales incorrectas o usuario no disponible en Supabase.");
  }
}

function handleLogout() {
  state.currentUserId = null;
  cloudReady = false;
  saveCloudSession(null);
  saveState();
  render();
}

function updateSearchResults() {
  state.search.dni = byId("dniSearch").value;
  state.search.name = byId("nameSearch").value;
  saveState();

  byId("results").innerHTML = renderResults(getSearchResults());
  document.querySelectorAll("[data-checkin]").forEach((button) => {
    button.addEventListener("click", () => toggleCheckin(button.dataset.checkin));
  });
}

function updateEntrySearch() {
  state.entrySearch.firstName = byId("entryFirstNameSearch")?.value || "";
  state.entrySearch.lastName = byId("entryLastNameSearch")?.value || "";
  state.entrySearch.dni = byId("entryDniSearch")?.value || "";
  saveState();
  render();
}

function updateReportFilter() {
  state.reports.selectedEventId = byId("reportEventFilter")?.value || "";
  saveState();
  render();
}

async function updateEntryField(attendeeId, field, value) {
  const person = state.attendees.find((item) => item.id === attendeeId);
  if (!person) return;
  person[field] = value;
  saveState();

  const cloudField = {
    rehearsal01: "rehearsal_01",
    rehearsal02: "rehearsal_02",
    ticketStatus: "ticket_status",
  }[field];

  if (isCloudUser() && cloudField) {
    try {
      await supabaseRequest(`/rest/v1/attendees?id=eq.${encodeURIComponent(attendeeId)}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ [cloudField]: value }),
      });
      showToast("Registro actualizado.");
    } catch (error) {
      console.warn(error);
      showToast("No se pudo actualizar en Supabase.");
    }
  }
}

function csvEscape(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function downloadCsv(filename, rows) {
  const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function downloadCheckinsCsv() {
  const rows = getReportRows();
  downloadCsv("registros-checkin.csv", [
    ["Evento", "Fecha evento", "Asistente", "DNI", "Categoria", "Check-in", "Registrado por"],
    ...rows.map((row) => [row.event, row.eventDate, row.attendee, row.dni, row.category, row.checkedAt, row.checkedBy]),
  ]);
}

function parseCompareLines(text) {
  return String(text || "")
    .split(/\r?\n/)
    .map((line) => line.split(/[;,]/).map((part) => part.trim()).filter(Boolean).join(" "))
    .map((line) => line.trim())
    .filter(Boolean);
}

function compareList() {
  const raw = byId("compareListInput")?.value || "";
  const lines = parseCompareLines(raw);
  const attendeesIndex = state.attendees.map((person) => ({
    fullName: normalize(person.fullName),
    dni: normalize(person.dni).replace(/\s/g, ""),
  }));

  state.reports.compareRaw = raw;
  state.reports.missingNames = lines.filter((line) => {
    const normalized = normalize(line);
    const dni = normalized.replace(/\s/g, "");
    return !attendeesIndex.some((person) => person.fullName.includes(normalized) || normalized.includes(person.fullName) || (dni && person.dni === dni));
  });
  saveState();
  render();
  showToast(`${state.reports.missingNames.length} nombres no encontrados.`);
}

function downloadMissingCsv() {
  downloadCsv("nombres-no-encontrados.csv", [["Nombre o DNI"], ...state.reports.missingNames.map((name) => [name])]);
}

function handleCompareFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    state.reports.compareRaw = String(reader.result || "");
    saveState();
    render();
    showToast("Lista cargada. Pulsa comparar para buscar ausentes.");
  };
  reader.readAsText(file);
}

async function toggleCheckin(attendeeId) {
  const person = state.attendees.find((item) => item.id === attendeeId);
  if (!person) return;
  const event = activeEvent();
  if (!event) {
    showToast("No hay evento activo.");
    return;
  }
  if (person.checkins[event.id]) {
    delete person.checkins[event.id];
    if (isCloudUser()) {
      try {
        await supabaseRequest(`/rest/v1/checkins?attendee_id=eq.${encodeURIComponent(person.id)}&event_id=eq.${encodeURIComponent(event.id)}`, {
          method: "DELETE",
          headers: { Prefer: "return=minimal" },
        });
      } catch (error) {
        console.warn(error);
        showToast("No se pudo desmarcar en Supabase.");
      }
    }
    showToast(`${person.fullName} queda pendiente en ${event.name}.`);
  } else {
    person.checkins[event.id] = {
      time: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
      by: currentUser()?.name || "Equipo",
    };
    if (isCloudUser()) {
      try {
        await supabaseRequest("/rest/v1/checkins?on_conflict=attendee_id,event_id", {
          method: "POST",
          headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
          body: JSON.stringify({
            attendee_id: person.id,
            event_id: event.id,
            checked_by: cloudSession.user.id,
          }),
        });
      } catch (error) {
        console.warn(error);
        showToast("No se pudo guardar el check-in en Supabase.");
      }
    }
    showToast(`Check-in realizado: ${person.fullName}.`);
  }
  saveState();
  await tryCloudSync();
  render();
}

async function handleAttendeeSave(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const id = String(form.get("id") || "");
  const payload = {
    dni: String(form.get("dni") || "").trim().toUpperCase(),
    fullName: String(form.get("fullName") || "").trim(),
    category: String(form.get("category") || "Cantante"),
    group: String(form.get("group") || "").trim(),
    email: String(form.get("email") || "").trim(),
    birthDate: String(form.get("birthDate") || ""),
    accreditation: String(form.get("accreditation") || "").trim(),
    phone: String(form.get("phone") || "").trim(),
    notes: String(form.get("notes") || "").trim(),
  };

  if (id) {
    const person = state.attendees.find((item) => item.id === id);
    Object.assign(person, payload);
    if (isCloudUser()) {
      await supabaseRequest(`/rest/v1/attendees?id=eq.${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify(toCloudAttendee(payload)),
      });
    }
    showToast("Ficha actualizada.");
  } else {
    const newAttendee = { id: crypto.randomUUID(), ...payload, source: "manual", createdAt: new Date().toISOString(), checkins: {} };
    state.attendees.unshift(newAttendee);
    if (isCloudUser()) {
      await supabaseRequest("/rest/v1/attendees", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ id: newAttendee.id, ...toCloudAttendee(payload) }),
      });
    }
    showToast("Asistente creado.");
  }
  editingAttendeeId = null;
  saveState();
  await tryCloudSync();
  render();
}

async function deleteAttendee(id) {
  state.attendees = state.attendees.filter((person) => person.id !== id);
  if (isCloudUser()) {
    await supabaseRequest(`/rest/v1/attendees?id=eq.${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { Prefer: "return=minimal" },
    });
  }
  saveState();
  await tryCloudSync();
  render();
  showToast("Asistente eliminado.");
}

function toCloudAttendee(person) {
  const payload = {
    dni: person.dni,
    full_name: person.fullName,
    category: person.category,
    group_name: person.group,
    email: person.email,
    birth_date: person.birthDate || null,
    accreditation: person.accreditation,
    rehearsal_01: Boolean(person.rehearsal01),
    rehearsal_02: Boolean(person.rehearsal02),
    ticket_status: person.ticketStatus || "ACREDITADO",
    phone: person.phone,
    notes: person.notes,
  };
  if (person.source) payload.source = person.source;
  return payload;
}

async function handleUserSave(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const email = String(form.get("email") || "").trim();
  const role = String(form.get("role") || "volunteer");
  const payload = {
    name: String(form.get("name") || "").trim(),
    email,
    password: String(form.get("password") || ""),
    role: ["admin", "supervisor", "volunteer"].includes(role) ? role : "volunteer",
  };

  if (currentUser()?.role !== "admin") {
    showToast("Solo un administrador puede crear usuarios.");
    return;
  }

  if (state.users.some((user) => normalize(user.email) === normalize(email))) {
    showToast("Ya existe un usuario con ese email.");
    return;
  }

  if (isCloudUser()) {
    await createCloudUser(payload);
    return;
  }

  showToast("No se puede crear usuario sin conexion a Supabase.");
}

async function createCloudUser(payload) {
  try {
    const result = await supabaseRequest("/functions/v1/create-user", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    state.users.push({
      id: result.user.id,
      name: result.profile.full_name,
      email: result.profile.email,
      password: "",
      role: result.profile.role,
    });
    saveState();
    await tryCloudSync();
    render();
    showToast("Usuario creado en Supabase.");
  } catch (error) {
    console.warn(error);
    showToast("No se pudo crear el usuario en Supabase. Revisa la Edge Function.");
  }
}

function deleteUser(id) {
  state.users = state.users.filter((user) => user.id !== id);
  saveState();
  render();
  showToast("Usuario eliminado.");
}

async function handleEventSave(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const newEvent = {
    id: crypto.randomUUID(),
    name: String(form.get("name") || "").trim(),
    date: String(form.get("date") || ""),
    location: String(form.get("location") || "").trim(),
  };
  state.events.push(newEvent);
  if (isCloudUser()) {
    await supabaseRequest("/rest/v1/events", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        id: newEvent.id,
        name: newEvent.name,
        event_date: newEvent.date,
        location: newEvent.location,
      }),
    });
  }
  saveState();
  await tryCloudSync();
  render();
  showToast("Evento creado.");
}

async function deleteEvent(id) {
  if (state.events.length === 1) return;
  state.events = state.events.filter((event) => event.id !== id);
  state.attendees.forEach((person) => delete person.checkins[id]);
  if (state.activeEventId === id) {
    state.activeEventId = "";
    if (isCloudUser()) await saveActiveEventSetting("");
  }
  if (isCloudUser()) {
    await supabaseRequest(`/rest/v1/events?id=eq.${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { Prefer: "return=minimal" },
    });
  }
  saveState();
  await tryCloudSync();
  render();
  showToast("Evento eliminado.");
}

async function initApp() {
  if (cloudSession?.access_token) {
    state.currentUserId = cloudSession.user.id;
    await tryCloudSync();
    setDefaultTabForUser();
  } else {
    state.currentUserId = null;
    cloudReady = false;
    saveState();
  }
  render();
}

initApp();
