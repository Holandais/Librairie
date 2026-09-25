(() => {
  "use strict";
  // Base de l'API : injectée par le conteneur nginx via assets/js/config.js
  // (window.APP_API_URL, voir config.js + docker-entrypoint.d). Vide = même
  // origine (développement local, `npm run dev`).
  const API = (window.APP_API_URL || "").replace(/\/+$/, "");
  const TOKEN_KEY = "bibliotheque_token";
  const USER_KEY = "bibliotheque_user";

  let token = null;
  let currentUser = null;

  try {
    token = localStorage.getItem(TOKEN_KEY);
    currentUser = JSON.parse(localStorage.getItem(USER_KEY) || "null");
  } catch (err) {
    token = null;
    currentUser = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  /* ---------- Garde d'authentification (pages du shell uniquement) ---------- */
  const page = document.body.dataset.page;
  const requiredRole = document.body.dataset.roleRequired;
  if (page) {
    if (!token || !currentUser) {
      location.replace("/pages/login.html");
    } else if (requiredRole && currentUser.role !== requiredRole) {
      location.replace("/index.html");
    }
  }

  const canEdit = () => currentUser && ["bibliothecaire", "superadmin"].includes(currentUser.role);
  const isStaff = () => canEdit();
  const isSuperadmin = () => currentUser && currentUser.role === "superadmin";

  /* ---------- Session / profil / logout ---------- */
  function storeSession(user) {
    currentUser = user;
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
  function logout() {
    token = null;
    currentUser = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    location.href = "/pages/login.html";
  }

  const logoutBtn = document.getElementById("logout");
  if (logoutBtn) logoutBtn.addEventListener("click", logout);

  const userName = document.getElementById("user-name");
  const userRole = document.getElementById("user-role");
  if (userName && currentUser) userName.textContent = currentUser.nom;
  if (userRole && currentUser) userRole.textContent = currentUser.role;

  /* ---------- Navigation (liens) + drawer ---------- */
  const sidebar = document.getElementById("sidebar");
  const backdrop = document.getElementById("backdrop");
  const openDrawer = () => { sidebar && sidebar.classList.add("open"); backdrop && backdrop.classList.add("open"); };
  const closeDrawer = () => { sidebar && sidebar.classList.remove("open"); backdrop && backdrop.classList.remove("open"); };
  const hamburger = document.getElementById("hamburger");
  if (hamburger) hamburger.addEventListener("click", openDrawer);
  if (backdrop) backdrop.addEventListener("click", closeDrawer);

  document.querySelectorAll(`a.nav-item[data-page="${page}"]`).forEach((n) => n.classList.add("active"));

  const navAdherents = document.getElementById("nav-adherents");
  if (navAdherents) navAdherents.hidden = !isStaff();
  const navUsers = document.getElementById("nav-users");
  if (navUsers) navUsers.hidden = !isSuperadmin();

  /* ---------- Modale générique ---------- */
  const modalBackdrop = document.getElementById("modal-backdrop");
  function openModal(t, html) {
    if (!modalBackdrop) return;
    document.getElementById("modal-title").textContent = t;
    document.getElementById("modal-body").innerHTML = html;
    modalBackdrop.classList.add("open");
  }
  function closeModal() {
    if (modalBackdrop) modalBackdrop.classList.remove("open");
  }
  const modalClose = document.getElementById("modal-close");
  if (modalClose) modalClose.addEventListener("click", closeModal);
  if (modalBackdrop) modalBackdrop.addEventListener("click", (e) => { if (e.target === modalBackdrop) closeModal(); });
  function formError(msg) {
    const body = document.getElementById("modal-body");
    if (!body) return;
    let el = body.querySelector(".alert.danger");
    if (!el) {
      el = document.createElement("div");
      el.className = "alert danger";
      body.prepend(el);
    }
    el.textContent = msg;
  }

  /* ---------- Helpers ---------- */
  const errBox = document.getElementById("global-error");
  function showError(msg) {
    if (!errBox) return;
    errBox.textContent = msg;
    errBox.hidden = false;
    setTimeout(() => { errBox.hidden = true; }, 5000);
  }
  async function api(path, options = {}, raw = false) {
    const headers = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(API + path, { headers, ...options });
    if (res.status === 401 && !path.startsWith("/api/auth/login") && !raw) {
      logout();
      throw new Error("Session expirée, reconnectez-vous.");
    }

    const hasBody = res.status !== 204 && res.headers.get("content-type")?.includes("application/json");
    const data = hasBody ? await res.json().catch(() => ({})) : null;
    if (!res.ok) throw new Error(data?.message || `Erreur ${res.status}`);

    return raw ? data : (data ? data.data : null);
  }
  const esc = (s) => String(s ?? "—").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* ---------- Exposition ---------- */
  window.Biblio = { api, esc, showError, logout, storeSession, currentUser, canEdit, isStaff, isSuperadmin, openModal, closeModal, formError };
})();