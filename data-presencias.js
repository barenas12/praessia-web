/* ============================================================
   Praessia — quiz/data-presencias.js
   Base de datos de los 8 arquetipos de presencia y detalle
   editorial de cada fragancia del catálogo.
   Usado por: test.html (a través de quiz/render-result.js)
   ============================================================ */

/* ── 8 Arquetipos de presencia ─────────────────────────────── */
const PRESENCIAS_DATA = {
  fresco_vital: {
    nombre: 'Fresca Vital',
    tagline: 'Irradias energía limpia y optimismo. Tu presencia activa lo que toca.',
    placeholder: 'Hay algo en tu forma de llegar que renueva el ambiente. No es esfuerzo: es constitución. Tu vitalidad genuina hace que la gente quiera estar cerca sin saber exactamente por qué. Proyectas movimiento, apertura y una ligereza que en este mundo acelerado resulta extraordinariamente refrescante.',
    contextos: {
      laboral: 'Motor del equipo. Llegas con soluciones donde otros ven obstáculos.',
      social: 'Dinámico y conectivo. Eres el puente entre personas y conversaciones.',
      intimo: 'Ligero y alegre. El disfrute es para ti una filosofía de vida.',
      proyeccion: 'Vitalidad, apertura y una energía que contagia positivamente.'
    }
  },
  libre_natural: {
    nombre: 'Libre Natural',
    tagline: 'Tu autenticidad es tu mayor fortaleza. No te adaptas: te expresas.',
    placeholder: 'Tu presencia no sigue guiones. Tienes una honestidad que resulta refrescante en un mundo donde la mayoría se cuida demasiado. No finges comodidades que no sientes ni entusiasmos que no tienes. Esa coherencia entre lo que piensas y lo que proyectas es extraordinariamente rara, y la gente lo percibe.',
    contextos: {
      laboral: 'Perspectiva diferencial. Ves lo que los demás normalizan.',
      social: 'Auténtico y sin filtros. Las personas saben exactamente quién eres.',
      intimo: 'Profundamente leal. Tus vínculos son genuinos porque no construiste ninguno por conveniencia.',
      proyeccion: 'Autenticidad, libertad y una coherencia que genera confianza inmediata.'
    }
  },
  elegante_clasico: {
    nombre: 'Elegante Clásico',
    tagline: 'Proyectas refinamiento y seguridad a través del detalle y la sobriedad.',
    placeholder: 'Tu presencia se construye desde la coherencia y el control estético. Eliges con criterio, no por impulso. Cada decisión tuya —en lo que vistes, en cómo hablas, en el espacio que habitas— comunica una jerarquía de valores que no necesita explicación. En entornos laborales proyectas liderazgo sin fricción; en lo social, generas respeto sin necesidad de exagerar.',
    contextos: {
      laboral: 'Autoridad silenciosa. Tus ideas son tomadas en serio antes de terminar de hablarlas.',
      social: 'Presencia gravitacional. La gente te observa sin saber exactamente por qué.',
      intimo: 'Selecto y cálido. Quienes llegan a tu círculo saben que ese espacio se ganó.',
      proyeccion: 'Gusto, criterio y permanencia. Lo opuesto a la moda: atemporalidad.'
    }
  },
  esencial_moderno: {
    nombre: 'Esencial Moderno',
    tagline: 'Comunicas propósito y claridad. Tu presencia no adorna, define.',
    placeholder: 'Tienes la rara habilidad de comunicar mucho con poco. En tu caso, la austeridad no es frialdad —es precisión. Eliminas el ruido y lo que queda es contundente. Quienes te conocen saben que detrás de cada decisión tuya hay un argumento sólido y bien pensado.',
    contextos: {
      laboral: 'Eficiencia que inspira. Resuelves antes de que otros terminen de plantear el problema.',
      social: 'Presencia intelectual. Prefieres conversaciones que dejan algo, no las que solo llenan tiempo.',
      intimo: 'Honesto y presente. Lo artificial no tiene lugar en tu mundo.',
      proyeccion: 'Claridad, intención y autenticidad radical.'
    }
  },
  sensual_profundo: {
    nombre: 'Sensual Profundo',
    tagline: 'Generas atracción magnética a través de la profundidad y el misterio.',
    placeholder: 'Hay una intensidad en ti que no se anuncia: se siente. Tu presencia no entra a un cuarto, lo transforma. Eres de los que permanecen en la memoria mucho después de que el encuentro terminó. Esta profundidad es tu firma más poderosa y más difícil de imitar.',
    contextos: {
      laboral: 'Influencia que perdura. Tus ideas no solo se escuchan, se recuerdan.',
      social: 'Enigmático y atractivo. Generas curiosidad sin proponértelo.',
      intimo: 'Intenso y presente al cien por ciento. Nada superficial te interesa.',
      proyeccion: 'Profundidad, misterio y una calidez que solo aparece ante los elegidos.'
    }
  },
  calido_envolvente: {
    nombre: 'Cálido Envolvente',
    tagline: 'Haces sentir bienvenidos. Tu presencia es un lugar seguro.',
    placeholder: 'Tienes el don de hacer que las personas se abran. Hay algo en tu forma de estar que genera confianza sin pedirla. Tu inteligencia emocional es tu superpoder: lees las situaciones, lees a las personas, y respondes desde un lugar de genuina consideración hacia el otro.',
    contextos: {
      laboral: 'El pegamento del equipo. Sostienes el clima humano donde los demás solo ven tareas.',
      social: 'Anfitrión natural. Nadie se siente excluido cuando estás.',
      intimo: 'Profundamente presente. En ti, la gente siente que puede ser como es.',
      proyeccion: 'Calidez, empatía y una generosidad que transforma ambientes.'
    }
  },
  audaz_magnetico: {
    nombre: 'Audaz Magnético',
    tagline: 'Tu energía entra antes que tú. Líderas sin pedirlo.',
    placeholder: 'No pides la atención: sucede. Tienes una confianza natural que no necesita validación externa para existir. Rompes convenciones porque las cuestionas genuinamente, no por rebeldía. Esa autenticidad radical es lo que hace que otros te sigan, incluso cuando no lo propones conscientemente.',
    contextos: {
      laboral: 'Energía que activa equipos. Donde estás, pasan cosas.',
      social: 'El centro sin buscarlo. Tienes la habilidad de hacer que todo el mundo se sienta incluido.',
      intimo: 'Apasionado y generoso. Das con la misma intensidad con que vives.',
      proyeccion: 'Confianza, energía y magnetismo genuino que no se aprende.'
    }
  },
  creativo_alternativo: {
    nombre: 'Creativo Alternativo',
    tagline: 'Ves el mundo diferente. Tu originalidad es tu lenguaje.',
    placeholder: 'Tu mente conecta puntos que otros no ven. Tienes una sensibilidad estética que no es solo gustativa —es conceptual. No te conformas con lo que ya existe: imaginas lo que podría ser. Esa capacidad de ver posibilidades donde otros ven límites es lo que define tu presencia y la hace imposible de olvidar.',
    contextos: {
      laboral: 'La perspectiva que nadie tiene. Tus ideas abren caminos donde no los había.',
      social: 'Fascinante y estimulante. Las conversaciones contigo no se parecen a ninguna otra.',
      intimo: 'Profundamente curioso. Tus relaciones más significativas son las que te retan intelectualmente.',
      proyeccion: 'Originalidad, sensibilidad y una visión que expande lo posible.'
    }
  }
};

/* ── Detalle editorial de fragancias ───────────────────────── */
const PERFUMES_DETAIL = {
  'praessia-01': {
    familia: 'Amaderado especiado · Oriental',
    descripcion: 'Una fragancia construida sobre la audacia y la intensidad controlada. Notas metálicas y especiadas que evolucionan hacia un corazón cálido, creando una presencia que no pasa desapercibida.',
    rationale: 'Sus notas especiadas y el corazón ambar dialogan con esa intensidad tuya que transforma los ambientes. No es solo un aroma: es una declaración de presencia.',
    concentracion: 'Extrait de Parfum',
    presentacion: '100 ml',
    clima: 'Climas templados y fríos',
    ocasion: 'Salidas sociales, eventos',
    notas: {
      salida: 'Menta, mandarina, canela',
      corazon: 'Rosa, pachulí, gengibre',
      fondo: 'Ámbar, vetiver, cedro'
    },
    tags: ['especiado', 'oriental', 'intenso', 'memorable']
  },
  'praessia-02': {
    familia: 'Amaderado especiado · Festivo',
    descripcion: 'Fresco con carácter. Una composición que evoca la confianza y la presencia en espacios exclusivos, equilibrando lo moderno con notas que afirman sin exagerar.',
    rationale: 'La precisión de sus notas amaderadas complementa tu capacidad de proyectar liderazgo sin esfuerzo visible. Discreto pero inconfundible.',
    concentracion: 'Extrait de Parfum',
    presentacion: '100 ml',
    clima: 'Todo clima',
    ocasion: 'Reuniones, vida nocturna',
    notas: {
      salida: 'Mandarina, bergamota',
      corazon: 'Heliotropo, cardamomo',
      fondo: 'Sándalo, almizcle, cedro'
    },
    tags: ['amaderado', 'festivo', 'moderno', 'versátil']
  }
  /* Agrega más fragancias siguiendo esta misma estructura */
};

/* ── Labels de display para las barras de afinidad ─────────── */
const PRESENCIA_LABELS_MAP = {
  fresco_vital: 'Fresca Vital',
  libre_natural: 'Libre Natural',
  elegante_clasico: 'Elegante Clásico',
  esencial_moderno: 'Esencial Moderno',
  sensual_profundo: 'Sensual Profundo',
  calido_envolvente: 'Cálido Envolvente',
  audaz_magnetico: 'Audaz Magnético',
  creativo_alternativo: 'Creativo Alt.'
};

/* Exponer PERFUMES_DETAIL globalmente para el motor de PDF */
window.PERFUMES_DETAIL = PERFUMES_DETAIL;
