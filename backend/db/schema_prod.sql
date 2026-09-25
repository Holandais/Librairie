-- Schéma idempotent pour la production (exécuté à chaque démarrage du
-- conteneur backend, à la manière des migrations d'un ORM : safe, non
-- destructif, rien à faire à la main).
-- L'équivalent local (db/schema.sql) est destructif (DROP DATABASE) et ne
-- doit JAMAIS être exécuté en production.

SET client_encoding = 'UTF8';

-- pg ne supporte pas CREATE TYPE IF NOT EXISTS : on l'entoure d'un bloc DO.
DO $$
BEGIN
  CREATE TYPE user_role AS ENUM ('adherent', 'bibliothecaire', 'superadmin');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  telephone VARCHAR(20),
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'adherent',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auteurs (
  id SERIAL PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  nationalite VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS livres (
  id SERIAL PRIMARY KEY,
  titre VARCHAR(200) NOT NULL,
  auteur_id INTEGER NOT NULL REFERENCES auteurs(id) ON DELETE CASCADE,
  annee_publication INTEGER,
  disponible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS emprunts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  livre_id INTEGER NOT NULL REFERENCES livres(id) ON DELETE CASCADE,
  date_emprunt TIMESTAMP DEFAULT NOW(),
  date_retour_prevue TIMESTAMP NOT NULL,
  date_retour_effective TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_livres_titre ON livres(titre);
CREATE INDEX IF NOT EXISTS idx_livres_auteur ON livres(auteur_id);
CREATE INDEX IF NOT EXISTS idx_livres_disponible ON livres(disponible);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_emprunts_user ON emprunts(user_id);
CREATE INDEX IF NOT EXISTS idx_emprunts_livre ON emprunts(livre_id);
CREATE INDEX IF NOT EXISTS idx_emprunts_date_retour ON emprunts(date_retour_effective);