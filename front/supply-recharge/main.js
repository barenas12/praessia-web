function activarFecha (){
    const fecha = document.querySelector('#fecha');
    if (fecha.value == ''){
        alert(' ¡Por favor, selecciona una fecha para la recarga!');
        return null;
    }
    console.log('Fecha:', fecha.value);
    return fecha.value;
}

function activarInsumo (){
    const insumo = document.querySelector('#insumo');
    if (insumo.value == ''){
        alert(' ¡Por favor, selecciona un insumo para la recarga!');
        return null;
    }
    console.log('Insumo:', insumo.value);
    return insumo.value;
}

function activarCantidad (){
    const cantidad = document.querySelector('#cantidad');
    if (cantidad.value == ''){
        alert(' ¡Por favor, selecciona una cantidad para la recarga!');
        return null;
    }
    console.log('Cantidad:', cantidad.value);
    return cantidad.value;
}

function activarUnidad (){
    const unidad = document.querySelector('#unidad');
    if (unidad.value == ''){
        alert(' ¡Por favor, selecciona una unidad para la recarga!');
        return null;
    }
    console.log('Unidad:', unidad.value);
    return unidad.value;
}

function activarCosto (){
    const costo = document.querySelector('#costo');
    console.log('Costo:', costo.value);
    return costo.value || 0;
}

function activarProveedor (){
    const proveedor = document.querySelector('#proveedor');
    if (proveedor.value == ''){
        alert(' ¡Por favor, selecciona un proveedor para la recarga!');
        return null;
    }
    console.log('Proveedor:', proveedor.value);
    return proveedor.value;
}

function activarNotas (){
    const notas = document.querySelector('#notas');
    console.log('Notas:', notas.value);
    return notas.value;
}

async function guardarRecarga() {
    /* Validar todos los campos */
    const fecha = activarFecha();
    const insumo = activarInsumo();
    const cantidad = activarCantidad();
    const unidad = activarUnidad();
    const costo = activarCosto();
    const proveedor = activarProveedor();
    const notas = activarNotas();

    /* Si algún campo obligatorio es null, detener */
    if (!fecha || !insumo || !cantidad || !unidad || !proveedor) {
        console.error('Campos requeridos incompletos');
        return;
    }

    /* Preparar datos para enviar */
    const datos = {
        fecha,
        insumo,
        cantidad: parseFloat(cantidad),
        unidad,
        costo: parseFloat(costo) || 0,
        proveedor,
        notas
    };

    console.log('Enviando datos:', datos);

    try {
        const apiBase = await detectApiBase();
        const response = await fetch(apiBase + '/supply-recharge', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datos)
        });

        const resultado = await response.json();

        if (resultado.success) {
            console.log('✓ Recarga guardada correctamente:', resultado);
            alert('✓ Recarga guardada correctamente');
            limpiarFormulario();
            mostrarToast('Insumo añadido correctamente.');
        } else {
            console.error('Error:', resultado.message);
            alert('Error: ' + resultado.message);
        }
    } catch (error) {
        console.error('Error al enviar datos:', error);
        alert('Error al conectar con el servidor: ' + error.message);
    }
}

async function detectApiBase() {
    // if (window._API_BASE) return window._API_BASE;
    // const ports = Array.from({ length: 10 }, (_, i) => 3008 + i);
    // for (const p of ports) {
    //     try {
    //         const controller = new AbortController();
    //         const id = setTimeout(() => controller.abort(), 1000);
    //         const res = await fetch(`http://localhost:${p}/db-test`, { signal: controller.signal });
    //         clearTimeout(id);
    //         if (res.ok) {
    //             const json = await res.json();
    //             if (json && json.success) {
    //                 const base = `http://localhost:${p}`;
    //                 window._API_BASE = base;
    //                 console.log('API encontrada en', base);
    //                 return base;
    //             }
    //         }
    //     } catch (e) {
    //         // ignore and try next port
    //     }
    // }
    // // Fallback to port 3008
    const fallback = 'https://api3.gvsconnect.app/praesia';
    window._API_BASE = fallback;
    return fallback;
}

function limpiarFormulario() {
    document.getElementById('fecha').value = '';
    document.getElementById('insumo').value = '';
    document.getElementById('cantidad').value = '';
    document.getElementById('unidad').value = '';
    document.getElementById('costo').value = '';
    document.getElementById('proveedor').value = '';
    document.getElementById('notas').value = '';
}

function mostrarToast(mensaje) {
    const toast = document.getElementById('toastRecarga');
    const toastMsg = document.getElementById('toastMsg');
    
    if (toast && toastMsg) {
        toastMsg.textContent = mensaje;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

async function cargarProveedores() {
    try {
        const apiBase = await detectApiBase();
        const response = await fetch(apiBase + '/supply-recharge/suppliers');
        const resultado = await response.json();

        if (resultado.success && resultado.data) {
            const selectProveedor = document.getElementById('proveedor');
            
            /* Limpiar opciones actuales excepto la primera (placeholder) */
            const firstOption = selectProveedor.querySelector('option[value=""]');
            selectProveedor.innerHTML = '';
            
            if (firstOption) {
                selectProveedor.appendChild(firstOption);
            }

            /* Agregar opciones desde la API */
            resultado.data.forEach(proveedor => {
                const option = document.createElement('option');
                option.value = proveedor.id;
                option.textContent = proveedor.proveedor;
                selectProveedor.appendChild(option);
            });

            console.log('✓ Proveedores cargados:', resultado.data.length);
        } else {
            console.error('Error al cargar proveedores:', resultado.message);
        }
    } catch (error) {
        console.error('Error al conectar con la API de proveedores:', error);
    }
}

async function cargarFragances() {
    try {
        const apiBase = await detectApiBase();
        const response = await fetch(apiBase + '/supply-recharge/fragances');
        const resultado = await response.json();

        if (resultado.success && resultado.data) {
            const selectInsumo = document.getElementById('insumo');
            const firstOption = selectInsumo.querySelector('option[value=""]');
            selectInsumo.innerHTML = '';
            if (firstOption) selectInsumo.appendChild(firstOption);
            if (Array.isArray(resultado.data) && resultado.data.length > 0) {
                resultado.data.forEach(item => {
                    const label = item.insumo || item.fragancia || item.nombre || item.name || item.label || String(item.id);
                    const option = document.createElement('option');
                    option.value = label;
                    option.textContent = label;
                    selectInsumo.appendChild(option);
                });
                console.log('✓ Fragancias cargadas:', resultado.data.length);
            } else {
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'No hay insumos disponibles';
                selectInsumo.appendChild(option);
                console.log('Aviso: no se encontraron fragancias en la API');
            }
        } else {
            console.error('Error al cargar fragancias:', resultado.message);
        }
    } catch (error) {
        console.error('Error al conectar con la API de fragancias:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    /* Cargar fragancias e proveedores dinámicamente */
    cargarFragances();
    cargarProveedores();
    
    const btnGuardar = document.getElementById('btnGuardarRecarga');
    const btnLimpiar = document.getElementById('btnLimpiar');
    
    if (btnGuardar) {
        btnGuardar.addEventListener('click', guardarRecarga);
    }
    
    if (btnLimpiar) {
        btnLimpiar.addEventListener('click', limpiarFormulario);
    }
});

