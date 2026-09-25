-- Comptes d'administration prêts pour la production.
-- Idempotent (ON CONFLICT) et sans \c : peut être lancé plusieurs fois.

-- hash bcrypt de "GHS", "biblio123"
INSERT INTO users (nom, telephone, email, password, role) VALUES
('Admin principal', '01 000 00 00', 'admin@bibliotheque.local', '$2b$10$T3nXbAAeGVOUDrJbr.Arr.5hF0w/pTE1ap/SX.YXqkx9kdeKS1AV.', 'superadmin'),
('Bibliothécaire', '01 000 00 01', 'bibliothecaire@bibliotheque.local', '$2b$10$xRWAcKEANK5GfpuZNsvScenlKraOujuUVl/eu2YTlAfDNl9EQimkq', 'bibliothecaire')
ON CONFLICT (email) DO NOTHING;