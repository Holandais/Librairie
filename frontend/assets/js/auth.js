(() => {
  "use strict";
  // Stockage local du token JWT et du profil utilisateur pour la session courante.
  const TOKEN_KEY = "bibliotheque_token";
  const USER_KEY = "bibliotheque_user";
  const API = (window.APP_API_URL || "").replace(/\/+$/, "");

  const form = document.getElementById("login-form");
  const errBox = document.getElementById("login-error");
  const demoBtn = document.getElementById("demo-login-btn");

  function formError(msg) {
    if (!errBox) return;
    errBox.textContent = msg;
    errBox.hidden = false;
  }

  // Préremplit les champs pour faciliter les tests avec le compte de démonstration.
  function fillDemoCredentials() {
    const emailInput = document.getElementById("login-email");
    const passwordInput = document.getElementById("login-password");
    if (emailInput) emailInput.value = "admin@bibliotheque.local";
    if (passwordInput) passwordInput.value = "GHS";
    if (errBox) errBox.hidden = true;
  }

  async function login() {
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;
    if (!email || !email.includes("@")) return formError("Format email invalide.");
    if (!password) return formError("Le mot de passe est obligatoire.");

    if (errBox) errBox.hidden = true;
    try {
      // Requête authentification vers le backend Express.
      const res = await fetch(API + "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `Erreur ${res.status}`);

      localStorage.setItem(TOKEN_KEY, data.data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.data.user));
      location.href = "/index.html";
    } catch (err) {
      formError(err.message);
    }
  }

  if (demoBtn) demoBtn.addEventListener("click", fillDemoCredentials);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    login();
  });
})();