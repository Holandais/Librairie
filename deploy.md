# Déploiement sur Dokploy

Cette application se déploie comme **deux applications Dokploy séparées**
(frontend, backend), toutes deux construites depuis ce même dépôt Git via
leur propre `Dockerfile`, plus **un service PostgreSQL** géré par Dokploy
(il n'y a pas de conteneur Postgres dans ce dépôt).

Le frontend est **statique** (HTML/CSS/JS, servis par nginx), il n'y a pas
d'étape de build. Il n'y a pas de backoffice distinct — la gestion des
comptes se fait dans `utilisateurs.html` et n'est accessible qu'aux
superadmins (gardé côté backend par `requireRole`).

```
                    ┌──────────────────────┐
   navigateur  ───▶ │  frontend (nginx)    │  port 3000
                    └──────────┬───────────┘
                               │ APP_API_URL (HTTPS) + CORS
                               ▼
                    ┌──────────────────────┐
                    │  backend (Express)   │  port 4000
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │  PostgreSQL (Dokploy) │
                    └──────────────────────┘
```

## Prérequis

- Le dépôt Git poussé sur une plateforme accessible par Dokploy (GitHub,
  GitLab…). Actuellement la branche de travail non fusionnée est
  `feature/auth-jwt-refactor` ; pousser et déployer la branche souhaitée.
- Un service PostgreSQL créé dans Dokploy (**Databases → Create →
  PostgreSQL**), avec ses identifiants notés quelque part.

## 1. Créer la base PostgreSQL

Dans Dokploy : **Databases → Create → PostgreSQL**. Une fois créée, Dokploy
fournit un utilisateur, un mot de passe et un nom de base. Note les valeurs
— ce sont celles de `DB_USER`, `DB_PASSWORD`, `DB_NAME`, plus le **hostname
interne** de Dokploy pour `DB_HOST` (les services communiquent sur le même
réseau Docker, pas besoin d'adresse publique) et le port (5432 par défaut)
pour `DB_PORT`.

## 2. Déployer le backend

Créer une nouvelle **Application** dans Dokploy :

- **Source** : ce dépôt Git, branche `main` (ou `develop` / une branche de
  test)
- **Build type** : Dockerfile
- **Build Path** : `backend` (le backend est autonome, tout est dedans)
- **Dockerfile path** : `backend/Dockerfile`
- **Port** : `4000`
- **Health check path** : `/api/health`

> **Le backend est autonome dans `backend/`** : il possède son propre
> `package.json`+`package-lock.json`, ses deux schémas de production dans
> `backend/db/`, et le `Dockerfile` fait tout son `COPY` depuis son contexte.
> Build Path = `backend` (pas la racine du dépôt). Grâce à ça, le contexte de
> build est exactement le dossier `backend/` — aucun fichier hors du contexte
> n'est nécessaire, ce qui évite les erreurs `"/db": not found` quand le
> contexte est vide. Le frontend utilise lui aussi son dossier `frontend/`
> comme Build Path (étape 3).

**Variables d'environnement** (Environment Settings, pas Build Arguments) :

| Variable        | Requis | Valeur                                                                                       |
| --------------- | ------ | ---------------------------------------------------------------------------------------------- |
| `DB_HOST`       | Oui    | Hostname interne du service PostgreSQL (étape 1)                                              |
| `DB_PORT`       | Oui    | `5432`                                                                                        |
| `DB_USER`       | Oui    | Utilisateur du service PostgreSQL                                                            |
| `DB_PASSWORD`   | Oui    | Mot de passe du service PostgreSQL                                                           |
| `DB_NAME`       | Oui    | Nom de la base du service PostgreSQL                                                         |
| `JWT_SECRET`    | Oui    | Une chaîne aléatoire longue et secrète — jamais la valeur par défaut de développement          |
| `CORS_ORIGIN`   | Oui    | L'URL publique du frontend, **https, sans slash final** — ex. `https://biblio.exemple.com`     |
| `PORT`          | Non    | `4000` (déjà la valeur par défaut du Dockerfile)                                              |
| `SEED_ON_START` | Non    | `false` (défaut). À passer brièvement à `true` pour **réinitialiser la base** et charger le seed de démonstration complet — voir plus bas. ⚠️ détruit les données existantes |

Au démarrage du conteneur, `backend/scripts/start.sh` exécute
`backend/db/schema_prod.sql` — un schéma **idempotent** (comme le sont les
migrations d'un ORM) : les tables sont créées/mises à jour toutes seules au
premier déploiement, rien à faire à la main, et relancer le conteneur ne casse
rien. C'est le **seul** schéma du dépôt (aussi utilisé en local) ; l'ancien
schéma de développement destructif de `db/schema.sql` a été supprimé.

Une fois déployé, attribue un domaine à cette application dans Dokploy (ex.
`api.biblio.exemple.com`) et vérifie `https://<domaine>/api/health` → doit
répondre `{"status":"ok",...}`.

## 3. Déployer le frontend

Créer une deuxième **Application** dans Dokploy (même S3/registre, même dépôt) :

- **Source** : le même dépôt Git, même branche
- **Build type** : Dockerfile
- **Build Path** : `frontend`
- **Dockerfile path** : `frontend/Dockerfile`
- **Port** : `3000`
- **Health check path** : `/index.html`

**Variables d'environnement** (⚠️ pour ce frontend statique, c'est ici dans
"Environment Settings", pas en "Build Arguments" — voir l'encadré) :

| Variable       | Requis | Valeur                                                       |
| -------------- | ------ | -------------------------------------------------------------- |
| `APP_API_URL`  | Non    | L'URL publique du backend, ex. `https://api.biblio.exemple.com` |

> **Pourquoi "Environment Settings" et pas "Build Argument" ?** Pour un
> frontend compilé (ex. Next.js), les variables `NEXT_PUBLIC_*` sont
> importées dans le bundle JS **au moment du build** (`next build`) → Build
> Argument. Ici le frontend est **statique** : le JavaScript est lu par le
> navigateur *au chargement*, pas au build. La variable `APP_API_URL` est
> donc écrite **au démarrage du conteneur**
> (`frontend/docker-entrypoint.d/30-app-config.sh` régénère
> `assets/js/config.js`),
> par le script officiel `/docker-entrypoint.d/` de l'image nginx. Elle doit
> aller dans **Environment Settings**. Un conteneur relancé avec une nouvelle
> valeur relit la nouvelle valeur sans rebuild.
>
> Si `APP_API_URL` est absente **ou vide**, `assets/js/config.js` garde la
> valeur committée `window.APP_API_URL = ""` (même origine) : utile si on veut
> que le frontend appelle `/api` sur son propre domaine (nécessite alors un
> reverse proxy vers le backend — non couvert ici).

Attribue un domaine au frontend (ex. `biblio.exemple.com`), puis retourne
sur l'application **backend** et vérifie que `CORS_ORIGIN` inclut bien ce
domaine exact (avec `https://`, sans slash final, sans autre chemin) — sinon
toutes les requêtes API échoueront en CORS côté navigateur.

## Créer les données de démonstration en production (recette/test)

Le seed complet n'est pas exécuté automatiquement par défaut : `SEED_ON_START`
est là pour le charger **une seule fois**, sur un environnement de test/recette
uniquement (jamais sur une prod avec des données réelles).

> ⚠️ **`SEED_ON_START=true` est destructif** : `start.sh` exécute d'abord
> `TRUNCATE emprunts, livres, auteurs, users RESTART IDENTITY CASCADE`, donc
> **toutes les données existantes sont supprimées**, puis charge
> `backend/db/seed_demo.sql`.

1. Déployer le backend avec **`SEED_ON_START=true`** : au démarrage,
   `start.sh` applique le schéma puis vide les tables et charge le jeu de
   démonstration complet :
   - 2 comptes staff : `admin@bibliotheque.local` / `GHS` (superadmin),
     `bibliothecaire@bibliotheque.local` / `biblio123` (bibliothecaire)
   - 12 adhérents de démonstration (mot de passe commun `adherent123`)
   - 14 auteurs et 46 livres de démonstration, avec un historique d'emprunts
     d'environ deux semaines (retournés, en cours, en retard)
2. **Remettre `SEED_ON_START=false`** (ou retirer la variable) et redéployer.
3. **Changer immédiatement les mots de passe du seed** (ils sont publics dans
   ce dépôt) : se connecter avec un compte puis — aucun endpoint de changement
   de mot de passe n'étant exposé — exécuter un `UPDATE users SET password =
   '<hash bcrypt>' WHERE email = '...'` depuis le terminal PostgreSQL de
   Dokploy (hash généré avec `bcryptjs`), ou recréer les comptes via
   `utilisateurs.html` (superadmin) et supprimer ceux du seed.

Pour **seulement créer les 2 comptes staff** sans données de démonstration,
exécuter `backend/db/seed_prod.sql` (idempotent `ON CONFLICT DO NOTHING`)
manuellement depuis le terminal du conteneur :

```sh
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" \
  -d "$DB_NAME" -v ON_ERROR_STOP=1 -f /app/db/seed_prod.sql
```

## Vérification post-déploiement

1. Ouvrir le frontend (`https://biblio.exemple.com`) → la page de connexion
   doit charger.
2. Se connecter avec le compte biblio → le tableau de bord affiche les KPI
   (confirme que `APP_API_URL` pointe bien vers le backend et que
   `CORS_ORIGIN` l'autorise).
3. En tant que superadmin, ouvrir la page Utilisateurs et créer un compte
   bibliothécaire (confirme l'écriture en base).
4. Vérifier `https://api.biblio.exemple.com/api/health` → `{"status":"ok"}`.

## Variables d'environnement — résumé

**Backend**

| Variable        | Requis | Exemple                                    |
| --------------- | ------ | -------------------------------------------- |
| `DB_HOST`       | Oui    | `<nom interne du service dokploy>`         |
| `DB_PORT`       | Oui    | `5432`                                      |
| `DB_USER`       | Oui    | `postgres`                                  |
| `DB_PASSWORD`   | Oui    | un mot de passe fort                        |
| `DB_NAME`       | Oui    | `bibliotheque`                              |
| `JWT_SECRET`    | Oui    | une chaîne aléatoire longue                 |
| `CORS_ORIGIN`   | Oui    | `https://biblio.exemple.com`                |
| `PORT`          | Non    | `4000` (défaut)                             |
| `SEED_ON_START` | Non    | `false` (défaut) — `true` brièvement pour réinitialiser la base et charger le seed de démonstration complet (⚠️ destructif) |

**Frontend**

| Variable      | Requis | Exemple                                  |
| ------------- | ------ | ------------------------------------------ |
| `APP_API_URL` | Non    | `https://api.biblio.exemple.com` (Environment Settings, pas Build Argument) |

## Dépannage

- **Le frontend charge mais aucune donnée ne s'affiche** : ouvrir la console
  navigateur. Une erreur CORS signifie que `CORS_ORIGIN` (backend) ne
  contient pas exactement le domaine du frontend (https://, pas de slash
  final, pas de chemin). Une erreur `Failed to fetch` sur une URL
  `https://biblio.exemple.com/api/...` signifie que `APP_API_URL` du frontend
  n'est pas remplie (le navigateur tape alors sur le même domaine et le
  backend n'y est pas).
- **Erreur de connexion à la base au démarrage du backend** : vérifier que
  `DB_HOST`/`DB_PORT`/`DB_USER`/`DB_PASSWORD`/`DB_NAME` sont corrects et
  utilisent le hostname **interne** Dokploy du service Postgres, et que le
  service Postgres est bien démarré avant le backend.
- **`assets/js/config.js` ne reflète pas `APP_API_URL`** : le script
  `/docker-entrypoint.d/30-app-config.sh` a besoin d'un *restart* du
  conteneur frontend après ajout/modification de la variable (un rebuild n'est
  pas nécessaire, la valeur est lue au démarrage).
- **Le build Docker échoue sur `"/package.json": not found` (souvent suivi de
  `"/backend": not found` et `"/db": not found`, et d'un « transferring
  context: 2B » quasi vide dans le log)** : le **Build Path** du backend n'est
  pas `backend` — il est resté à la racine (`.`) ou ailleurs. Dans un `COPY`,
  le chemin source est résolu par rapport à la racine du **contexte de build**.
  Depuis la v2 du Dockerfile, le backend est **autonome** : Build Path =
  `backend`, Dockerfile path `backend/Dockerfile`, et rien ne manque. Remettre
  Build Path à `backend` puis redéployer (vider le cache de build si les
  erreurs persistent). Le frontend garde Build Path = `frontend`.
- **`/api/health` répond mais la connexion utilisateur échoue en 500** :
  vérifier les logs du conteneur backend — souvent un `JWT_SECRET` vide ou une
  base de données sans schéma (le conteneur backend exécute bien
  `backend/db/schema_prod.sql` à chaque boot si psql est présent dans l'image).

## Tester le build Docker en local (optionnel)

Sans Dokploy, pour vérifier qu'une image se construit correctement :

```bash
docker build -f backend/Dockerfile -t bibliotheque-backend ./backend
docker build -f frontend/Dockerfile -t bibliotheque-frontend ./frontend
```