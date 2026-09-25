const pool = require('../db');
const response = require('../utils/response');

exports.getStats = async (req, res) => {
  try {
    const totalLivres = await pool.query('SELECT COUNT(*) FROM livres');
    const totalAdherents = await pool.query("SELECT COUNT(*) FROM users WHERE role = 'adherent'");
    const empruntsEnCours = await pool.query(
      'SELECT COUNT(*) FROM emprunts WHERE date_retour_effective IS NULL'
    );
    const empruntsEnRetard = await pool.query(
      'SELECT COUNT(*) FROM emprunts WHERE date_retour_effective IS NULL AND date_retour_prevue < NOW()'
    );

    const livrePlusEmprunte = await pool.query(
      `SELECT l.titre, COUNT(e.id) AS nombre_emprunts
       FROM livres l
       JOIN emprunts e ON l.id = e.livre_id
       GROUP BY l.id, l.titre
       ORDER BY nombre_emprunts DESC
       LIMIT 1`
    );

    const adherentPlusActif = await pool.query(
      `SELECT u.nom, COUNT(e.id) AS nombre_emprunts
       FROM users u
       JOIN emprunts e ON u.id = e.user_id
       WHERE u.role = 'adherent'
       GROUP BY u.id, u.nom
       ORDER BY nombre_emprunts DESC
       LIMIT 1`
    );

    const dernieresActivites = await pool.query(
      `SELECT e.id, e.date_emprunt, e.date_retour_prevue, e.date_retour_effective,
              l.titre AS livre_titre, u.nom AS user_nom,
              CASE
                WHEN e.date_retour_effective IS NOT NULL THEN 'Rendu'
                WHEN e.date_retour_prevue < NOW() THEN 'En retard'
                ELSE 'En cours'
              END AS statut
       FROM emprunts e
       JOIN livres l ON e.livre_id = l.id
       JOIN users u ON e.user_id = u.id
       ORDER BY e.date_emprunt DESC
       LIMIT 5`
    );

    const alertesRetard = await pool.query(
      `SELECT e.id, l.titre AS livre_titre, u.nom AS user_nom,
              e.date_retour_prevue
       FROM emprunts e
       JOIN livres l ON e.livre_id = l.id
       JOIN users u ON e.user_id = u.id
       WHERE e.date_retour_effective IS NULL AND e.date_retour_prevue < NOW()
       ORDER BY e.date_retour_prevue ASC
       LIMIT 5`
    );

    response.success(res, {
      total_livres: parseInt(totalLivres.rows[0].count),
      total_adherents: parseInt(totalAdherents.rows[0].count),
      emprunts_en_cours: parseInt(empruntsEnCours.rows[0].count),
      emprunts_en_retard: parseInt(empruntsEnRetard.rows[0].count),
      livre_plus_emprunte: livrePlusEmprunte.rows[0] || null,
      adherent_plus_actif: adherentPlusActif.rows[0] || null,
      dernieres_activites: dernieresActivites.rows,
      alertes_retard: alertesRetard.rows,
    }, 'Statistiques de la bibliotheque');
  } catch (err) {
    response.failure(res, err.message, 500);
  }
};