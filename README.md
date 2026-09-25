# Kora Librairie

Application de gestion d'une bibliothèque municipale, conçue pour centraliser le catalogue, les utilisateurs, les emprunts et les retards dans une interface simple et professionnelle.

Le projet est structuré autour d'un backend Express en Node.js, d'une base PostgreSQL et d'un frontend statique en HTML/CSS/JavaScript. Il couvre la gestion complète du cycle de vie d'une médiathèque : ajout d'ouvrages, gestion des auteurs, suivi des adhérents, emprunts et tableaux de bord.

## Objectif du projet

Cette application vise à fournir une solution de gestion documentaire et administrative pour une bibliothèque, avec :

- un catalogue de livres et d'auteurs,
- la gestion des profils utilisateurs,
- le suivi des emprunts et des retours,
- la détection des retards,
- un tableau de bord de statistiques,
- une interface web adaptée au besoin d'un service de bibliothèque.

## Fonctionnalités principales

- Authentification JWT avec inscription, connexion et profil utilisateur.
- Gestion des rôles : adhérent, bibliothécaire et Administrateur général.
- CRUD complet pour les auteurs et les livres.
- Gestion des emprunts et des retours avec validation métier.
- Suivi des emprunts en cours et en retard.
- Tableau de bord avec indicateurs clés (livres, adhérents, emprunts actifs, retards).
- Interface utilisateur moderne pour la gestion opérationnelle.
- Sécurité des routes selon le rôle connecté.

## Vérification sur l'API des livres cités

Le projet ne dépend pas d'une API externe pour les livres cités. Le catalogue est géré par l'API interne du projet elle-même, via les endpoints :

- `GET /api/livres`
- `GET /api/livres/:id`
- `POST /api/livres`
- `PUT /api/livres/:id`
- `DELETE /api/livres/:id`

Les données sont stockées en base PostgreSQL, ce qui permet un contrôle complet et une évolutivité plus simple que de dépendre d'un service tiers.

## Stack technique

- Node.js 18+
- Express.js
- PostgreSQL 14+
- JWT
- bcryptjs
- HTML / CSS / JavaScript vanilla

## Prérequis

Avant de lancer le projet, vérifiez que vous avez :

- Node.js installé et accessible depuis le terminal
- PostgreSQL installé et démarré
- un accès local au serveur PostgreSQL avec le compte `postgres`

## Démarrage rapide

1. Cloner le dépôt

```bash
git clone <url-du-depot>
cd library
```

2. Installer les dépendances du backend

```bash
cd backend
npm install
```

3. Configurer l'environnement

Copiez le fichier d'exemple et adaptez les valeurs selon votre environnement local :

```bash
copy .env.example .env
```

Exemple de configuration :

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=bibliotheque
PORT=3000
JWT_SECRET=votre-cle-secrete-tres-longue
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
```

4. Initialiser la base de données

```bash
npm run db:reset
```

Cette commande recrée la base, applique le schéma et charge les données de démonstration.

5. Démarrer le serveur

```bash
npm start
```

Le backend et le frontend statique seront disponibles sur :

```text
http://localhost:3000
```

## Comptes de démonstration

Les données de démonstration du projet incluent plusieurs comptes de test :

| Rôle | Email | Mot de passe |
|---|---|---|
| Administrateur général (`superadmin`) | `admin@bibliotheque.local` | `GHS` |
| Bibliothécaire | `bibliothecaire@bibliotheque.local` | `biblio123` |
| Adhérent | `adh1@bibliotheque.local` | `adherent123` |

## Structure du projet

```text
library/
├── backend/
│   ├── db/
│   │   ├── schema_prod.sql
│   │   ├── seed_demo.sql
│   │   └── seed_prod.sql
│   ├── controllers/
│   ├── middlewares/
│   ├── routes/
│   ├── utils/
│   ├── .env
│   ├── .env.example
│   ├── db.js
│   ├── package.json
│   ├── server.js
│   └── ...
├── frontend/
│   ├── assets/
│   ├── pages/
│   ├── index.html
│   └── ...
├── deploy.md
├── README.md
└── ...
```

## API du projet

### Authentification

| Méthode | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Créer un compte utilisateur |
| POST | `/api/auth/login` | Connecter un utilisateur |
| GET | `/api/auth/me` | Récupérer le profil connecté |

### Utilisateurs

| Méthode | Route | Description |
|---|---|---|
| GET | `/api/users` | Lister les utilisateurs |
| GET | `/api/users/:id` | Détail d'un utilisateur |
| POST | `/api/users` | Créer un utilisateur |
| PUT | `/api/users/:id` | Modifier un utilisateur |
| DELETE | `/api/users/:id` | Supprimer un utilisateur |

### Auteurs

| Méthode | Route | Description |
|---|---|---|
| GET | `/api/auteurs` | Liste des auteurs |
| GET | `/api/auteurs/:id` | Détail d'un auteur |
| POST | `/api/auteurs` | Ajouter un auteur |
| PUT | `/api/auteurs/:id` | Modifier un auteur |
| DELETE | `/api/auteurs/:id` | Supprimer un auteur |

### Livres

| Méthode | Route | Description |
|---|---|---|
| GET | `/api/livres` | Liste des livres avec filtres et pagination |
| GET | `/api/livres/:id` | Détail d'un livre |
| POST | `/api/livres` | Ajouter un livre |
| PUT | `/api/livres/:id` | Modifier un livre |
| DELETE | `/api/livres/:id` | Supprimer un livre |

### Emprunts

| Méthode | Route | Description |
|---|---|---|
| GET | `/api/emprunts` | Lister les emprunts |
| POST | `/api/emprunts` | Créer un emprunt |
| PUT | `/api/emprunts/:id/retour` | Enregistrer un retour |

### Santé et statistiques

| Méthode | Route | Description |
|---|---|---|
| GET | `/api/health` | Vérifier la disponibilité du serveur et de la base |
| GET | `/api/stats` | Statistiques globales du système |

## Modèle de données

Le système repose sur 4 tables principales :

- `users`
- `auteurs`
- `livres`
- `emprunts`

Les relations principales sont :

- `livres.auteur_id` → `auteurs.id`
- `emprunts.user_id` → `users.id`
- `emprunts.livre_id` → `livres.id`

Les règles métier couvertes comprennent :

- validation de l'authentification,
- restriction des accès selon le rôle,
- impossibilité d'emprunter un livre déjà en cours,
- contrôle du retour d'un ouvrage,
- détection automatique des retards.

## Sécurité et permissions

Les routes sensibles sont protégées par JWT et par un contrôle de rôle. En pratique :

- les adhérents ont accès à leur profil et à leur historique d'emprunts,
- les bibliothécaires gèrent le catalogue et les adhérents,
- l'Administrateur général dispose des droits complets sur l'application.

## Déploiement

Un guide de déploiement complet est disponible dans le fichier `deploy.md`.

## Licence

Ce projet est fourni à titre d'exercice de développement et de démonstration technique.

| CRUD auteurs | ❌ | ✅ | ✅ |
| CRUD livres | ❌ | ✅ | ✅ |
| Créer/modifier adhérents | ❌ | ✅ | ✅ |
| Lister tous les emprunts | ❌ | ✅ | ✅ |
| Gérer les comptes (rôles) | ❌ | ❌ | ✅ |
| Supprimer un utilisateur | ❌ | ❌ | ✅ |

### Règles métier implémentées

1. Un emprunt est refusé (400) si le livre est déjà marqué `emprunté`.
2. Un adhérent ne peut emprunter que pour lui-même.
3. À la création d'un emprunt, le livre passe automatiquement à `emprunté`.
4. Au retour, `date_retour_effective` est posée et le livre redevient `disponible` ; un second retour est refusé (400).
5. Retard = retour prévu dépassé et livre non rendu.
6. Statistiques calculées en SQL : totaux, `COUNT + GROUP BY + ORDER BY + LIMIT 1` pour le livre le plus emprunté et l'adhérent le plus actif.
7. Requêtes SQL paramétrées (`$1, $2…`) contre les injections ; validation des champs côté middleware + côté interface.
8. Authentification JWT avec token transmis en header `Authorization: Bearer <token>`, vérifié à chaque requête protégée.

## Déploiement (Dokploy)

Le projet se déploie en deux applications Dokploy (frontend nginx + backend
Express) plus un service PostgreSQL géré par Dokploy — voir
[deploy.md](deploy.md) pour la procédure complète, les variables
d'environnement et le dépannage.

## Améliorations futures

- Réservation d'un livre déjà emprunté (file d'attente)
- Pagination côté adhérents/emprunts