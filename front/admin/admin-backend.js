/* Admin — Backend integration for login and sales (overrides visual stubs)
   - Uses backend endpoints: /login, /record-sale/*
   - Sends requests with credentials included so httpOnly cookie is used
*/

'use strict';

// Base URL for backend API. When opening admin.html via file:// use localhost:3008 (server picked 3008)
const API_BASE = window.__BACKEND_BASE__ || (location.protocol === 'file:' ? 'http://localhost:3008' : '');

function backendValidatePasswordStrength(pw) {
  return typeof pw === 'string' && /[A-Z]/.test(pw) && /[a-z]/.test(pw) && /\d/.test(pw) && /[^A-Za-z0-9]/.test(pw) && pw.length >= 8;
}

/* Helper for API calls: includes Authorization header from localStorage token if present; keeps credentials for cookie case */
function apiFetch(path, opts = {}) {
  const token = localStorage.getItem('authToken');
  const headers = Object.assign({}, opts.headers || {});
  if (token) headers['Authorization'] = 'Bearer ' + token;
  opts.headers = headers;
  if (typeof opts.credentials === 'undefined') opts.credentials = 'include';
  return fetch(API_BASE + path, opts);
}

function bindBackendLoginEvents() {
  document.getElementById('btnLogin')?.removeEventListener('click', attemptLogin);
  document.getElementById('btnLogin')?.addEventListener('click', attemptLogin);
  document.getElementById('loginInput')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') attemptLogin();
  });
  document.getElementById('btnLogout')?.addEventListener('click', backendLogout);

  // Persona lookup on blur of document field
  const clientDocEl = document.getElementById('clientDoc');
  if (clientDocEl) {
    clientDocEl.addEventListener('blur', async () => {
      const documento = clientDocEl.value?.trim();
      if (!documento) return;
      try {
        const res = await apiFetch(`/record-sale/persona/${encodeURIComponent(documento)}`);
        if (!res.ok) return; // not found or no auth
        const txt = await res.text();
        let payload = {};
        try { payload = txt ? JSON.parse(txt) : {}; } catch (e) { payload = {}; }
        if (payload.success && payload.data) {
          const p = payload.data;
          document.getElementById('clientDocType').value = p.tipoDocumento || '';
          document.getElementById('clientName').value = p.nombres || p.nombre || '';
          document.getElementById('clientLastname').value = p.apellidos || p.apellido || '';
          document.getElementById('clientPhone').value = p.telefono || '';
          document.getElementById('clientEmail').value = p.email || p.correo || '';
          const departmentEl = document.getElementById('clientDepartment');
          departmentEl.value = p.departamento || '';
          if (departmentEl.value) {
            departmentEl.dispatchEvent(new Event('change'));
          }
          document.getElementById('clientMunicipality').value = p.ciudad || p.municipio || '';
          document.getElementById('clientAddress').value = p.direccion || '';
          document.getElementById('clientNeighborhood').value = p.barrio || '';
          document.getElementById('clientNotes').value = p.informacionAdicional || '';
        }
      } catch (e) {
        console.warn('Persona lookup error', e);
      }
    });
  }

  // Ensure saveSale override is bound
  const saveBtn = document.getElementById('btnSaveSale');
  if (saveBtn) {
    saveBtn.removeEventListener('click', window._originalSaveSaleHandler || (() => {}));
    saveBtn.addEventListener('click', () => {
      if (!validateStep2()) return;
      saveSaleBackend();
    });
  }
}

async function attemptLogin() {
  const userEl = document.getElementById('loginUser');
  const passEl = document.getElementById('loginInput');
  const usuario = userEl?.value?.trim();
  const password = passEl?.value?.trim();
  if (!usuario || !password) { showLoginError('Usuario y contraseña son obligatorios'); return; }

  const btn = document.getElementById('btnLogin');
  btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>';

  try {
    const res = await apiFetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, password })
    });
    const text = await res.text();
    let data = {};
    try { data = text ? JSON.parse(text) : {}; } catch (e) { data = {}; }
    if (!res.ok) {
      showLoginError(data?.message || `Error en inicio de sesión (${res.status})`);
      return;
    }

    if (data.needPasswordUpdate) {
      // Ask user to change password before continuing
      let newPw = '';
      do {
        newPw = prompt('Debes actualizar tu contraseña. Ingresa nueva contraseña (min 8 chars, mayúscula, minúscula, número y carácter especial):');
        if (newPw === null) { showLoginError('Cambio de contraseña requerido'); return; }
        if (!backendValidatePasswordStrength(newPw)) {
          alert('Contraseña inválida. Debe tener 8+ caracteres, una mayúscula, una minúscula, un número y un caracter especial.');
          newPw = '';
        }
      } while (!newPw);

      // Call change-password
      const ch = await apiFetch('/login/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, currentPassword: password, newPassword: newPw })
      });
      const chText = await ch.text();
      let chRes = {};
      try { chRes = chText ? JSON.parse(chText) : {}; } catch (e) { chRes = {}; }
      if (!ch.ok) { showLoginError(chRes?.message || `No se pudo actualizar la contraseña (${ch.status})`); return; }
      // save fallback token if provided
      if (chRes.token) localStorage.setItem('authToken', chRes.token);
      // after successful change-password, verify session cookie or token too
      try {
        const chk2 = await apiFetch('/login/check');
        const txtChk2 = await chk2.text();
        const ok2 = (() => { try { return txtChk2 ? JSON.parse(txtChk2) : {}; } catch (e) { return {}; } })();
        if (!(chk2.ok && ok2.success)) { showLoginError('No se pudo validar sesión tras cambio de contraseña'); return; }
      } catch (e) { showLoginError('Error verificando sesión tras cambio de contraseña'); return; }
    }

    // Store token fallback BEFORE checking session, so /login/check can use
    // the Authorization: Bearer header even if the httpOnly cookie didn't
    // survive the round trip (e.g. file://, distinto puerto, cookies de
    // terceros bloqueadas, navegación privada).
    if (data.token) localStorage.setItem('authToken', data.token);

    // Verify cookie/token was accepted by server before proceeding
    try {
      const chk = await apiFetch('/login/check');
      const txt2 = await chk.text();
      const okPayload = (() => { try { return txt2 ? JSON.parse(txt2) : {}; } catch (e) { return {}; } })();
      if (chk.ok && okPayload.success) {
        enterPanel();
        await fetchBackendProducts();
      } else {
        showLoginError('No se pudo validar sesión tras el login. Refresca e intenta de nuevo.');
        return;
      }
    } catch (e) {
      showLoginError('Error verificando sesión tras login.');
      return;
    }
  } catch (e) {
    console.error('Login error', e);
    showLoginError('Error de conexión al servidor');
  } finally {
    btn.disabled = false; btn.innerHTML = 'Ingresar';
  }
}

async function backendLogout() {
  try {
    await apiFetch('/login/logout', { method: 'POST' });
    localStorage.removeItem('authToken');
  } catch (e) { console.warn('Logout failed', e); }
  // Use existing UI reset
  logout();
}

async function fetchBackendProducts() {
  try {
    const res = await apiFetch('/record-sale/products');
    if (!res.ok) return;
    const text = await res.text();
    const payload = (() => { try { return text ? JSON.parse(text) : {}; } catch (e) { return {}; } })();
    if (!payload.success) return;
    // Map to expected `perfumes` shape used by admin-sales-flow
    window.perfumes = (payload.data || []).map(p => ({ id: p.id, name: p.fragancia || p.producto || '', valor_unitario: p.valor_unitario || p.costoVenta || 0 }));

    // Update existing select rows
    document.querySelectorAll('select[id^="saleProduct-"]').forEach(sel => {
      const id = sel.id.replace('saleProduct-', '');
      if (typeof fillSaleSelectForRow === 'function') {
        try { fillSaleSelectForRow(id); } catch (e) {}
      }
      // If there's a selected value, fill price and readonly
      const selected = sel.value;
      if (selected) {
        const prod = window.perfumes.find(x => String(x.id) === String(selected));
        if (prod) {
          const priceEl = document.getElementById(`salePrice-${id}`);
          if (priceEl) { priceEl.value = prod.valor_unitario || 0; priceEl.readOnly = true; }
        }
      }
    });

    // Delegate change to set price automatically
    document.addEventListener('change', function (e) {
      const t = e.target;
      if (!t || !t.id) return;
      if (t.id.startsWith('saleProduct-')) {
        const rid = t.id.replace('saleProduct-', '');
        const prod = window.perfumes.find(x => String(x.id) === String(t.value));
        const priceEl = document.getElementById(`salePrice-${rid}`);
        if (prod && priceEl) {
          priceEl.value = prod.valor_unitario || 0;
          priceEl.readOnly = true;
          updateRowTotal(rid);
          updateSummaryTable();
        } else if (priceEl) {
          priceEl.value = '';
          priceEl.readOnly = false;
        }
      }
    });

  } catch (e) {
    console.warn('Error loading products', e);
  }
}

async function saveSaleBackend() {
  try {
    // Build persona
    const persona = {
      documento: document.getElementById('clientDoc')?.value?.trim(),
      tipoDocumento: document.getElementById('clientDocType')?.value || '',
      nombres: document.getElementById('clientName')?.value || '',
      apellidos: document.getElementById('clientLastname')?.value || '',
      telefono: document.getElementById('clientPhone')?.value || '',
      correo: document.getElementById('clientEmail')?.value || '',
      departamento: document.getElementById('clientDepartment')?.value || '',
      municipio: document.getElementById('clientMunicipality')?.value || '',
      direccion: document.getElementById('clientAddress')?.value || '',
      barrio: document.getElementById('clientNeighborhood')?.value || '',
      informacionAdicional: document.getElementById('clientNotes')?.value || ''
    };

    // Build detalles
    const detalles = [];
    document.querySelectorAll('.product-row').forEach(row => {
      const rid = row.id.replace('product-row-', '');
      const prodId = document.getElementById(`saleProduct-${rid}`)?.value;
      const qty = parseInt(document.getElementById(`saleQty-${rid}`)?.value) || 0;
      const price = parseFloat(document.getElementById(`salePrice-${rid}`)?.value) || 0;
      if (prodId && qty > 0) {
        detalles.push({ referencia: prodId, cantidad: qty, valorUnitario: price });
      }
    });

    const canalVenta = document.getElementById('saleChannel')?.value || '';
    const medioPago = document.getElementById('salePaymentMethod')?.value || '';
    const referencia = document.getElementById('saleExternalSeller')?.value || '';
    const fecha = document.getElementById('saleDate')?.value || new Date().toISOString();

    const body = { persona, detalles, canalVenta, medioPago, referencia, fecha };

    const res = await apiFetch('/record-sale/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const txt = await res.text();
    const payload = (() => { try { return txt ? JSON.parse(txt) : {}; } catch (e) { return {}; } })();
    if (!res.ok) {
      showAdminToast(payload?.message || `Error al registrar venta (${res.status})`, 'error');
      return;
    }

    showAdminToast('Venta registrada correctamente');
    // reset form
    if (typeof resetSaleForm === 'function') resetSaleForm();
    // Optionally refresh recent sales UI — best-effort
    if (typeof loadSales === 'function') loadSales().then(renderRecentSales).catch(() => {});

  } catch (e) {
    console.error('Error saving sale', e);
    showAdminToast('Error al registrar venta. Revisa la consola.', 'error');
  }
}

// Initialize when DOM ready
document.addEventListener('DOMContentLoaded', () => {
  // Re-bind login events and sales handlers to backend-aware versions
  bindBackendLoginEvents();
  // Try to fetch products if already authenticated
  fetchBackendProducts();
});
