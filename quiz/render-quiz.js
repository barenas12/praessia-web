/* ============================================================
   Praessia — quiz/render-quiz.js
   Renderiza el formulario del quiz, maneja validación,
   calcula resultados y dispara showPraessiaResult().
   Usado por: test.html
   Depende de: engine.js, data-quiz.js, render-result.js
   ============================================================ */

/* ── Render del formulario ──────────────────────────────────── */

function renderQuiz() {
  const form = document.getElementById("praessia-quiz");
  if (!form) return;

  quizData.forEach((q, i) => {
    const fieldset = document.createElement("fieldset");
    fieldset.innerHTML = `<legend>${i + 1}. ${q.question}</legend>`;

    for (const key in q.options) {
      fieldset.innerHTML += `
        <label>
          <input type="radio" name="${q.id}" value="${key}">
          ${q.options[key].text}
        </label><br>
      `;
    }

    form.appendChild(fieldset);
  });

  // Pregunta de preferencia de género (al final del quiz)
  const genderFieldset = document.createElement("fieldset");
  genderFieldset.innerHTML = `
    <legend>¿Cómo te gustaría que te recomendemos tu fragancia?</legend>
    <label><input type="radio" name="gender" value="femenina"> Femenina</label><br>
    <label><input type="radio" name="gender" value="masculina"> Masculina</label><br>
    <label><input type="radio" name="gender" value="unisex"> Unisex</label>
  `;
  form.appendChild(genderFieldset);
}

/* ── Validación con toast ───────────────────────────────────── */

let _toastTimer = null;

function showValidationToast(missing) {
  const existing = document.querySelector(".praessia-toast-wrapper");
  if (existing) existing.remove();
  if (_toastTimer) clearTimeout(_toastTimer);

  const pillsHTML = missing.map(({ label, fieldsetEl }) =>
    `<span class="praessia-toast-pill" data-target="${fieldsetEl.id}">${label}</span>`
  ).join("");

  const wrapper = document.createElement("div");
  wrapper.className = "praessia-toast-wrapper";
  wrapper.innerHTML = `
    <div class="praessia-validation-toast" role="alert" aria-live="polite">
      <div class="praessia-toast-icon">
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="9" stroke="#b89b6d" stroke-width="1.5"/>
          <line x1="10" y1="5.5" x2="10" y2="11" stroke="#b89b6d" stroke-width="1.5" stroke-linecap="round"/>
          <circle cx="10" cy="13.5" r="0.8" fill="#b89b6d"/>
        </svg>
      </div>
      <div>
        <p class="praessia-toast-title">Antes de continuar…</p>
        <p class="praessia-toast-msg">${missing.length === 1 ? "Hay una pregunta sin responder." : `Hay ${missing.length} preguntas sin responder.`}</p>
        <div class="praessia-toast-pills">${pillsHTML}</div>
      </div>
    </div>
  `;

  document.body.appendChild(wrapper);

  wrapper.querySelectorAll(".praessia-toast-pill").forEach(pill => {
    pill.addEventListener("click", () => {
      const target = document.getElementById(pill.dataset.target);
      if (!target) return;
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      target.classList.add("quiz-error");
      setTimeout(() => target.classList.remove("quiz-error"), 1800);
    });
  });

  _toastTimer = setTimeout(() => {
    const toast = wrapper.querySelector(".praessia-validation-toast");
    if (toast) {
      toast.classList.add("hiding");
      setTimeout(() => wrapper.remove(), 280);
    }
  }, 6000);
}

function validateQuiz() {
  const missing = [];

  quizData.forEach((q, i) => {
    const selected = document.querySelector(`input[name="${q.id}"]:checked`);
    if (!selected) {
      const fieldset = document.querySelector(`input[name="${q.id}"]`)?.closest("fieldset");
      if (fieldset) {
        if (!fieldset.id) fieldset.id = `fieldset-${q.id}`;
        missing.push({ label: `Pregunta ${i + 1}`, fieldsetEl: fieldset });
      }
    }
  });

  const genderSelected = document.querySelector(`input[name="gender"]:checked`);
  if (!genderSelected) {
    const genderFieldset = document.querySelector(`input[name="gender"]`)?.closest("fieldset");
    if (genderFieldset) {
      if (!genderFieldset.id) genderFieldset.id = "fieldset-gender";
      missing.push({ label: "Fragancia", fieldsetEl: genderFieldset });
    }
  }

  if (missing.length > 0) {
    missing[0].fieldsetEl.scrollIntoView({ behavior: "smooth", block: "center" });
    missing[0].fieldsetEl.classList.add("quiz-error");
    setTimeout(() => missing[0].fieldsetEl.classList.remove("quiz-error"), 1800);
    showValidationToast(missing);
    return false;
  }

  return true;
}

/* ── Ejecución del quiz ─────────────────────────────────────── */

function runQuiz() {
  if (!validateQuiz()) return;

  // Inicializar scores en cero
  const scores = {};
  personalities.forEach(p => scores[p] = 0);

  // Acumular puntos según respuestas
  quizData.forEach(q => {
    const selected = document.querySelector(`input[name="${q.id}"]:checked`);
    if (!selected) return;

    const points = q.options[selected.value].points;
    for (const p in points) {
      scores[p] += points[p];
    }
  });

  // Guardar preferencia de género
  const genderSelected = document.querySelector(`input[name="gender"]:checked`);
  userPreferences.gender = genderSelected ? genderSelected.value : "unisex";

  // Obtener recomendaciones ordenadas por afinidad
  const recommendations = getRecommendedPerfumes(scores, userPreferences.gender);
  if (!recommendations.length) return;

  const primary = recommendations[0];
  const secondary = recommendations[1];

  showPraessiaResult(scores, primary, secondary);
}

/* ── Reset del quiz ─────────────────────────────────────────── */

function resetQuiz() {
  // Ocultar resultado
  const resultFull = document.getElementById("praessia-result-full");
  if (resultFull) resultFull.style.display = "none";

  // Restaurar quiz y botón
  const quizContainer = document.querySelector(".quiz-container");
  const quizBtn = document.querySelector('[onclick="runQuiz()"]');
  if (quizContainer) quizContainer.style.display = "";
  if (quizBtn) quizBtn.style.display = "";

  // Restaurar footer
  const footer = document.querySelector(".footer-praessia");
  if (footer) footer.style.display = "";

  // Ocultar FAB de PDF
  const fab = document.getElementById("pdf-download-btn");
  if (fab) fab.classList.remove("visible");

  // Limpiar respuestas y estado
  document.getElementById("praessia-quiz").reset();
  userPreferences.gender = null;

  // Scroll al inicio del quiz
  document.getElementById("praessia-quiz").scrollIntoView({
    behavior: "smooth"
  });
}

/* ── Inicialización ─────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", renderQuiz);
