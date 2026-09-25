(() => {
  "use strict";
  const { api, showError, esc, currentUser, openModal, closeModal, formError } = window.Biblio;

  const roleLabels = { adherent: "Adhérent", bibliothecaire: "Bibliothécaire", superadmin: "Administrateur général" };

  async function loadUsers() {
    try {
      const data = await api("/api/users?limit=100");
      const list = data.users;
      document.getElementById("users-total").textContent = `${list.length} au total`;
      document.getElementById("users-body").innerHTML = list.length ? list.map((u) => `
        <tr>
          <td>${esc(u.nom)}</td>
          <td style="color:var(--muted)">${esc(u.email)}</td>
          <td>${roleLabels[u.role] || esc(u.role)}</td>
          <td style="white-space:nowrap;">
            <button class="btn small" data-edit-user="${u.id}">Modifier</button>
            <button class="btn small danger" data-del-user="${u.id}" ${currentUser && currentUser.id === u.id ? "disabled title=\"Impossible de supprimer son propre compte\"" : ""}>Supprimer</button>
          </td>
        </tr>`).join("") : `<tr class="empty-row"><td colspan="4">Aucun utilisateur.</td></tr>`;
    } catch (e) { showError(e.message); }
  }

  /* ---------- Formulaires ---------- */
  const roleOptions = (selected = "") => `
    <option value="bibliothecaire" ${selected === "bibliothecaire" ? "selected" : ""}>Bibliothécaire</option>
    <option value="superadmin" ${selected === "superadmin" ? "selected" : ""}>Administrateur général</option>
    <option value="adherent" ${selected === "adherent" ? "selected" : ""}>Adhérent</option>
  `;

  document.getElementById("btn-add-user").addEventListener("click", () => {
    openModal("Ajouter un utilisateur", `
      <div class="alert danger" hidden></div>
      <label>Nom<input class="field" id="f-us-nom" placeholder="Ex. Jean Marc"></label>
      <label>Email<input class="field" id="f-us-email" type="email" placeholder="Ex. jean@biblio.fr"></label>
      <label>Mot de passe<input class="field" id="f-us-pwd" type="password" placeholder="Min. 6 caractères"></label>
      <label>Rôle<select class="field" id="f-us-role">${roleOptions()}</select></label>
      <button class="btn accent" id="f-us-save">Enregistrer</button>
    `);
    document.getElementById("f-us-save").addEventListener("click", async () => {
      try {
        const nom = document.getElementById("f-us-nom").value.trim();
        const email = document.getElementById("f-us-email").value.trim();
        const password = document.getElementById("f-us-pwd").value;
        const role = document.getElementById("f-us-role").value;
        if (!nom) return formError("Le nom est obligatoire.");
        if (!email || !email.includes("@")) return formError("Email invalide.");
        if (!password || password.length < 6) return formError("Mot de passe requis (min. 6 caractères).");
        await api("/api/users", { method: "POST", body: JSON.stringify({ nom, email, password, role }) });
        toast("Enregistré !"); closeModal();
        loadUsers();
      } catch (e) { formError(e.message); }
    });
  });

  document.getElementById("users-body").addEventListener("click", async (e) => {
    const editBtn = e.target.closest("[data-edit-user]");
    const delBtn = e.target.closest("[data-del-user]");
    if (editBtn) {
      try {
        const u = await api(`/api/users/${editBtn.dataset.editUser}`);
        openModal("Modifier un utilisateur", `
          <div class="alert danger" hidden></div>
          <label>Nom<input class="field" id="f-us-nom" value="${esc(u.nom)}"></label>
          <label>Email<input class="field" id="f-us-email" type="email" value="${esc(u.email)}"></label>
          <label>Mot de passe (laisser vide pour ne pas changer)<input class="field" id="f-us-pwd" type="password" placeholder="••••••••"></label>
          <label>Rôle<select class="field" id="f-us-role">${roleOptions(u.role)}</select></label>
          <button class="btn accent" id="f-us-save">Enregistrer</button>
        `);
        document.getElementById("f-us-save").addEventListener("click", async () => {
          try {
            const nom = document.getElementById("f-us-nom").value.trim();
            const email = document.getElementById("f-us-email").value.trim();
            const password = document.getElementById("f-us-pwd").value || undefined;
            const role = document.getElementById("f-us-role").value;
            if (!nom) return formError("Le nom est obligatoire.");
            await api(`/api/users/${u.id}`, { method: "PUT", body: JSON.stringify({ nom, email, password, role }) });
            toast("Enregistré !"); closeModal();
            loadUsers();
          } catch (err) { formError(err.message); }
        });
      } catch (err) { showError(err.message); }
    }
    if (delBtn) {
      if (delBtn.disabled) return;
      if (!confirm("Supprimer cet utilisateur ?")) return;
      try {
        await api(`/api/users/${delBtn.dataset.delUser}`, { method: "DELETE" });
        loadUsers();
      } catch (err) { showError(err.message); }
    }
  });

  loadUsers();
})();