(() => {
  "use strict";
  const { api, showError, esc } = window.Biblio;

  function renderActivities(items) {
    const list = document.getElementById("recent-activities");
    if (!list) return;
    if (!items || !items.length) {
      list.innerHTML = "<li>Aucune activité récente.</li>";
      return;
    }

    list.innerHTML = items.map((item) => `
      <li>
        <strong>${esc(item.user_nom)}</strong> a emprunté <strong>${esc(item.livre_titre)}</strong>
        <span>${new Date(item.date_emprunt).toLocaleDateString("fr-FR")} · ${esc(item.statut)}</span>
      </li>
    `).join("");
  }

  function renderAlerts(items) {
    const list = document.getElementById("late-alerts");
    if (!list) return;
    if (!items || !items.length) {
      list.innerHTML = "<li>Aucune alerte.</li>";
      return;
    }

    list.innerHTML = items.map((item) => `
      <li>
        <strong>${esc(item.user_nom)}</strong> — <strong>${esc(item.livre_titre)}</strong>
        <span>Retour prévu le ${new Date(item.date_retour_prevue).toLocaleDateString("fr-FR")}</span>
      </li>
    `).join("");
  }

  async function loadDashboard() {
    try {
      const s = await api("/api/stats");
      document.getElementById("kpi-livres").textContent = s.total_livres;
      document.getElementById("kpi-adherents").textContent = s.total_adherents;
      document.getElementById("kpi-encours").textContent = s.emprunts_en_cours;
      document.getElementById("kpi-retard").textContent = s.emprunts_en_retard;
      document.getElementById("top-livre").textContent = s.livre_plus_emprunte
        ? `${s.livre_plus_emprunte.titre} (${s.livre_plus_emprunte.nombre_emprunts} emprunts)` : "Aucune donnée";
      document.getElementById("top-adherent").textContent = s.adherent_plus_actif
        ? `${s.adherent_plus_actif.nom} (${s.adherent_plus_actif.nombre_emprunts} emprunts)` : "Aucune donnée";
      renderActivities(s.dernieres_activites || []);
      renderAlerts(s.alertes_retard || []);
      document.getElementById("dash-updated").textContent = "Mis à jour à " + new Date().toLocaleTimeString("fr-FR");
    } catch (e) { showError(e.message); }
  }

  document.getElementById("dash-refresh").addEventListener("click", loadDashboard);
  loadDashboard();
})();