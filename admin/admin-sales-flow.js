/* ============================================================
   Praessia — js/admin-sales-flow.js
   Multi-step sales form flow — v2
   ============================================================ */

'use strict';

/* ── Validación y navegación entre pasos ──────────────────── */

function validateAndGoToStep2() {
  const fields = [
    { id: 'clientDocType', label: 'Tipo de documento' },
    { id: 'clientDoc', label: 'Número de documento' },
    { id: 'clientName', label: 'Nombre' },
    { id: 'clientLastname', label: 'Apellido' },
    { id: 'clientPhone', label: 'Teléfono' },
    { id: 'clientEmail', label: 'Correo electrónico' },
    { id: 'clientDepartment', label: 'Departamento' },
    { id: 'clientMunicipality', label: 'Municipio' },
    { id: 'clientAddress', label: 'Dirección' },
    { id: 'clientNeighborhood', label: 'Barrio' },
  ];

  let missing = [];
  fields.forEach(f => {
    const el = document.getElementById(f.id);
    if (!el || !el.value.trim()) missing.push(f.label);
  });

  if (missing.length) {
    alert('Por favor completa los siguientes campos obligatorios:\n\n• ' + missing.join('\n• '));
    return;
  }

  const emailVal = document.getElementById('clientEmail')?.value.trim() || '';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(emailVal)) {
    alert('Ingresa un correo electrónico válido (ej: nombre@dominio.com)');
    return;
  }

  const today = new Date().toISOString().split('T')[0];
  const saleDateInput = document.getElementById('saleDate');
  if (saleDateInput) saleDateInput.value = today;

  document.getElementById('step-1-client').style.display = 'none';
  document.getElementById('step-2-details').style.display = 'block';

  document.getElementById('stepper1')?.classList.remove('active');
  document.getElementById('stepper1')?.classList.add('completed');
  document.getElementById('stepper2')?.classList.add('active');

  initializeFirstProducts();
}

function goBackToStep1() {
  document.getElementById('step-2-details').style.display = 'none';
  document.getElementById('step-1-client').style.display = 'block';

  document.getElementById('stepper2')?.classList.remove('active');
  document.getElementById('stepper1')?.classList.remove('completed');
  document.getElementById('stepper1')?.classList.add('active');
}

/* Inicializa la fecha automática del formulario de venta si no existe */
function initializeSaleDate() {
  const today = new Date().toISOString().split('T')[0];
  const el = document.getElementById('saleDate');
  if (el) el.value = today;
}

/* ── Productos ────────────────────────────────────────────── */

function initializeFirstProducts() {
  const container = document.getElementById('productsContainer');
  if (!container) return;
  container.innerHTML = '';
  addProductRow(true);
  updateSummaryTable();
}

function addProductRow(isFirst = false) {
  const container = document.getElementById('productsContainer');
  if (!container) return;

  const rowIndex = Date.now();
  const row = document.createElement('div');
  row.className = 'product-row';
  row.id = `product-row-${rowIndex}`;

  row.innerHTML = `
    <div class="field-group" style="flex:2; min-width:160px;">
      <label class="field-label required">Fragancia</label>
      <select id="saleProduct-${rowIndex}" class="field-select" onchange="updateRowTotal(${rowIndex}); updateSummaryTable();" required>
        <option value="">Selecciona...</option>
      </select>
    </div>
    <div class="field-group" style="flex:1; min-width:120px;">
      <label class="field-label required">Valor unitario</label>
      <input type="number" id="salePrice-${rowIndex}" class="field-input" min="0" placeholder="0"
        oninput="updateRowTotal(${rowIndex}); updateSummaryTable();" required>
    </div>
    <div class="field-group" style="flex:0.7; min-width:90px;">
      <label class="field-label required">Cant.</label>
      <input type="number" id="saleQty-${rowIndex}" class="field-input" min="1" value="1"
        oninput="updateRowTotal(${rowIndex}); updateSummaryTable();" required>
    </div>
    <div class="field-group" style="flex:1; min-width:120px;">
      <label class="field-label">Valor total</label>
      <input type="text" id="saleTotal-${rowIndex}" class="field-input" readonly
        style="background:var(--cream, #F0E7DA); font-weight:600; color:var(--wine, #6a2831);" placeholder="$0">
    </div>
    ${!isFirst ? `
    <div class="field-group" style="flex:0; align-self:flex-end; padding-bottom:2px;">
      <button type="button" class="btn-remove-product" onclick="removeProductRow(${rowIndex})" title="Eliminar fila">
        <i class="bi bi-trash"></i>
      </button>
    </div>` : '<div style="flex:0; width:32px;"></div>'}
  `;

  container.appendChild(row);
  fillSaleSelectForRow(rowIndex);
}

function fillSaleSelectForRow(rowIndex) {
  const sel = document.getElementById(`saleProduct-${rowIndex}`);
  if (!sel || !window.saleProducts) return;
  const previousValue = sel.value; // preservar selección si el select se reconstruye
  sel.innerHTML = '<option value="">Selecciona...</option>';
  window.saleProducts.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = cleanPerfumeName ? cleanPerfumeName(p.name) : p.name;
    sel.appendChild(opt);
  });
  if (previousValue) sel.value = previousValue;
  setSalePriceFromProduct(rowIndex);
}

/* Único punto de verdad para llenar "Valor unitario" a partir del producto
   seleccionado. Se llama tanto al (re)pintar el select como en el evento
   'change', para que nunca queden desincronizados. */
function setSalePriceFromProduct(rowIndex) {
  const sel = document.getElementById(`saleProduct-${rowIndex}`);
  const priceEl = document.getElementById(`salePrice-${rowIndex}`);
  if (!sel || !priceEl || !window.saleProducts) return;
  const prod = window.saleProducts.find(p => String(p.id) === String(sel.value));
  if (prod) {
    priceEl.value = prod.valor_unitario || 0;
    priceEl.readOnly = true;
  } else {
    priceEl.value = '';
    priceEl.readOnly = false;
  }
  updateRowTotal(rowIndex);
  if (typeof updateSummaryTable === 'function') updateSummaryTable();
}

function updateRowTotal(rowIndex) {
  const price = parseFloat(document.getElementById(`salePrice-${rowIndex}`)?.value) || 0;
  const qty = parseInt(document.getElementById(`saleQty-${rowIndex}`)?.value) || 0;
  const total = price * qty;
  const el = document.getElementById(`saleTotal-${rowIndex}`);
  if (el) el.value = total > 0 ? formatCOP(total) : '';
}

function removeProductRow(rowIndex) {
  const row = document.getElementById(`product-row-${rowIndex}`);
  if (row) { row.remove(); updateSummaryTable(); }
}

/* ── Tabla resumen dinámica ───────────────────────────────── */

function updateSummaryTable() {
  const tbody = document.getElementById('summaryTbody');
  const totalEl = document.getElementById('summaryGrandTotal');
  const emptyMsg = document.getElementById('summaryEmpty');
  if (!tbody) return;

  const container = document.getElementById('productsContainer');
  if (!container) return;

  const rows = [...container.querySelectorAll('.product-row')];
  let grandTotal = 0;
  let lines = [];

  rows.forEach(row => {
    const id = row.id.replace('product-row-', '');
    const selEl = document.getElementById(`saleProduct-${id}`);
    const priceEl = document.getElementById(`salePrice-${id}`);
    const qtyEl = document.getElementById(`saleQty-${id}`);

    const name = selEl?.options[selEl.selectedIndex]?.text || '';
    const price = parseFloat(priceEl?.value) || 0;
    const qty = parseInt(qtyEl?.value) || 0;
    const total = price * qty;

    if (name && name !== 'Selecciona...') {
      grandTotal += total;
      lines.push({ name, price, qty, total });
    }
  });

  tbody.innerHTML = '';

  if (lines.length === 0) {
    if (emptyMsg) emptyMsg.style.display = 'flex';
    if (totalEl) totalEl.textContent = '$0';
    return;
  }

  if (emptyMsg) emptyMsg.style.display = 'none';

  lines.forEach(l => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-size:0.84rem; color:var(--text, #2b2b2b);">${l.name}</td>
      <td style="font-size:0.82rem; text-align:right; color:var(--muted, #7a7a7a);">${formatCOP(l.price)}</td>
      <td style="font-size:0.82rem; text-align:center;">${l.qty}</td>
      <td style="font-size:0.84rem; text-align:right; font-weight:600; color:var(--wine, #6a2831);">${formatCOP(l.total)}</td>
    `;
    tbody.appendChild(tr);
  });

  if (totalEl) totalEl.textContent = formatCOP(grandTotal);
}

/* ── Canal / vendedor externo ─────────────────────────────── */

function toggleExternalSellerField() {
  const channel = document.getElementById('saleChannel')?.value;
  const row = document.getElementById('saleExternalSellerRow');
  if (!row) return;
  row.style.display = channel === 'vendedor_externo' ? '' : 'none';
}

/* ── Helpers ──────────────────────────────────────────────── */

function formatCOP(n) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0
  }).format(n);
}

function showAdminToast(msg, type) {
  const t = document.getElementById('adminToast');
  if (!t) { alert(msg); return; }
  t.textContent = msg;
  t.style.background = type === 'error' ? 'var(--red, #c0392b)' : 'var(--wine-dark, #4e1e25)';
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3500);
}

/* ── Validación en vivo del correo ────────────────────────── */

document.addEventListener('DOMContentLoaded', function () {
  const emailInput = document.getElementById('clientEmail');
  if (!emailInput) return;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;

  emailInput.addEventListener('blur', function () {
    const val = this.value.trim();
    if (!val) return;

    const hint = document.getElementById('emailHint');
    if (!emailRegex.test(val)) {
      if (hint) {
        hint.textContent = 'Correo inválido. Ej: nombre@dominio.com';
        hint.style.display = 'block';
      }
      emailInput.style.borderColor = 'var(--red, #c0392b)';
    } else {
      if (hint) hint.style.display = 'none';
      emailInput.style.borderColor = 'var(--green, #2d7a4f)';
    }
  });

  emailInput.addEventListener('input', function () {
    const hint = document.getElementById('emailHint');
    if (hint) hint.style.display = 'none';
    emailInput.style.borderColor = '';
  });
});

/* ── Validación paso 2 antes de registrar ─────────────────── */

function validateStep2() {
  const container = document.getElementById('productsContainer');
  const rows = container ? [...container.querySelectorAll('.product-row')] : [];
  const missing = [];

  if (rows.length === 0) {
    missing.push('Al menos un producto');
  } else {
    rows.forEach((row, i) => {
      const id = row.id.replace('product-row-', '');
      const prod  = document.getElementById(`saleProduct-${id}`)?.value;
      const price = document.getElementById(`salePrice-${id}`)?.value;
      const qty   = document.getElementById(`saleQty-${id}`)?.value;
      const num   = i + 1;
      if (!prod)  missing.push(`Producto #${num}: Fragancia`);
      if (!price || parseFloat(price) <= 0) missing.push(`Producto #${num}: Valor unitario`);
      if (!qty   || parseInt(qty)   <= 0)   missing.push(`Producto #${num}: Cantidad`);
    });
  }

  if (!document.getElementById('saleChannel')?.value)        missing.push('Canal de venta');
  if (!document.getElementById('salePaymentMethod')?.value)  missing.push('Medio de pago');
  if (!document.getElementById('saleAdvisor')?.value)        missing.push('Asesor');

  const channel = document.getElementById('saleChannel')?.value;
  if (channel === 'vendedor_externo' && !document.getElementById('saleExternalSeller')?.value) {
    missing.push('Vendedor externo');
  }

  if (missing.length) {
    alert('Por favor completa los siguientes campos obligatorios:\n\n• ' + missing.join('\n• '));
    return false;
  }
  return true;
}

/* ── Reset completo del formulario de ventas ──────────────── */

function resetSaleForm() {
  // Paso 1 — limpiar todos los campos del cliente
  const clientFields = [
    'clientDocType','clientDoc','clientName','clientLastname',
    'clientPhone','clientEmail','clientDepartment','clientMunicipality',
    'clientAddress','clientNeighborhood','clientNotes'
  ];
  clientFields.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = '';
    el.style.borderColor = '';
  });
  const emailHint = document.getElementById('emailHint');
  if (emailHint) emailHint.style.display = 'none';

  // Paso 2 — limpiar productos y comercial
  const container = document.getElementById('productsContainer');
  if (container) container.innerHTML = '';
  updateSummaryTable();

  ['saleChannel','salePaymentMethod','saleAdvisor','saleExternalSeller'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const extRow = document.getElementById('saleExternalSellerRow');
  if (extRow) extRow.style.display = 'none';

  // Volver al paso 1 visualmente
  document.getElementById('step-2-details').style.display = 'none';
  document.getElementById('step-1-client').style.display  = 'block';
  document.getElementById('stepper2')?.classList.remove('active');
  document.getElementById('stepper1')?.classList.remove('completed');
  document.getElementById('stepper1')?.classList.add('active');
}

/* ============================================================
   Praessia
   Municipios de Colombia organizados por departamento
   Fuente: DIVIPOLA — DANE 2024
   ============================================================ */

'use strict';

const municipiosPorDepartamento = {
  "Amazonas": [
    "Leticia","El Encanto","La Chorrera","La Pedrera","La Victoria",
    "Mirití - Paraná","Puerto Alegría","Puerto Arica","Puerto Nariño","Puerto Santander","Tarapacá"
  ],
  "Antioquia": [
    "Medellín","Abejorral","Abriaquí","Alejandría","Amagá","Amalfi","Andes","Angelópolis",
    "Angostura","Anorí","Anzá","Apartadó","Arboletes","Argelia","Armenia","Barbosa",
    "Bello","Betania","Betulia","Briceño","Buriticá","Cáceres","Caicedo","Caldas",
    "Campamento","Cañasgordas","Caracolí","Caramanta","Carepa","Carolina del Príncipe",
    "Caucasia","Chigorodó","Cisneros","Ciudad Bolívar","Cocorná","Concepción","Concordia",
    "Copacabana","Dabeiba","Donmatías","Ebéjico","El Bagre","El Carmen de Viboral",
    "El Santuario","Entrerríos","Envigado","Fredonia","Frontino","Giraldo","Girardota",
    "Gómez Plata","Granada","Guadalupe","Guarne","Guatapé","Heliconia","Hispania",
    "Itagüí","Ituango","Jardín","Jericó","La Ceja","La Estrella","La Pintada","La Unión",
    "Liborina","Maceo","Marinilla","Montebello","Murindó","Mutatá","Nariño","Nechí",
    "Necoclí","Olaya","Peñol","Peque","Pueblorrico","Puerto Berrío","Puerto Nare",
    "Puerto Triunfo","Remedios","Retiro","Rionegro","Sabanalarga","Sabaneta","Salgar",
    "San Andrés de Cuerquia","San Carlos","San Francisco","San Jerónimo","San José de la Montaña",
    "San Juan de Urabá","San Luis","San Pedro de los Milagros","San Pedro de Urabá",
    "San Rafael","San Roque","San Vicente Ferrer","Santa Bárbara","Santa Fe de Antioquia",
    "Santa Rosa de Osos","Santo Domingo","Segovia","Sonsón","Sopetrán","Támesis","Tarazá",
    "Tarso","Titiribí","Toledo","Turbo","Uramita","Urrao","Valdivia","Valparaíso",
    "Vegachí","Venecia","Vigía del Fuerte","Yalí","Yanomamó","Yarumal","Yolombó",
    "Yondó","Zaragoza"
  ],
  "Arauca": [
    "Arauca","Arauquita","Cravo Norte","Fortul","Puerto Rondón","Saravena","Tame"
  ],
  "Atlántico": [
    "Barranquilla","Baranoa","Campo de la Cruz","Candelaria","Galapa","Juan de Acosta",
    "Luruaco","Malambo","Manatí","Palmar de Varela","Piojó","Polonuevo","Ponedera",
    "Puerto Colombia","Repelón","Sabanagrande","Sabanalarga","Santa Lucía","Santo Tomás",
    "Soledad","Suán","Tubará","Usiacurí"
  ],
  "Bolívar": [
    "Cartagena","Achí","Altos del Rosario","Arenal","Arjona","Arroyohondo","Barranco de Loba",
    "Calamar","Cantagallo","Cicuco","Clemencia","Córdoba","El Carmen de Bolívar","El Guamo",
    "El Peñón","Hatillo de Loba","Magangué","Mahates","Margarita","María la Baja","Mompós",
    "Montecristo","Morales","Norosí","Pinillos","Regidor","Río Viejo","San Cristóbal",
    "San Estanislao","San Fernando","San Jacinto","San Jacinto del Cauca","San Juan Nepomuceno",
    "San Martín de Loba","San Pablo","Santa Catalina","Santa Cruz de Mompox","Santa Rosa",
    "Santa Rosa del Sur","Simití","Soplaviento","Talaigua Nuevo","Tiquisio","Turbaco",
    "Turbaná","Villanueva","Zambrano"
  ],
  "Boyacá": [
    "Tunja","Almeida","Aquitania","Arcabuco","Belén","Berbeo","Betéitiva","Boavita",
    "Boyacá","Briceño","Buenavista","Busbanzá","Caldas","Campohermoso","Cerinza",
    "Chinavita","Chiquinquirá","Chíquiza","Chiscas","Chita","Chitaraque","Chivatá",
    "Ciénega","Cómbita","Coper","Corrales","Covarachía","Cubará","Cucaita","Cuítiva",
    "Duitama","El Cocuy","El Espino","Firavitoba","Floresta","Gachantivá","Gámeza",
    "Garagoa","Guacamayas","Guateque","Guayatá","Güicán de la Sierra","Iza","Jenesano",
    "Jericó","La Capilla","La Uvita","La Victoria","Labranzagrande","Macanal","Maripí",
    "Miraflores","Mongua","Monguí","Moniquirá","Motavita","Muzo","Nobsa","Nuevo Colón",
    "Oicatá","Otanche","Pachavita","Páez","Paipa","Pajarito","Panqueba","Pauna",
    "Paya","Paz de Río","Pesca","Pisba","Puerto Boyacá","Quípama","Ramiriquí","Ráquira",
    "Rondón","Saboyá","Sáchica","Samacá","San Eduardo","San José de Pare","San Luis de Gaceno",
    "San Mateo","San Miguel de Sema","San Pablo de Borbur","Santa María","Santa Rosa de Viterbo",
    "Santa Sofía","Santana","Sativanorte","Sativasur","Siachoque","Soatá","Socotá",
    "Socha","Sogamoso","Somondoco","Sora","Soracá","Sotaquirá","Susacón","Sutamarchán",
    "Sutatenza","Tasco","Tenza","Tibaná","Tibasosa","Tinjacá","Tipacoque","Toca",
    "Togüí","Tópaga","Tota","Turmequé","Tuta","Tutazá","Umbita","Ventaquemada",
    "Villa de Leyva","Viracachá","Zetaquira"
  ],
  "Caldas": [
    "Manizales","Aguadas","Anserma","Aranzazu","Belalcázar","Chinchiná","Filadelfia",
    "La Dorada","La Merced","Manzanares","Marmato","Marquetalia","Marulanda","Neira",
    "Norcasia","Pácora","Palestina","Pensilvania","Riosucio","Risaralda","Salamina",
    "Samaná","San José","Supía","Victoria","Villamaría","Viterbo"
  ],
  "Caquetá": [
    "Florencia","Albania","Belén de los Andaquíes","Cartagena del Chairá","Curillo",
    "El Doncello","El Paujil","La Montañita","Milán","Morelia","Puerto Rico","San José del Fragua",
    "San Vicente del Caguán","Solano","Solita","Valparaíso"
  ],
  "Casanare": [
    "Yopal","Aguazul","Chámeza","Hato Corozal","La Salina","Maní","Monterrey","Nunchía",
    "Orocué","Paz de Ariporo","Pore","Recetor","Sabanalarga","Sácama","San Luis de Palenque",
    "Támara","Tauramena","Trinidad","Villanueva"
  ],
  "Cauca": [
    "Popayán","Almaguer","Argelia","Balboa","Bolívar","Buenos Aires","Cajibío","Caldono",
    "Caloto","Corinto","El Tambo","Florencia","Guachené","Guapi","Inzá","Jambaló",
    "La Sierra","La Vega","López de Micay","Mercaderes","Miranda","Morales","Padilla",
    "Páez","Patía","Piamonte","Piendamó","Puerto Tejada","Puracé","Rosas","San Sebastián",
    "Santa Rosa","Santander de Quilichao","Silvia","Sotara","Suárez","Sucre","Timbío",
    "Timbiquí","Toribío","Totoró","Villa Rica"
  ],
  "Cesar": [
    "Valledupar","Aguachica","Agustín Codazzi","Astrea","Becerril","Bosconia","Chimichagua",
    "Chiriguaná","Curumaní","El Copey","El Paso","Gamarra","González","La Gloria","La Jagua de Ibirico",
    "La Paz","Manaure Balcón del Cesar","Pailitas","Pelaya","Pueblo Bello","Río de Oro",
    "San Alberto","San Diego","San Martín","Tamalameque"
  ],
  "Chocó": [
    "Quibdó","Acandí","Alto Baudó","Atrato","Bagadó","Bahía Solano","Bajo Baudó",
    "Belén de Bajirá","Bojayá","Cantón de San Pablo","Carmen del Darién","Cértegui",
    "Condoto","El Carmen de Atrato","El Litoral del San Juan","Istmina","Juradó",
    "Lloró","Medio Atrato","Medio Baudó","Medio San Juan","Nóvita","Nuquí",
    "Río Iro","Río Quito","Riosucio","San José del Palmar","Sipí","Tadó",
    "Unguía","Unión Panamericana"
  ],
  "Córdoba": [
    "Montería","Ayapel","Buenavista","캉 Cereté","Chimá","Chinú","Ciénaga de Oro",
    "Cotorra","La Apartada","Lorica","Los Córdobas","Momil","Montelíbano","Moñitos",
    "Planeta Rica","Pueblo Nuevo","Puerto Escondido","Puerto Libertador","Purísima de la Concepción",
    "Sahagún","San Andrés de Sotavento","San Antero","San Bernardo del Viento",
    "San Carlos","San José de Uré","San Pelayo","Tierralta","Tuchín","Valencia"
  ],
  "Cundinamarca": [
    "Bogotá D.C.","Agua de Dios","Albán","Anapoima","Anchipala","Anolaima","Apulo",
    "Arbeláez","Beltrán","Bituima","Bojacá","Cabrera","Cachipay","Cajicá","Caparrapí",
    "Cáqueza","Carmen de Carupa","Chaguaní","Chía","Chipaque","Choachí","Chocontá",
    "Cogua","Cota","Cucunubá","El Colegio","El Peñón","El Rosal","Facatativá",
    "Fomeque","Fosca","Funza","Fúquene","Fusagasugá","Gachalá","Gachancipá",
    "Gachetá","Gama","Girardot","Granada","Guachetá","Guaduas","Guasca","Guataquí",
    "Guatavita","Guayabal de Síquima","Guayabetal","Gutiérrez","Jerusalén","Junín",
    "La Calera","La Mesa","La Palma","La Peña","La Vega","Lenguazaque","Macheta",
    "Madrid","Manta","Medina","Mosquera","Nariño","Nemocón","Nilo","Nimaima",
    "Nocaima","Pacho","Paime","Pandi","Paratebueno","Pasca","Puerto Salgar","Pulí",
    "Quebradanegra","Quetame","Quipile","Ricaurte","San Antonio del Tequendama",
    "San Bernardo","San Cayetano","San Francisco","San Juan de Río Seco","Sasaima",
    "Sesquilé","Sibaté","Silvania","Simijaca","Soacha","Sopó","Subachoque","Suesca",
    "Supatá","Susa","Sutatausa","Tabio","Tausa","Tena","Tibacuy","Tibirita",
    "Tocaima","Tocancipá","Topaipí","Ubalá","Ubaque","Une","Útica","Vergara",
    "Vianí","Villagómez","Villapinzón","Villeta","Viotá","Yacopí","Zipacón","Zipaquirá"
  ],
  "Guainía": [
    "Inírida","Barranco Minas","Cacahual","La Guadalupe","Mapiripana","Morichal",
    "Pana Pana","Puerto Colombia","San Felipe"
  ],
  "Guaviare": [
    "San José del Guaviare","Calamar","El Retorno","Miraflores"
  ],
  "Huila": [
    "Neiva","Acevedo","Agrado","Aipe","Algeciras","Altamira","Baraya","Campoalegre",
    "Colombia","Elías","Garzón","Gigante","Guadalupe","Hobo","Iquira","Isnos",
    "La Argentina","La Plata","Nátaga","Oporapa","Paicol","Palermo","Palestina",
    "Pital","Pitalito","Rivera","Saladoblanco","San Agustín","Santa María","Suaza",
    "Tarqui","Tello","Teruel","Tesalia","Timaná","Villavieja","Yaguará"
  ],
  "La Guajira": [
    "Riohacha","Albania","Barrancas","Dibulla","Distracción","El Molino","Fonseca",
    "Hatonuevo","La Jagua del Pilar","Maicao","Manaure","San Juan del Cesar","Uribia",
    "Urumita","Villanueva"
  ],
  "Magdalena": [
    "Santa Marta","Algarrobo","Aracataca","Ariguaní","Cerro de San Antonio","Chivolo",
    "Ciénaga","Concordia","El Banco","El Piñón","El Retén","Fundación","Guamal",
    "Nueva Granada","Pedraza","Pijiño del Carmen","Pivijay","Plato","Pueblo Viejo",
    "Remolino","Sabanas de San Ángel","Salamina","San Sebastián de Buenavista",
    "San Zenón","Santa Ana","Santa Bárbara de Pinto","Sitionuevo","Tenerife","Zapayán","Zona Bananera"
  ],
  "Meta": [
    "Villavicencio","Acacías","Barranca de Upía","Cabuyaro","Castilla la Nueva",
    "Cubarral","Cumaral","El Calvario","El Castillo","El Dorado","Fuente de Oro",
    "Granada","Guamal","La Macarena","La Uribe","Lejanías","Mapiripán","Mesetas",
    "Puerto Concordia","Puerto Gaitán","Puerto Lleras","Puerto López","Puerto Rico",
    "Restrepo","San Carlos de Guaroa","San Juan de Arama","San Juanito","San Martín",
    "Vistahermosa"
  ],
  "Nariño": [
    "Pasto","Albán","Aldana","Ancuyá","Arboleda","Barbacoas","Belén","Buesaco",
    "Chachagüí","Colón","Consacá","Contadero","Córdoba","Cuaspud","Cumbal","Cumbitara",
    "El Charco","El Peñol","El Rosario","El Tablón de Gómez","El Tambo","Francisco Pizarro",
    "Funes","Guachucal","Guaitarilla","Gualmatán","Iles","Imués","Ipiales","La Cruz",
    "La Florida","La Llanada","La Tola","La Unión","Leiva","Linares","Los Andes",
    "Magüí","Mallama","Mosquera","Nariño","Olaya Herrera","Ospina","Policarpa",
    "Potosí","Providencia","Puerres","Pupiales","Ricaurte","Roberto Payán","Samaniego",
    "San Bernardo","San Lorenzo","San Pablo","San Pedro de Cartago","Sandoná",
    "Santa Bárbara","Santacruz","Sapuyes","Taminango","Tangua","Tumaco","Túquerres","Yacuanquer"
  ],
  "Norte de Santander": [
    "Cúcuta","Ábrego","Arboledas","Bochalema","Bucarasica","Cácota","Cachirá","Chinácota",
    "Chitagá","Convención","Cucutilla","Durania","El Carmen","El Tarra","El Zulia",
    "Gramalote","Hacarí","Herrán","La Esperanza","La Playa de Belén","Labateca",
    "Los Patios","Lourdes","Mutiscua","Ocaña","Pamplona","Pamplonita","Puerto Santander",
    "Ragonvalia","Salazar","San Calixto","San Cayetano","Santiago","Sardinata",
    "Silos","Teorama","Tibú","Toledo","Villacaro","Villa del Rosario"
  ],
  "Putumayo": [
    "Mocoa","Colón","Orito","Puerto Asís","Puerto Caicedo","Puerto Guzmán","Puerto Leguízamo",
    "San Francisco","San Miguel","Santiago","Sibundoy","Valle del Guamuéz","Villagarzón"
  ],
  "Quindío": [
    "Armenia","Buenavista","Calarcá","Circasia","Córdoba","Filandia","Génova",
    "La Tebaida","Montenegro","Pijao","Quimbaya","Salento"
  ],
  "Risaralda": [
    "Pereira","Apía","Balboa","Belén de Umbría","Dosquebradas","Guática","La Celia",
    "La Virginia","Marsella","Mistrató","Pueblo Rico","Quinchía","Santa Rosa de Cabal",
    "Santuario"
  ],
  "San Andrés y Providencia": [
    "San Andrés","Providencia"
  ],
  "Santander": [
    "Bucaramanga","Aguada","Albania","Aratoca","Barbosa","Barichara","Barrancabermeja",
    "Betulia","Bolívar","Cabrera","California","Capitanejo","Carcasí","Cepitá","Cerrito",
    "Charalá","Charta","Chima","Chipatá","Cimitarra","Concepción","Confines","Contratación",
    "Coromoro","Curití","El Carmen de Chucurí","El Guacamayo","El Peñón","El Playón",
    "Encino","Enciso","Florián","Floridablanca","Galán","Gámbita","Girón","Guaca",
    "Guadalupe","Guapotá","Guavatá","Güepsa","Hato","Jesús María","Jordán","La Belleza",
    "La Paz","Landázuri","Lebrija","Los Santos","Macaravita","Málaga","Matanza",
    "Mogotes","Molagavita","Ocamonte","Oiba","Onzaga","Palmar","Palmas del Socorro",
    "Páramo","Piedecuesta","Pinchote","Puente Nacional","Puerto Parra","Puerto Wilches",
    "Rionegro","Sabana de Torres","San Andrés","San Benito","San Gil","San Joaquín",
    "San José de Miranda","San Miguel","San Vicente de Chucurí","Santa Bárbara","Santa Helena del Opón",
    "Simacota","Socorro","Suaita","Sucre","Suratá","Tona","Valle de San José",
    "Vélez","Vetas","Villanueva","Zapatoca"
  ],
  "Sucre": [
    "Sincelejo","Buenavista","Caimito","Chalán","Colosó","Corozal","Coveñas",
    "El Roble","Galeras","Guaranda","La Unión","Los Palmitos","Majagual","Morroa",
    "Ovejas","Palmito","Sampués","San Benito Abad","San Juan de Betulia","San Marcos",
    "San Onofre","San Pedro","San Luis de Sincé","Santiago de Tolú","Sucre",
    "Tolú Viejo"
  ],
  "Tolima": [
    "Ibagué","Alpujarra","Alvarado","Ambalema","Anzoátegui","Armero","Ataco",
    "Cajamarca","Carmen de Apicalá","Casabianca","Chaparral","Coello","Coyaima",
    "Cunday","Dolores","Espinal","Falan","Flandes","Fresno","Guamo","Herveo",
    "Honda","Icononzo","Lérida","Líbano","Mariquita","Melgar","Murillo","Natagaima",
    "Ortega","Palocabildo","Piedras","Planadas","Prado","Purificación","Rioblanco",
    "Roncesvalles","Rovira","Saldaña","San Antonio","San Luis","Santa Isabel",
    "Suárez","Valle de San Juan","Venadillo","Villahermosa","Villarrica"
  ],
  "Valle del Cauca": [
    "Cali","Alcalá","Andalucía","Ansermanuevo","Argelia","Bolívar","Buenaventura",
    "Buga","Bugalagrande","Caicedonia","Calima","Candelaria","Cartago","Dagua",
    "El Águila","El Cairo","El Cerrito","El Dovio","Florida","Ginebra","Guacarí",
    "Jamundí","La Cumbre","La Unión","La Victoria","Obando","Palmira","Pradera",
    "Restrepo","Riofrío","Roldanillo","San Pedro","Sevilla","Toro","Trujillo",
    "Tuluá","Ulloa","Versalles","Vijes","Yotoco","Yumbo","Zarzal"
  ],
  "Vaupés": [
    "Mitú","Carurú","Pacoa","Papunaua","Taraira","Yavaraté"
  ],
  "Vichada": [
    "Puerto Carreño","Cumaribo","La Primavera","Santa Rosalía"
  ],
  "Bogotá D.C.": [
    "Bogotá D.C."
  ]
};

/* ── Inicializar select de municipio ─────────────────────── */

document.addEventListener('DOMContentLoaded', function initMunicipioSelect() {
  const deptSelect = document.getElementById('clientDepartment');
  const munSelect  = document.getElementById('clientMunicipality');
  if (!deptSelect || !munSelect) return;

  munSelect.disabled = true;
  munSelect.innerHTML = '<option value="">Selecciona primero el departamento...</option>';

  deptSelect.addEventListener('change', function () {
    const dept = this.value;
    munSelect.innerHTML = '';

    if (!dept || !municipiosPorDepartamento[dept]) {
      munSelect.disabled = true;
      munSelect.innerHTML = '<option value="">Selecciona primero el departamento...</option>';
      return;
    }

    munSelect.disabled = false;
    munSelect.innerHTML = '<option value="">Selecciona municipio...</option>';

    municipiosPorDepartamento[dept].forEach(m => {
      const opt = document.createElement('option');
      opt.value = m;
      opt.textContent = m;
      munSelect.appendChild(opt);
    });
  });
});