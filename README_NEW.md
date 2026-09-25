# Bibliothèque du Quartier

Application web de gestion d'une bibliothèque municipale. Elle permet de gérer les livres, les auteurs, les adhérents, les comptes utilisateurs et les emprunts, avec un tableau de bord et une authentification sécurisée par JWT.

Le projet est structuré en deux parties :
- un backend Node.js / Express
- un frontend HTML / CSS / JavaScript statique
- une base PostgreSQL pour la persistance des données

## Objectif du projet

Créer une application complète de gestion de bibliothèque avec :
- catalogue de livres
- gestion des auteurs
- gestion des utilisateurs et des rôles
- emprunts et retours
- contrôle d'accès selon les permissions
- tableau de bord de statistiques
- interface utilisateur simple et fonctionnelle

## Fonctionnalités

- Authentification JWT avec inscription et connexion
- Rôles : `adherent`, `bibliothecaire`, `superadmin`
- Gestion des auteurs : ajout, modification, suppression
- Gestion des livres : ajout, modification, suppression, disponibilité
- Gestion des emprunts : création, retour, suivi des retards
- Tableau de bord avec KPI et statistiques
- Sécurité des routes selon le rôle
- Notifications utilisateur côté interface

## Stack technique

- Node.js
- Express.js
- PostgreSQL
- JWT
- bcryptjs
- HTML / CSS / JavaScript vanilla

## Prérequis

Avant de lancer le projet, vérifiez que vous avez :
- Node.js 18 ou supérieur
- PostgreSQL installé et démarré
- un accès local à la base PostgreSQL avec le compte `postgres`

## Installation

1. Cloner le projet

```bash
git clone <url-du-depot>
cd library
```

2. Installer les dépendances du backend

```bash
cd backend
npm install
```

3. Configurer le fichier d’environnement

Le projet utilise le fichier `backend/.env`.

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

## Base de données

Dans le dossier `backend`, plusieurs scripts sont disponibles :

```bash
# recréer la base en vidant les tables et en relançant les seeds
npm run db:reset

# créer seulement le schéma
npm run db:migrate

# injecter les données de démonstration
npm run db:seed
```

## Démarrage du projet

Depuis le dossier `backend` :

```bash
npm start
```

Le serveur démarrera sur :

```text
http://localhost:3000
```

## Comptes de démonstration

Le seed fournit des comptes de test génériques :

| Rôle | Email | Mot de passe |
|---|---|---|
| superadmin | `admin@bibliotheque.local` | `GHS` |
| bibliothecaire | `bibliothecaire@bibliotheque.local` | `biblio123` |
| adherent | `adh1@bibliotheque.local` | `adherent123` |

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

## API principales

### Authentification

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Utilisateurs

- `GET /api/users`
- `GET /api/users/:id`
- `POST /api/users`
- `PUT /api/users/:id`
- `DELETE /api/users/:id`

### Auteurs

- `GET /api/auteurs`
- `GET /api/auteurs/:id`
- `POST /api/auteurs`
- `PUT /api/auteurs/:id`
- `DELETE /api/auteurs/:id`

### Livres

- `GET /api/livres`
- `GET /api/livres/:id`
- `POST /api/livres`
- `PUT /api/livres/:id`
- `DELETE /api/livres/:id`

### Emprunts

- `GET /api/emprunts`
- `POST /api/emprunts`
- `PUT /api/emprunts/:id/retour`

### Statistiques

- `GET /api/stats`
- `GET /api/health`

## Modèle de données

Les tables principales sont :
- `users`
- `auteurs`
- `livres`
- `emprunts`

Chaque utilisateur possède un rôle :
- `adherent`
- `bibliothecaire`
- `superadmin`

Le système gère aussi les règles métier suivantes :
- un adhérent ne peut emprunter que pour lui-même
- un livre ne peut pas être emprunté s'il est déjà en cours de location
- les retards sont automatiquement détectés
- les livres sont rendus disponibles à l'enregistrement du retour

## Sécurité

Les routes sensibles sont protégées par un middleware JWT et par les rôles utilisateurs.

Les accès sont gérés selon le principe suivant :
- les adhérents peuvent consulter leur profil et leurs emprunts
- les bibliothécaires peuvent gérer les livres, auteurs et adhérents
- le superadmin a l'accès complet à la gestion du système

## Déploiement

Un fichier de déploiement est disponible dans :
- `deploy.md`

Il décrit une configuration de type Docker / Dokploy avec backend et frontend séparés.

## Notes

Ce projet a été conçu pour être fonctionnel, modulaire et facilement extensible. Les données de démonstration sont génériques, et le code a été préparé pour une utilisation locale ou en environnement de test.

## Licence

Ce projet est fourni à titre d'exercice / démonstration.
