/* ============================================================
   Praessia — quiz/render-result.js
   Motor completo del resultado del test:
   Revelación · Interpretación · Recomendación · Elección
   Modal de fragancia, FAB de PDF, descarga PDF una página.
   Usado por: test.html
   Depende de: engine.js, data-presencias.js, data-perfumes.js
   ============================================================ */

/* ── Función principal ──────────────────────────────────────── */

function showPraessiaResult(scores, primaryPerfume, secondaryPerfume) {
  /* 1. Ocultar quiz y footer */
  const quizContainer = document.querySelector('.quiz-container');
  const quizBtn = document.querySelector('[onclick="runQuiz()"]');
  const footer = document.querySelector('.footer-praessia');
  if (quizContainer) quizContainer.style.display = 'none';
  if (quizBtn) quizBtn.style.display = 'none';
  if (footer) footer.style.display = 'none';

  /* 2. Mostrar el bloque de resultado */
  const resultFull = document.getElementById('praessia-result-full');
  if (!resultFull) { console.error('Praessia: #praessia-result-full no encontrado'); return; }
  resultFull.style.display = 'block';

  /* 3. Calcular presencia dominante y secundaria */
  const presenciaKey = Object.keys(scores).reduce((a, b) =>
    scores[a] >= scores[b] ? a : b
  );
  const presencia = PRESENCIAS_DATA[presenciaKey];
  if (!presencia) return;

  const topPresences = getTopPresences(scores);
  const secondaryPresenceKey = topPresences[1]?.[0];
  const secondaryPresence = PRESENCIAS_DATA[secondaryPresenceKey];

  /* 4. Estado global accesible por PDF y demo */
  window._praessiaState = {
    scores,
    presenciaKey,
    presencia,
    secondaryPresence,
    primaryPerfume,
    secondaryPerfume
  };

  /* 5. Renderizar cada sección */
  _renderRevelacion(presenciaKey, presencia, scores);
  _renderInterpretacion(presenciaKey, presencia);
  _renderRecomendacion(primaryPerfume, secondaryPerfume);
  _initScrollReveal();
  _initPDFFab();

  /* 6. Scroll suave — apunta al eyebrow "Tu presencia Praessia"
        con 32px de aire arriba para que quede visible desde el
        primer momento sin quedar pegado al borde              */
  setTimeout(() => {
    const eyebrow = resultFull.querySelector('.revelation-eyebrow');
    const target = eyebrow || resultFull;
    const top = target.getBoundingClientRect().top + window.scrollY - 200;
    window.scrollTo({ top, behavior: 'smooth' });
  }, 150);
}

/* ── REVELACIÓN ─────────────────────────────────────────────── */

function _renderRevelacion(key, presencia, scores) {
  const nameEl = document.getElementById('result-presence-name');
  const taglineEl = document.getElementById('result-presence-tagline');
  if (nameEl) nameEl.textContent = presencia.nombre.toUpperCase();
  if (taglineEl) taglineEl.textContent = presencia.tagline;
  _renderAffinityBars(key, scores);
}

function _renderAffinityBars(dominantKey, scores) {
  const container = document.getElementById('affinity-bars');
  if (!container) return;

  container.innerHTML = '';
  const normalizedScores = normalizeScores(scores);
  const sorted = Object.keys(normalizedScores)
    .sort((a, b) => normalizedScores[b] - normalizedScores[a]);

  sorted.forEach((key, i) => {
    const pct = normalizedScores[key];
    const isPrimary = key === dominantKey;
    const label = PRESENCIA_LABELS_MAP[key] || key;

    const row = document.createElement('div');
    row.className = 'affinity-bar-row' + (isPrimary ? ' is-primary' : '');
    row.innerHTML = `
      <span class="affinity-bar-label">${label}</span>
      <div class="affinity-bar-track">
        <div class="affinity-bar-fill" style="width:0%"></div>
      </div>
      <span class="affinity-bar-pct">${pct}%</span>
    `;
    container.appendChild(row);

    // Animar la barra con retardo escalonado
    setTimeout(() => {
      const fill = row.querySelector('.affinity-bar-fill');
      if (fill) fill.style.width = pct + '%';
    }, 1300 + i * 90);
  });
}

/* ── INTERPRETACIÓN ─────────────────────────────────────────── */

function _renderInterpretacion(key, presencia) {
  const headingName = document.getElementById('interpretation-heading-name');
  if (headingName) headingName.textContent = presencia.nombre.toUpperCase();

  const textEl = document.getElementById('interpretation-ai-text');
  if (textEl) {
    let text = presencia.placeholder;
    if (window._praessiaState?.secondaryPresence) {
      text += ` Además, tienes matices de ${window._praessiaState.secondaryPresence.nombre}, lo que añade una capa más compleja y personal a tu forma de estar en el mundo.`;
    }
    textEl.textContent = text;
  }

  // Contextos situacionales
  const map = {
    'ctx-laboral': presencia.contextos.laboral,
    'ctx-social': presencia.contextos.social,
    'ctx-intimo': presencia.contextos.intimo,
    'ctx-proyeccion': presencia.contextos.proyeccion
  };
  Object.entries(map).forEach(([id, text]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  });

  /* Para activar la interpretación por IA, descomenta esta línea:
     _loadAIText(key, presencia);
  */
}

/* ── IA: Interpretación (lista para conectar) ───────────────── */

async function _loadAIText(presenciaKey, presencia) {
  const textEl = document.getElementById('interpretation-ai-text');
  const loadingEl = document.getElementById('interpretation-loading');
  if (!textEl || !loadingEl) return;

  textEl.style.opacity = '0';
  loadingEl.style.display = 'flex';

  const prompt = `
Eres el narrador de Praessia, perfumería de lujo consciente de Medellín.
Tono: íntimo, preciso, literario pero accesible. Sin clichés.

El usuario descubrió que su presencia es: "${presencia.nombre}".

Escribe 2 párrafos cortos (80 palabras máximo en total) que:
1. Describan cómo se manifiesta esta presencia en su vida cotidiana.
2. Mencionen un matiz o tensión interesante de esta presencia.

Reglas: sin frases motivacionales genéricas, sin mencionar perfumes todavía.
Responde SOLO con el texto, sin encabezados ni comillas.
  `.trim();

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!res.ok) throw new Error('API ' + res.status);
    const data = await res.json();
    const aiText = data.content.filter(b => b.type === 'text').map(b => b.text).join('\n');

    loadingEl.style.display = 'none';
    textEl.textContent = aiText;
    textEl.style.transition = 'opacity 0.6s ease';
    textEl.style.opacity = '1';

    if (window._praessiaState) {
      window._praessiaState.aiText = aiText;
    }
  } catch (err) {
    console.warn('Praessia IA: usando placeholder.', err.message);
    loadingEl.style.display = 'none';
    textEl.style.opacity = '1';
  }
}

/* ── RECOMENDACIÓN ──────────────────────────────────────────── */

function _renderRecomendacion(primary, secondary) {
  _fillPerfumeCard('primary', primary);
  if (secondary) _fillPerfumeCard('secondary', secondary);

  const ctaMain = document.getElementById('cta-main');
  if (ctaMain && primary) {
    ctaMain.href = `tienda.html#${primary.id}`;
  }
}

function _fillPerfumeCard(type, perfume) {
  if (!perfume) return;
  const p = type === 'primary' ? 'primary' : 'secondary';
  const detail = PERFUMES_DETAIL[perfume.id] || {};

  _setText(`${p}-perfume-name`, perfume.name || '—');
  _setText(`${p}-perfume-family`, detail.familia || '—');
  _setText(`${p}-perfume-rationale`, detail.rationale || '');

  const tagsEl = document.getElementById(`${p}-perfume-tags`);
  if (tagsEl && detail.tags) {
    tagsEl.innerHTML = detail.tags
      .map(t => `<span class="perfume-note-tag">${t}</span>`)
      .join('');
  }

  const hasImg = perfume.image && perfume.image !== 'x' && perfume.image !== '';
  const imgEl = document.getElementById(`${p}-perfume-img`);
  const phEl = document.getElementById(`${p}-img-placeholder`);
  if (imgEl) {
    imgEl.style.display = hasImg ? 'block' : 'none';
    if (hasImg) { imgEl.src = perfume.image; imgEl.alt = perfume.name; }
  }
  if (phEl) phEl.style.display = hasImg ? 'none' : 'flex';

  const btnEl = document.getElementById(`btn-${p}-detail`);
  if (btnEl) btnEl.dataset.perfumeId = perfume.id;
}

/* ── MODAL DE FRAGANCIA ─────────────────────────────────────── */

function openPerfumeModal(perfumeId) {
  const perfume = (typeof perfumes !== 'undefined')
    ? perfumes.find(p => p.id === perfumeId)
    : null;
  const detail = PERFUMES_DETAIL[perfumeId] || {};

  _setText('modal-family', detail.familia || '—');
  _setText('modal-name', perfume ? perfume.name : '—');
  _setText('modal-description', detail.descripcion || '—');
  _setText('modal-concentration', detail.concentracion || '—');
  _setText('modal-size', detail.presentacion || '—');
  _setText('modal-climate', detail.clima || '—');
  _setText('modal-occasion', detail.ocasion || '—');
  _setText('modal-notes-top', detail.notas ? detail.notas.salida : '—');
  _setText('modal-notes-heart', detail.notas ? detail.notas.corazon : '—');
  _setText('modal-notes-base', detail.notas ? detail.notas.fondo : '—');

  const ctaEl = document.getElementById('modal-cta-link');
  if (ctaEl) {
    ctaEl.textContent = `Adquirir — $139.900`;
    ctaEl.href = `tienda.html#${perfumeId}`;
  }

  const hasImg = perfume && perfume.image && perfume.image !== 'x' && perfume.image !== '';
  const modalImg = document.getElementById('modal-img');
  const modalPh = document.getElementById('modal-img-placeholder');
  if (modalImg) {
    modalImg.style.display = hasImg ? 'block' : 'none';
    if (hasImg) { modalImg.src = perfume.image; modalImg.alt = perfume.name; }
  }
  if (modalPh) modalPh.style.display = hasImg ? 'none' : 'flex';

  const overlay = document.getElementById('perfume-modal-overlay');
  if (overlay) {
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function closePerfumeModal() {
  const overlay = document.getElementById('perfume-modal-overlay');
  if (overlay) {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }
}

function closePerfumeModalIfOverlay(e) {
  if (e.target === document.getElementById('perfume-modal-overlay')) {
    closePerfumeModal();
  }
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closePerfumeModal();
});

/* ── SCROLL REVEAL ──────────────────────────────────────────── */

function _initScrollReveal() {
  const els = document.querySelectorAll('#praessia-result-full .r-reveal');
  if (!els.length) return;

  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  els.forEach(el => obs.observe(el));
}

/* ── FAB PDF ────────────────────────────────────────────────── */

function _initPDFFab() {
  const fab = document.getElementById('pdf-download-btn');
  const trigger = document.querySelector('.interpretation-section');
  if (!fab || !trigger) return;

  const obs = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      fab.classList.add('visible');
      obs.unobserve(trigger);
    }
  }, { threshold: 0.25 });

  obs.observe(trigger);
}

/* ── DESCARGA PDF (una sola página A4) ──────────────────────── */

function downloadResultPDF() {
  if (typeof html2pdf === 'undefined') {
    alert('Por favor recarga la página e intenta de nuevo.');
    return;
  }

  const state = window._praessiaState;
  if (!state) return;

  const { presencia, aiText, primaryPerfume, secondaryPerfume, scores } = state;
  const txt = aiText || presencia.placeholder;
  const ctx = presencia.contextos;
  const pd = primaryPerfume ? (window.PERFUMES_DETAIL || {})[primaryPerfume.id] || {} : {};
  const sd = secondaryPerfume ? (window.PERFUMES_DETAIL || {})[secondaryPerfume.id] || {} : {};

  const maxScore = Math.max(...Object.values(scores), 1);
  const LABELS = {
    fresco_vital: 'Fresca Vital', libre_natural: 'Libre Natural',
    elegante_clasico: 'Elegante Clásico', esencial_moderno: 'Esencial Moderno',
    sensual_profundo: 'Sensual Profundo', calido_envolvente: 'Cálido Envolvente',
    audaz_magnetico: 'Audaz Magnético', creativo_alternativo: 'Creativo Alt.'
  };
  const topAffinities = Object.keys(scores)
    .sort((a, b) => scores[b] - scores[a])
    .slice(0, 4)
    .map(k => ({
      label: LABELS[k] || k,
      pct: Math.round((scores[k] / maxScore) * 100),
      isPrimary: k === state.presenciaKey
    }));

  const pdfHTML = `
  <div style="font-family:Arial,Helvetica,sans-serif;color:#2a201a;background:#F0E7DA;width:210mm;margin:0;padding:0;box-sizing:border-box;">

    <!-- CABECERA -->
    <div style="background:#1a1a1a;padding:32px 44px 28px;display:flex;justify-content:space-between;align-items:flex-end;">
      <div>
        <div style="font-size:7px;letter-spacing:4px;text-transform:uppercase;color:#bfa76a;margin-bottom:10px;">
          Diagnóstico de Presencia · Praessia
        </div>
        <div style="font-size:34px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#F0E7DA;line-height:1;">
          ${presencia.nombre.toUpperCase()}
        </div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:8px;letter-spacing:2px;text-transform:uppercase;color:rgba(240,231,218,0.3);">praessia.com</div>
      </div>
    </div>

    <!-- TAGLINE -->
    <div style="background:#6a2831;padding:12px 44px;">
      <p style="font-size:11px;color:rgba(240,231,218,0.85);margin:0;letter-spacing:0.04em;font-style:italic;">
        ${presencia.tagline}
      </p>
    </div>

    <!-- CUERPO: 2 columnas -->
    <div style="display:flex;gap:0;padding:28px 44px 24px;background:#F0E7DA;">

      <!-- Columna izquierda -->
      <div style="flex:1.4;padding-right:28px;border-right:1px solid rgba(191,167,106,0.25);">
        <div style="font-size:7px;letter-spacing:3.5px;text-transform:uppercase;color:#6a2831;margin-bottom:10px;">Tu interpretación</div>
        <p style="font-size:11.5px;line-height:1.75;color:#2a201a;margin:0 0 20px;font-weight:300;">${txt}</p>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1px;background:rgba(191,167,106,0.2);border:1px solid rgba(191,167,106,0.2);">
          ${[
      ['Entorno laboral', ctx.laboral],
      ['Entorno social', ctx.social],
      ['Momento íntimo', ctx.intimo],
      ['Lo que proyectas', ctx.proyeccion]
    ].map(([lbl, t]) => `
            <div style="background:#F0E7DA;padding:12px 14px;">
              <div style="font-size:6.5px;letter-spacing:2.5px;text-transform:uppercase;color:#6a2831;margin-bottom:5px;">${lbl}</div>
              <p style="font-size:10.5px;line-height:1.55;color:#2a201a;margin:0;font-weight:300;">${t}</p>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Columna derecha -->
      <div style="flex:1;padding-left:28px;">

        <!-- Mapa de afinidades -->
        <div style="margin-bottom:22px;">
          <div style="font-size:7px;letter-spacing:3.5px;text-transform:uppercase;color:#6a2831;margin-bottom:12px;">Mapa de afinidades</div>
          ${topAffinities.map(a => `
            <div style="margin-bottom:8px;">
              <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
                <span style="font-size:8.5px;letter-spacing:0.08em;text-transform:uppercase;color:${a.isPrimary ? '#6a2831' : '#7a6a5a'};font-weight:${a.isPrimary ? '600' : '300'};">${a.label}</span>
                <span style="font-size:8.5px;color:${a.isPrimary ? '#6a2831' : '#7a6a5a'};font-weight:${a.isPrimary ? '600' : '300'};">${a.pct}%</span>
              </div>
              <div style="height:2px;background:rgba(191,167,106,0.15);border-radius:1px;">
                <div style="height:2px;width:${a.pct}%;background:${a.isPrimary ? '#6a2831' : 'rgba(191,167,106,0.5)'};border-radius:1px;"></div>
              </div>
            </div>
          `).join('')}
        </div>

        <div style="height:1px;background:rgba(191,167,106,0.25);margin-bottom:18px;"></div>

        <!-- Fragancia principal -->
        ${primaryPerfume ? `
        <div style="margin-bottom:14px;display:flex;gap:12px;align-items:flex-start;">
          ${primaryPerfume.image && primaryPerfume.image !== 'x' && primaryPerfume.image !== '' ? `
            <div style="flex:0 0 120px;">
              <img src="${primaryPerfume.image}" alt="${primaryPerfume.name}" style="width:120px;height:auto;border-radius:6px;object-fit:cover;border:1px solid rgba(0,0,0,0.06);">
            </div>
          ` : ''}
          <div style="flex:1;">
            <div style="font-size:6.5px;letter-spacing:2.5px;text-transform:uppercase;color:#6a2831;margin-bottom:6px;">Fragancia principal</div>
            <div style="font-size:13px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;color:#1a1a1a;margin-bottom:2px;">${primaryPerfume.name}</div>
            ${pd.familia ? `<div style="font-size:8px;letter-spacing:1.5px;text-transform:uppercase;color:#7a6a5a;margin-bottom:6px;">${pd.familia}</div>` : ''}
            ${pd.rationale ? `<p style="font-size:9.5px;line-height:1.55;color:#3a2a22;margin:0 0 6px;border-left:2px solid #6a2831;padding-left:8px;font-style:italic;">${pd.rationale}</p>` : ''}
            ${pd.notas ? `<p style="font-size:8px;color:#7a6a5a;margin:0;"><strong style="color:#2a201a;">Notas:</strong> ${pd.notas.salida} · ${pd.notas.corazon} · ${pd.notas.fondo}</p>` : ''}

            <div style="margin-top:8px;background:#fff;padding:10px;border-radius:6px;border:1px solid rgba(0,0,0,0.04);">
              <div style="font-size:9px;font-weight:600;margin-bottom:6px;color:#2a201a;">Ficha técnica</div>
              <div style="display:flex;gap:12px;flex-wrap:wrap;font-size:9px;color:#7a6a5a;">
                <div><strong>Concentración:</strong> ${pd.concentracion || '—'}</div>
                <div><strong>Presentación:</strong> ${pd.presentacion || '—'}</div>
                <div><strong>Clima:</strong> ${pd.clima || '—'}</div>
                <div><strong>Ocasión:</strong> ${pd.ocasion || '—'}</div>
              </div>
            </div>
          </div>
        </div>` : ''}

        <!-- Segunda propuesta -->
        ${secondaryPerfume ? `
        <div style="padding-top:12px;border-top:1px solid rgba(191,167,106,0.2);">
          <div style="display:flex;gap:12px;align-items:flex-start;">
            ${secondaryPerfume.image && secondaryPerfume.image !== 'x' && secondaryPerfume.image !== '' ? `
              <div style="flex:0 0 100px;">
                <img src="${secondaryPerfume.image}" alt="${secondaryPerfume.name}" style="width:100px;height:auto;border-radius:6px;object-fit:cover;border:1px solid rgba(0,0,0,0.06);">
              </div>
            ` : ''}
            <div style="flex:1;">
              <div style="font-size:6.5px;letter-spacing:2.5px;text-transform:uppercase;color:#7a6a5a;margin-bottom:6px;">Segunda propuesta</div>
              <div style="font-size:12px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;color:#1a1a1a;margin-bottom:2px;">${secondaryPerfume.name}</div>
              ${sd.familia ? `<div style="font-size:8px;letter-spacing:1.5px;text-transform:uppercase;color:#7a6a5a;margin-bottom:6px;">${sd.familia}</div>` : ''}
              ${sd.rationale ? `<p style="font-size:9px;line-height:1.5;color:#3a2a22;margin:0 0 6px;border-left:2px solid rgba(106,40,49,0.35);padding-left:8px;font-style:italic;">${sd.rationale}</p>` : ''}
              ${sd.notas ? `<p style="font-size:8px;color:#7a6a5a;margin:0;"><strong style="color:#2a201a;">Notas:</strong> ${sd.notas.salida} · ${sd.notas.corazon} · ${sd.notas.fondo}</p>` : ''}

              <div style="margin-top:8px;background:#fff;padding:10px;border-radius:6px;border:1px solid rgba(0,0,0,0.04);">
                <div style="font-size:9px;font-weight:600;margin-bottom:6px;color:#2a201a;">Ficha técnica</div>
                <div style="display:flex;gap:12px;flex-wrap:wrap;font-size:9px;color:#7a6a5a;">
                  <div><strong>Concentración:</strong> ${sd.concentracion || '—'}</div>
                  <div><strong>Presentación:</strong> ${sd.presentacion || '—'}</div>
                  <div><strong>Clima:</strong> ${sd.clima || '—'}</div>
                  <div><strong>Ocasión:</strong> ${sd.ocasion || '—'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>` : ''}

      </div>
    </div>

    <!-- PIE -->
    <div style="background:#1a1a1a;padding:14px 44px;display:flex;justify-content:space-between;align-items:center;margin-top:auto;">
      <p style="font-size:7px;letter-spacing:3px;text-transform:uppercase;color:rgba(240,231,218,0.25);margin:0;">La esencia de estar presente</p>
      <p style="font-size:7px;letter-spacing:2px;text-transform:uppercase;color:rgba(240,231,218,0.25);margin:0;">praessia.com</p>
    </div>

  </div>`;

  const container = document.createElement('div');
  container.innerHTML = pdfHTML;
  container.style.position = 'absolute';
  container.style.left = '-10000px';
  container.style.top = '0';
  container.style.width = '794px';
  container.style.visibility = 'visible';
  container.style.opacity = '1';
  container.style.zIndex = '-9999';
  document.body.appendChild(container);

  const element = container.firstElementChild;
  if (!element) {
    console.error('PDF: elemento no encontrado');
    document.body.removeChild(container);
    return;
  }
  element.style.minHeight = 'auto';
  element.style.height = 'auto';

  setTimeout(() => {
    const isMobile = /Mobi|Android|iPhone|iPad|iPod/.test(navigator.userAgent);
    const worker = html2pdf()
      .set({
        margin: 0,
        filename: `Praessia_${presencia.nombre.replace(/\s+/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#F0E7DA',
          imageTimeout: 0
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: 'css', avoid: 'div' }
      })
      .from(element);

    if (isMobile) {
      worker.toPdf().output('blob').then(blob => {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        document.body.removeChild(container);
      }).catch(err => {
        console.error('PDF mobile error:', err);
        if (document.body.contains(container)) {
          document.body.removeChild(container);
        }
      });
    } else {
      worker.save()
        .then(() => document.body.removeChild(container))
        .catch(err => {
          console.error('PDF error:', err);
          if (document.body.contains(container)) {
            document.body.removeChild(container);
          }
        });
    }
  }, 100);
}

/* ── Utilidad interna ───────────────────────────────────────── */

function _setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

/* ── Modo demo (desde consola del navegador) ────────────────── */
window.praessiaDemo = function (presenciaKey) {
  const key = presenciaKey || 'elegante_clasico';
  const demo = {
    fresco_vital: 18, libre_natural: 22, elegante_clasico: 88,
    esencial_moderno: 64, sensual_profundo: 46, calido_envolvente: 38,
    audaz_magnetico: 32, creativo_alternativo: 28
  };
  if (demo[key] !== undefined) demo[key] = 100;

  const p1 = (typeof perfumes !== 'undefined') ? perfumes[0] : { id: 'praessia-01', name: 'Demo Nº01', image: '' };
  const p2 = (typeof perfumes !== 'undefined') ? perfumes[1] : { id: 'praessia-02', name: 'Demo Nº02', image: '' };
  showPraessiaResult(demo, p1, p2);
};
