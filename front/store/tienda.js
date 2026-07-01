/* ============================================================
   Praessia — js/tienda.js
   Lógica completa de la tienda virtual:
   · Catálogo con filtros y búsqueda por nombre
   · Modal ficha técnica (reutiliza data-presencias.js)
   · Carrito con persistencia en sessionStorage
   · Integración Bold (checkout)
   · EmailJS — recuperación de carrito abandonado
   · Reseñas con moderación via Firebase
   · Detección de llegada desde quiz (#praessia-XX)
   ============================================================ */

'use strict';

/* ── CONFIGURACIÓN ───────────────────────────────────────────── */
const SHOP_CONFIG = {
  price:          139900,             // Precio en COP (sin puntos)
  priceFormatted: '$139.900',
  currency:       'COP',
  boldIntegration: 'TU_INTEGRATION_ID_BOLD', // Reemplazar con tu ID de integración Bold
  emailjsServiceId:  'TU_EMAILJS_SERVICE_ID',
  emailjsTemplateId: 'TU_EMAILJS_TEMPLATE_ID',
  emailjsPublicKey:  'TU_EMAILJS_PUBLIC_KEY',
  abandonedCartDelay: 30 * 60 * 1000   // 30 minutos en ms
};

/* ── ESTADO ──────────────────────────────────────────────────── */
let cart          = [];
let currentFilter = 'all';
let searchQuery   = '';
let selectedStars = 0;
let currentModalId = null;
let abandonedCartTimer = null;
let firebaseReady = false;

/* ── INICIALIZACIÓN ──────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  emailjs.init(SHOP_CONFIG.emailjsPublicKey);
  loadCart();
  renderGrid();
  fillReviewSelect();
  bindEvents();
  checkQuizAnchor();
});

window.addEventListener('firebaseReady', () => {
  firebaseReady = true;
  loadApprovedReviews();
});

/* ─────────────────────────────────────────────────────────────
   CATÁLOGO — Render del grid
───────────────────────────────────────────────────────────── */
function renderGrid() {
  const grid = document.getElementById('shopGrid');
  if (!grid) return;

  const filtered = getFilteredPerfumes();
  updateResultsCount(filtered.length);

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="shop-empty">
        <i class="bi bi-search"></i>
        <p style="font-family:'Heebo'">No encontramos fragancias con ese nombre.<br>
        <span style="font-size:0.85rem">Intenta con otra búsqueda.</span></p>
      </div>`;
    return;
  }

  grid.innerHTML = filtered.map(p => buildProductCard(p)).join('');

  /* Eventos en las tarjetas */
  grid.querySelectorAll('.product-card').forEach(card => {
    const id = card.dataset.id;

    /* Click en la tarjeta → abrir ficha técnica */
    card.addEventListener('click', e => {
      if (e.target.closest('.btn-add-cart')) return;
      openProductModal(id);
    });

    /* Botón añadir carrito */
    card.querySelector('.btn-add-cart')?.addEventListener('click', e => {
      e.stopPropagation();
      addToCart(id);
      feedbackAddBtn(card.querySelector('.btn-add-cart'));
    });
  });
}

function buildProductCard(perfume) {
  const detail  = (typeof PERFUMES_DETAIL !== 'undefined') ? PERFUMES_DETAIL[perfume.id] || {} : {};
  const hasImg  = perfume.image && perfume.image !== 'x' && perfume.image !== '';
  const tags    = detail.tags || [];
  const inCart  = cart.some(i => i.id === perfume.id);

  const genderLabel = {
    masculina: 'Masculina',
    femenina:  'Femenina',
    unisex:    'Unisex'
  }[perfume.gender] || '';

  const isFromQuiz = getQuizHighlightId() === perfume.id;

  return `
  <article
    class="product-card${isFromQuiz ? ' quiz-highlight' : ''}"
    data-id="${perfume.id}"
    data-gender="${perfume.gender}"
    tabindex="0"
    role="button"
    aria-label="Ver ficha de ${perfume.name}"
  >
    <div class="product-img-wrap">
      ${hasImg
        ? `<img class="product-img loaded" src="${perfume.image}" alt="${perfume.name}">`
        : `<div class="product-img-placeholder">
             <i class="bi bi-droplet-half"></i>
             <span>Imagen próximamente</span>
           </div>`
      }
      <span class="product-gender-badge">${genderLabel}</span>
      ${isFromQuiz ? '<span class="quiz-rec-badge">⭐ Tu match</span>' : ''}
      <button class="product-quick-view" aria-label="Ver ficha técnica">
        Ver ficha
      </button>
    </div>

    <div class="product-body">
      <h3 class="product-name">
        ${cleanPerfumeName(perfume.name)}
      </h3>

      <div class="product-footer">
        <div class="product-price">
          ${SHOP_CONFIG.priceFormatted}
          <small>100 ml · EDP</small>
        </div>
        <button
          class="btn-add-cart${inCart ? ' added' : ''}"
          aria-label="Añadir ${perfume.name} al carrito"
        >
          <i class="bi bi-bag-plus"></i>
          ${inCart ? 'En carrito' : 'Añadir'}
        </button>
      </div>
    </div>
  </article>`;
}

/* ── Filtrado y búsqueda ────────────────────────────────────── */
function getFilteredPerfumes() {
  return perfumes.filter(p => {
    const matchGender = currentFilter === 'all' || p.gender === currentFilter;
    const matchSearch = searchQuery === '' ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchGender && matchSearch;
  });
}

function updateResultsCount(n) {
  const el = document.getElementById('resultsCount');
  if (el) el.textContent = `${n} fragancia${n !== 1 ? 's' : ''}`;
}

/* ── Limpieza de nombre para mostrar ───────────────────────── */
function cleanPerfumeName(name) {
  const bare = String(name).replace(/^Inspiración Olfativa:\s*/i, '').trim();
  return `Inspiración olfativa: ${bare}`;
}

/* ─────────────────────────────────────────────────────────────
   MODAL FICHA TÉCNICA
───────────────────────────────────────────────────────────── */
function openProductModal(id) {
  const perfume = perfumes.find(p => p.id === id);
  if (!perfume) return;

  const detail = (typeof PERFUMES_DETAIL !== 'undefined')
    ? PERFUMES_DETAIL[id] || {} : {};

  currentModalId = id;

  /* Imagen */
  const hasImg = perfume.image && perfume.image !== 'x';
  const imgEl  = document.getElementById('modalImg');
  const phEl   = document.getElementById('modalImgPlaceholder');

  if (imgEl && phEl) {
    if (hasImg) {
      imgEl.src = perfume.image;
      imgEl.alt = perfume.name;
      imgEl.classList.add('loaded');
      imgEl.style.display = 'block';
      phEl.style.display  = 'none';
    } else {
      imgEl.style.display = 'none';
      imgEl.classList.remove('loaded');
      phEl.style.display  = 'flex';
    }
  }

  /* Textos */
  setText('modalFamily',        detail.familia        || 'Inspiración olfativa');
  setText('modalTitle',         cleanPerfumeName(perfume.name));
  setText('modalDescription',   detail.descripcion    || 'Fragancia artesanal Praessia.');
  setText('modalConcentration', detail.concentracion  || 'Extrait de Parfum');
  setText('modalSize',          detail.presentacion   || '100 ml');
  setText('modalClimate',       detail.clima          || '—');
  setText('modalOccasion',      detail.ocasion        || '—');
  setText('modalNotesTop',      detail.notas?.salida  || '—');
  setText('modalNotesHeart',    detail.notas?.corazon || '—');
  setText('modalNotesBase',     detail.notas?.fondo   || '—');

  /* Botón carrito del modal */
  const btnModalCart = document.getElementById('btnModalCart');
  if (btnModalCart) {
    const inCart = cart.some(i => i.id === id);
    btnModalCart.innerHTML = inCart
      ? '<i class="bi bi-bag-check"></i> En carrito'
      : '<i class="bi bi-bag-plus"></i> Añadir al carrito';
  }

  /* Abrir overlay */
  document.getElementById('productModal')?.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeProductModal() {
  document.getElementById('productModal')?.classList.remove('open');
  document.body.style.overflow = '';
  currentModalId = null;
}

/* ─────────────────────────────────────────────────────────────
   CARRITO
───────────────────────────────────────────────────────────── */
function addToCart(id) {
  const perfume = perfumes.find(p => p.id === id);
  if (!perfume) return;

  const existing = cart.find(i => i.id === id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      id,
      name:  cleanPerfumeName(perfume.name),
      image: perfume.image,
      price: SHOP_CONFIG.price,
      qty:   1
    });
  }

  saveCart();
  renderCart();
  updateCartBadge();
  showToast(`<i class="bi bi-bag-check me-2"></i>${cleanPerfumeName(perfume.name)} añadido`);

  /* Iniciar timer carrito abandonado */
  resetAbandonedCartTimer();
  syncCardButton(id);

  /* Actualizar botón en el modal si está abierto */
  if (currentModalId === id) {
    const btn = document.getElementById('btnModalCart');
    if (btn) btn.innerHTML = '<i class="bi bi-bag-check"></i> En carrito';
  }
}

function syncCardButton(id) {
  const card = document.querySelector(`.product-card[data-id="${id}"]`);
  if (!card) return;
  const btn = card.querySelector('.btn-add-cart');
  if (!btn) return;
  btn.classList.add('added');
  btn.innerHTML = '<i class="bi bi-bag-check"></i> En carrito';
}

function removeFromCart(id) {
  cart = cart.filter(i => i.id !== id);
  saveCart();
  renderCart();
  updateCartBadge();
  renderGrid(); /* Actualiza botones de las tarjetas */
}

function updateQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty = Math.max(1, item.qty + delta);
  saveCart();
  renderCart();
  updateCartBadge();
}

function renderCart() {
  const container = document.getElementById('cartItems');
  const emptyMsg  = document.getElementById('cartEmptyMsg');
  const totalEl   = document.getElementById('cartTotal');
  const checkoutBtn = document.getElementById('btnCheckout');
  if (!container) return;

  if (cart.length === 0) {
    /* Limpiar items renderizados */
    Array.from(container.children).forEach(child => {
      if (child.id !== 'cartEmptyMsg') child.remove();
    });
    if (emptyMsg) emptyMsg.style.display = 'block';
    if (totalEl) totalEl.textContent = '$0';
    if (checkoutBtn) checkoutBtn.disabled = true;
    return;
  }

  if (emptyMsg) emptyMsg.style.display = 'none';

  /* Renderizar items */
  const existingItems = container.querySelectorAll('.cart-item');
  existingItems.forEach(el => el.remove());

  cart.forEach(item => {
    const hasImg = item.image && item.image !== 'x';
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.dataset.id = item.id;
    div.innerHTML = `
      <div class="cart-item-img">
        ${hasImg
          ? `<img src="${item.image}" alt="${item.name}">`
          : `<i class="bi bi-droplet-half"></i>`
        }
      </div>
      <div class="cart-item-info">
        <p class="cart-item-name">${item.name}</p>
        <p class="cart-item-ref">100 ml · EDP</p>
        <div class="cart-item-qty-row">
          <button class="qty-btn" data-action="dec" aria-label="Reducir cantidad">−</button>
          <span class="qty-val">${item.qty}</span>
          <button class="qty-btn" data-action="inc" aria-label="Aumentar cantidad">+</button>
        </div>
      </div>
      <div style="display:flex; flex-direction:column; align-items:flex-end; gap:8px;">
        <span class="cart-item-price">${formatCOP(item.price * item.qty)}</span>
        <button class="cart-item-remove" aria-label="Eliminar del carrito">
          <i class="bi bi-trash3"></i>
        </button>
      </div>`;

    div.querySelector('[data-action="dec"]').addEventListener('click', () => updateQty(item.id, -1));
    div.querySelector('[data-action="inc"]').addEventListener('click', () => updateQty(item.id, 1));
    div.querySelector('.cart-item-remove').addEventListener('click',  () => removeFromCart(item.id));

    container.appendChild(div);
  });

  /* Total */
  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  if (totalEl) totalEl.textContent = formatCOP(total);
  if (checkoutBtn) checkoutBtn.disabled = false;
}

function updateCartBadge() {
  const badge = document.getElementById('cartBadge');
  if (!badge) return;
  const count = cart.reduce((s, i) => s + i.qty, 0);
  badge.textContent = count;
  badge.classList.toggle('visible', count > 0);
}

function openCart()  {
  document.getElementById('cartDrawer')?.classList.add('open');
  document.getElementById('cartOverlay')?.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  document.getElementById('cartDrawer')?.classList.remove('open');
  document.getElementById('cartOverlay')?.classList.remove('open');
  document.body.style.overflow = '';
}

/* Persistencia */
function saveCart() {
  try { sessionStorage.setItem('praessiaCart', JSON.stringify(cart)); } catch(e) {}
}

function loadCart() {
  try {
    const raw = sessionStorage.getItem('praessiaCart');
    if (raw) { cart = JSON.parse(raw); renderCart(); updateCartBadge(); }
  } catch(e) { cart = []; }
}

/* ─────────────────────────────────────────────────────────────
   CHECKOUT — Bold
───────────────────────────────────────────────────────────── */
function initCheckout() {
  const email = document.getElementById('cartEmail')?.value?.trim() || '';

  if (cart.length === 0) {
    showToast('<i class="bi bi-exclamation-circle me-2"></i>Tu carrito está vacío');
    return;
  }

  /* Guardar email para carrito abandonado */
  if (email) {
    sessionStorage.setItem('praessiaEmail', email);
    cancelAbandonedCartTimer();
  }

  /* ─ Construcción del payload Bold ─
     Documentación: https://docs.bold.co/checkout
     Reemplaza SHOP_CONFIG.boldIntegration con tu Integration ID */

  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const items = cart.map(i => ({
    name:      i.name,
    quantity:  i.qty,
    price:     i.price,
    taxAmount: 0
  }));

  /* Bold Checkout embebido */
  if (typeof BoldCheckout !== 'undefined') {
    const checkout = new BoldCheckout({
      integrationId: SHOP_CONFIG.boldIntegration,
      orderId:       generateOrderId(),
      currency:      SHOP_CONFIG.currency,
      amount:        total,
      description:   `Praessia · ${cart.length} fragancia(s)`,
      customerEmail: email || undefined,
      items,
      redirectionUrl: `${window.location.origin}/tienda.html?status=success`
    });
    checkout.open();
  } else {
    /* Fallback: redirigir a checkout.bold.co con los datos */
    console.warn('Praessia: Bold SDK no cargado. Verifica tu PUBLIC_KEY.');
    showToast('<i class="bi bi-exclamation-triangle me-2"></i>Error al conectar con el sistema de pago. Inténtalo de nuevo.');
  }
}

/* ─────────────────────────────────────────────────────────────
   CARRITO ABANDONADO — EmailJS
───────────────────────────────────────────────────────────── */
function resetAbandonedCartTimer() {
  cancelAbandonedCartTimer();
  if (cart.length === 0) return;
  abandonedCartTimer = setTimeout(sendAbandonedCartEmail, SHOP_CONFIG.abandonedCartDelay);
}

function cancelAbandonedCartTimer() {
  if (abandonedCartTimer) { clearTimeout(abandonedCartTimer); abandonedCartTimer = null; }
}

function sendAbandonedCartEmail() {
  const email = sessionStorage.getItem('praessiaEmail')
    || document.getElementById('cartEmail')?.value?.trim();
  if (!email || cart.length === 0) return;

  const items = cart.map(i => `${i.name} (x${i.qty})`).join(', ');
  const total = formatCOP(cart.reduce((s, i) => s + i.price * i.qty, 0));

  emailjs.send(
    SHOP_CONFIG.emailjsServiceId,
    SHOP_CONFIG.emailjsTemplateId,
    {
      to_email:  email,
      items,
      total,
      shop_url:  window.location.href
    }
  ).catch(err => console.warn('EmailJS error:', err));
}

/* Cancelar timer al cerrar o al hacer checkout */
window.addEventListener('beforeunload', () => {
  sendAbandonedCartEmail();
});

/* ─────────────────────────────────────────────────────────────
   RESEÑAS — Firebase
───────────────────────────────────────────────────────────── */
async function loadApprovedReviews() {
  if (!firebaseReady || !window._praessiaDB) return;
  const { collection, getDocs, query, where } = window._praessiaFirestore;
  const db = window._praessiaDB;

  try {
    const q = query(
      collection(db, 'reviews'),
      where('status', '==', 'approved')
    );
    const snap = await getDocs(q);
    const reviews = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    renderReviews(reviews);
  } catch(e) {
    console.warn('Praessia reviews:', e);
    renderReviews([]);
  }
}

function renderReviews(reviews) {
  const grid = document.getElementById('reviewsGrid');
  if (!grid) return;

  if (reviews.length === 0) {
    grid.innerHTML = `
      <div class="carousel-item active">
        <div style="text-align:center; padding:80px 40px; color:var(--shop-muted);">
          <i class="bi bi-chat-heart" style="font-size:2rem; opacity:0.3; display:block; margin-bottom:10px;"></i>
          <span style="font-family:'Heebo'; font-size:0.9rem;">Sé el primero en dejar una reseña</span>
        </div>
      </div>`;
    return;
  }

  grid.innerHTML = reviews.map((r, idx) => `
    <div class="carousel-item${idx === 0 ? ' active' : ''}">
      <div class="review-carousel-wrapper">
        <div class="review-card">
          <div class="review-stars">${'★'.repeat(r.stars)}${'☆'.repeat(5 - r.stars)}</div>
          <p class="review-text">"${escapeHtml(r.text)}"</p>
          <p class="review-author">${escapeHtml(r.name)}</p>
          ${r.perfume ? `<p class="review-perfume">${escapeHtml(r.perfume)}</p>` : ''}
        </div>
      </div>
    </div>`
  ).join('');
}

async function submitReview(e) {
  e.preventDefault();

  const name    = document.getElementById('reviewName')?.value?.trim();
  const perfume = document.getElementById('reviewPerfume')?.value;
  const stars   = parseInt(document.getElementById('reviewStars')?.value || '0');
  const text    = document.getElementById('reviewText')?.value?.trim();

  if (!name || !perfume || stars < 1 || !text) {
    showToast('<i class="bi bi-exclamation-circle me-2"></i>Por favor completa todos los campos');
    return;
  }

  if (!firebaseReady || !window._praessiaDB) {
    showToast('<i class="bi bi-wifi-off me-2"></i>Sin conexión. Inténtalo más tarde.');
    return;
  }

  const { collection, addDoc, serverTimestamp } = window._praessiaFirestore;
  const db = window._praessiaDB;

  try {
    await addDoc(collection(db, 'reviews'), {
      name,
      perfume,
      stars,
      text,
      status:    'pending',
      createdAt: serverTimestamp()
    });

    /* Mostrar confirmación */
    document.getElementById('reviewForm').style.display = 'none';
    document.getElementById('reviewSuccessMsg').style.display = 'block';

  } catch(err) {
    console.error('Error al enviar reseña:', err);
    showToast('<i class="bi bi-exclamation-triangle me-2"></i>Error al enviar. Inténtalo de nuevo.');
  }
}

/* Llenar select de perfumes en el form de reseña */
function fillReviewSelect() {
  const sel = document.getElementById('reviewPerfume');
  if (!sel || typeof perfumes === 'undefined') return;
  perfumes.forEach(p => {
    const opt = document.createElement('option');
    opt.value = cleanPerfumeName(p.name);
    opt.textContent = cleanPerfumeName(p.name);
    sel.appendChild(opt);
  });
}

/* ─────────────────────────────────────────────────────────────
   QUIZ ANCHOR — Detectar llegada desde el test
───────────────────────────────────────────────────────────── */
function checkQuizAnchor() {
  const hash = window.location.hash?.replace('#', '');
  if (!hash || !hash.startsWith('praessia-')) return;

  /* Scroll suave al producto */
  setTimeout(() => {
    const card = document.querySelector(`[data-id="${hash}"]`);
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      /* Abrir modal automáticamente con leve delay */
      setTimeout(() => openProductModal(hash), 600);
    }
  }, 400);
}

function getQuizHighlightId() {
  const hash = window.location.hash?.replace('#', '');
  return (hash && hash.startsWith('praessia-')) ? hash : null;
}

/* ─────────────────────────────────────────────────────────────
   EVENTOS
───────────────────────────────────────────────────────────── */
function bindEvents() {

  /* Búsqueda */
  document.getElementById('shopSearch')?.addEventListener('input', e => {
    searchQuery = e.target.value;
    renderGrid();
  });

  /* Filtros género */
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderGrid();
    });
  });

  /* Modal — cerrar */
  document.getElementById('modalClose')?.addEventListener('click', closeProductModal);
  document.getElementById('productModal')?.addEventListener('click', e => {
    if (e.target.id === 'productModal') closeProductModal();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeProductModal(); closeCart(); }
  });

  /* Modal — añadir al carrito */
  document.getElementById('btnModalCart')?.addEventListener('click', () => {
    if (currentModalId) {
      addToCart(currentModalId);
      closeProductModal();
      openCart();
    }
  });

  const searchWrap = document.querySelector('.shop-search-wrap');
  const toolbarInner = document.querySelector('.shop-toolbar-inner');
  const searchInput = document.getElementById('shopSearch');
  const searchClose = searchWrap?.querySelector('.search-close');

  const isMobileSearch = () => window.innerWidth <= 768;
  const collapseSearch = () => {
    if (!searchWrap || !toolbarInner) return;
    searchWrap.classList.remove('expanded');
    toolbarInner.classList.remove('search-active');
  };
  const expandSearch = () => {
    if (!searchWrap || !toolbarInner) return;
    searchWrap.classList.add('expanded');
    toolbarInner.classList.add('search-active');
    searchInput?.focus();
  };

  searchWrap?.addEventListener('click', e => {
    if (!isMobileSearch()) return;
    if (e.target === searchClose || e.target.closest('.search-close')) return;
    e.preventDefault();
    expandSearch();
  });

  searchClose?.addEventListener('click', e => {
    if (!isMobileSearch()) return;
    e.preventDefault();
    if (searchInput) searchInput.value = '';
    collapseSearch();
  });

  searchInput?.addEventListener('blur', () => {
    if (!isMobileSearch()) return;
    if (searchInput.value.trim() === '') collapseSearch();
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) collapseSearch();
  });

  /* Carrito — abrir/cerrar */
  document.getElementById('btnOpenCart')?.addEventListener('click', openCart);
  document.getElementById('btnCloseCart')?.addEventListener('click', closeCart);
  document.getElementById('cartOverlay')?.addEventListener('click', closeCart);

  /* Checkout */
  document.getElementById('btnCheckout')?.addEventListener('click', initCheckout);

  /* Email carrito — guardar en session */
  document.getElementById('cartEmail')?.addEventListener('input', e => {
    sessionStorage.setItem('praessiaEmail', e.target.value.trim());
  });

  /* Reseñas — estrellas */
  document.querySelectorAll('.star-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedStars = parseInt(btn.dataset.val);
      document.getElementById('reviewStars').value = selectedStars;
      document.querySelectorAll('.star-btn').forEach(b => {
        b.classList.toggle('active', parseInt(b.dataset.val) <= selectedStars);
      });
    });
  });

  /* Reseñas — submit */
  document.getElementById('reviewForm')?.addEventListener('submit', submitReview);

  /* Detectar hash change (navegación desde quiz) */
  window.addEventListener('hashchange', checkQuizAnchor);

  /* Verificar status pago Bold al cargar */
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('status') === 'success') {
    /* Limpiar carrito tras pago exitoso */
    cart = [];
    saveCart();
    renderCart();
    updateCartBadge();
    sessionStorage.removeItem('praessiaEmail');
    cancelAbandonedCartTimer();
    showToast('<i class="bi bi-check-circle me-2"></i>¡Pago exitoso! Gracias por tu compra 🎉');
    /* Limpiar URL */
    window.history.replaceState({}, document.title, window.location.pathname);
  }
  function updateToolbarOffset() {
    const header  = document.querySelector('.main-header');
    const toolbar = document.querySelector('.shop-toolbar');
    if (header && toolbar) {
      toolbar.style.top = header.offsetHeight + 'px';
    }
  }

  updateToolbarOffset();
  window.addEventListener('resize', updateToolbarOffset);}

/* ─────────────────────────────────────────────────────────────
   UTILIDADES
───────────────────────────────────────────────────────────── */
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function formatCOP(amount) {
  return '$' + amount.toLocaleString('es-CO');
}

function generateOrderId() {
  return 'PRS-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7).toUpperCase();
}

function showToast(msg, duration = 3000) {
  const toast = document.getElementById('shopToast');
  if (!toast) return;
  toast.innerHTML = msg;
  toast.classList.add('visible');
  setTimeout(() => toast.classList.remove('visible'), duration);
}

function feedbackAddBtn(btn) {
  if (!btn) return;
  btn.classList.add('added');
  btn.innerHTML = '<i class="bi bi-bag-check"></i> En carrito';
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}