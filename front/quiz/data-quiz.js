/* ============================================================
   Praessia — quiz/data-quiz.js
   Las 10 preguntas del test de presencia con sus opciones
   y puntos de personalidad asociados.
   Usado por: test.html (a través de quiz/render-quiz.js)
   ============================================================ */

const quizData = [
  {
    id: "q1",
    question: "¿Cuál de estos outfits describes como completamente tuyo un día sin compromisos?",
    options: {
      A: { text: "Un conjunto bien estructurado y atemporal: pantalón de sastre o vestido a medida.", points: { elegante_clasico: 2, esencial_moderno: 1 } },
      B: { text: "Ropa deportiva liviana, colores frescos, lista para salir a correr o al parque.", points: { fresco_vital: 2, libre_natural: 1 } },
      C: { text: "Total look monocromático, corte limpio, minimalista. Menos es más.", points: { esencial_moderno: 2, elegante_clasico: 1 } },
      D: { text: "Prendas de lino sin planchar, tonos tierra, como si vinieras de un mercado artesanal.", points: { libre_natural: 2, creativo_alternativo: 1 } }
    }
  },
  {
    id: "q2",
    question: "Un sábado por la noche perfecto para ti sería…",
    options: {
      A: { text: "Un concierto underground, una galería de arte o un evento que nadie más conoce.", points: { creativo_alternativo: 2, audaz_magnetico: 1 } },
      B: { text: "Cena íntima a la luz de velas, música suave y conversación sin prisa.", points: { sensual_profundo: 2, calido_envolvente: 1 } },
      C: { text: "Reunión en casa con amigos cercanos, buena comida y risas hasta tarde.", points: { calido_envolvente: 2, libre_natural: 1 } },
      D: { text: "Discoteca o bar de cócteles, conocer gente nueva, ser el centro de atención.", points: { audaz_magnetico: 2, fresco_vital: 1 } }
    }
  },
  {
    id: "q3",
    question: "¿Qué tipo de aroma te atrae más cuando entras a una tienda?",
    options: {
      A: { text: "Ámbar, almizcle o vainilla oscura. Cálido, envolvente, casi magnético.", points: { sensual_profundo: 2, elegante_clasico: 1 } },
      B: { text: "Algo inesperado: cuero ahumado, especias, o una combinación que no sabrías nombrar.", points: { audaz_magnetico: 2, creativo_alternativo: 1 } },
      C: { text: "Cítricos, menta o verbena. Algo que despeje la mente al instante.", points: { fresco_vital: 2, esencial_moderno: 1 } },
      D: { text: "Madera de sándalo, iris o cuero suave. Elegante y atemporal.", points: { elegante_clasico: 2, sensual_profundo: 1 } }
    }
  },
  {
    id: "q4",
    question: "¿Cuál de estas bebidas pedirías sin pensarlo dos veces?",
    options: {
      A: { text: "Café negro espresso, sin azúcar ni leche. Concentrado y preciso.", points: { esencial_moderno: 2, elegante_clasico: 1 } },
      B: { text: "Un cóctel de autor con ingredientes que nunca imaginarías juntos.", points: { creativo_alternativo: 2, audaz_magnetico: 1 } },
      C: { text: "Agua con gas y limón, o un té frío de hierbas recién hecho.", points: { libre_natural: 2, fresco_vital: 1 } },
      D: { text: "Chocolate caliente espeso o un chai especiado con leche.", points: { calido_envolvente: 2, sensual_profundo: 1 } }
    }
  },
  {
    id: "q5",
    question: "¿Cómo describes tu relación con la moda y las tendencias?",
    options: {
      A: { text: "Mi estilo es una expresión personal. Mezclo referencias, épocas y culturas.", points: { creativo_alternativo: 2, libre_natural: 1 } },
      B: { text: "Me arriesgo. Soy el primero o la primera en usar algo nuevo o romper las reglas.", points: { audaz_magnetico: 2, creativo_alternativo: 1 } },
      C: { text: "Me gustan las prendas funcionales, cómodas y de calidad. La comodidad manda.", points: { fresco_vital: 2, calido_envolvente: 1 } },
      D: { text: "Prefiero lo natural y sostenible. Básicos atemporales, nada forzado.", points: { libre_natural: 2, esencial_moderno: 1 } }
    }
  },
  {
    id: "q6",
    question: "Si pudieras decorar tu hogar desde cero, ¿cuál sería tu línea guía?",
    options: {
      A: { text: "Paredes cálidas, colchas de punto, plantas y siempre algo en el horno.", points: { calido_envolvente: 2, libre_natural: 1 } },
      B: { text: "Molduras, muebles de madera oscura, biblioteca del piso al techo y obras de arte.", points: { elegante_clasico: 2, sensual_profundo: 1 } },
      C: { text: "Concreto, acero, piezas de diseño sin adornos. Funcional y preciso.", points: { esencial_moderno: 2, audaz_magnetico: 1 } },
      D: { text: "Telas suaves, velas, perfumadores de ambiente y poca luz. Un espacio íntimo.", points: { sensual_profundo: 2, calido_envolvente: 1 } }
    }
  },
  {
    id: "q7",
    question: "¿Cuál de estas frases diría alguien que te conoce bien?",
    options: {
      A: { text: "«Es eficiente, directo/a y siempre sabe exactamente lo que quiere.»", points: { esencial_moderno: 2, audaz_magnetico: 1 } },
      B: { text: "«Cuando entra a un lugar, se nota. Tiene una presencia que no pasa desapercibida.»", points: { audaz_magnetico: 2, sensual_profundo: 1 } },
      C: { text: "«Tiene energía contagiosa. Con ella/él todo se siente más ligero y divertido.»", points: { fresco_vital: 2, libre_natural: 1 } },
      D: { text: "«La gente se siente bien a su lado. Tiene algo que acoge y reconforta.»", points: { calido_envolvente: 2, fresco_vital: 1 } }
    }
  },
  {
    id: "q8",
    question: "Estás eligiendo un destino para tus próximas vacaciones. ¿Cuál te genera más emoción?",
    options: {
      A: { text: "París, Viena o Roma: museos, arquitectura, gastronomía de alto nivel.", points: { elegante_clasico: 2, esencial_moderno: 1 } },
      B: { text: "Tokio, Berlín o Ciudad de México: escena creativa, arte urbano y cultura underground.", points: { creativo_alternativo: 2, audaz_magnetico: 1 } },
      C: { text: "Marrakech, Bali o Cartagena: especias, rituales, calor y noche vibrante.", points: { sensual_profundo: 2, calido_envolvente: 1 } },
      D: { text: "Senderismo en los Andes, glamping o un retiro de bienestar rodeado de naturaleza.", points: { libre_natural: 2, fresco_vital: 1 } }
    }
  },
  {
    id: "q9",
    question: "¿Qué tipo de música pones cuando estás solo/a y quieres sentirte bien?",
    options: {
      A: { text: "Música clásica, ambient o piano solo. Algo que despeje la mente.", points: { esencial_moderno: 2, elegante_clasico: 1 } },
      B: { text: "Indie pop, bossa nova o algo alegre que te den ganas de bailar solo.", points: { fresco_vital: 2, creativo_alternativo: 1 } },
      C: { text: "Electrónica experimental, post-punk o algo que nadie más pondría.", points: { creativo_alternativo: 2, sensual_profundo: 1 } },
      D: { text: "Jazz tardío, soul o trip-hop. Música que se siente en el cuerpo.", points: { sensual_profundo: 2, calido_envolvente: 1 } }
    }
  },
  {
    id: "q10",
    question: "¿Cuál de estos sabores en un plato te parece el más irresistible?",
    options: {
      A: { text: "Picante inesperado, fermentados o un maridaje que nadie anticiparía.", points: { audaz_magnetico: 2, creativo_alternativo: 1 } },
      B: { text: "Reducción de vino tinto, trufa o queso curado. Sabores complejos y profundos.", points: { elegante_clasico: 2, sensual_profundo: 1 } },
      C: { text: "Hierbas frescas, limón, aceite de oliva. Ingredientes simples y honestos.", points: { libre_natural: 2, fresco_vital: 1 } },
      D: { text: "Guiso casero de larga cocción, especias suaves, algo que te recuerde a casa.", points: { calido_envolvente: 2, libre_natural: 1 } }
    }
  }
];
