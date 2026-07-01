/* ============================================================
   Praessia — quiz/engine.js
   Algoritmo de afinidad: calcula qué fragancia y qué presencia
   corresponden a las respuestas del usuario.
   Usado por: test.html (a través de quiz/render-quiz.js)
   Depende de: data-perfumes.js, data-quiz.js
   ============================================================ */

/* Lista canónica de los 8 tipos de presencia */
const personalities = [
  "fresco_vital",
  "libre_natural",
  "elegante_clasico",
  "esencial_moderno",
  "sensual_profundo",
  "calido_envolvente",
  "audaz_magnetico",
  "creativo_alternativo"
];

/* Estado global del usuario (solo género, los scores se calculan en runQuiz) */
let userPreferences = {
  gender: null
};

/* ── Funciones del algoritmo ────────────────────────────────── */

/**
 * Calcula el índice de afinidad entre los scores del usuario
 * y un perfume específico.
 * El tipo dominante del usuario recibe un bonus multiplicador (x3).
 */
function calculateAffinity(userScores, perfume) {
  let total = 0;

  for (const personality in userScores) {
    const userValue = userScores[personality] || 0;
    const perfumeValue = perfume.personalities?.[personality] || 0;
    total += userValue * perfumeValue;
  }

  const dominant = Object.keys(userScores).reduce((a, b) =>
    userScores[a] > userScores[b] ? a : b
  );

  if (perfume.personalities?.[dominant]) {
    total += perfume.personalities[dominant] * 3;
  }

  return total;
}

/**
 * Normaliza los scores a porcentajes (suma total = 100%).
 */
function normalizeScores(scores) {
  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  const normalized = {};

  for (const key in scores) {
    normalized[key] = total > 0
      ? Math.round((scores[key] / total) * 100)
      : 0;
  }

  return normalized;
}

/**
 * Devuelve los 2 tipos de presencia con mayor puntaje.
 */
function getTopPresences(scores) {
  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2);
}

/**
 * Filtra el catálogo por género/unisex, calcula afinidad
 * para cada fragancia y devuelve el array ordenado de mayor
 * a menor afinidad.
 */
function getRecommendedPerfumes(userScores, gender) {
  return perfumes
    .filter(p => p.gender === gender || p.gender === "unisex")
    .map(p => ({
      ...p,
      affinity: calculateAffinity(userScores, p)
    }))
    .sort((a, b) => b.affinity - a.affinity);
}
