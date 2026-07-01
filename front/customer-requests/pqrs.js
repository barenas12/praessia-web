/* ============================================================
   Praessia — pqrs.js
   Formulario PQRS: radicado automático y envío vía EmailJS.
   Usado por: pqrs.html
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('pqrsForm');

  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Generar radicado
    const radicado = `PRS-${Date.now().toString().slice(-6)}`;
    document.getElementById('radicado').value = radicado;
    document.getElementById('fecha').value = new Date().toLocaleDateString();

    form.classList.add('sending');

    emailjs.sendForm(
      'TU_SERVICE_ID',
      'TU_TEMPLATE_ID',
      form
    )
      .then(() => {
        form.classList.remove('sending');
        form.reset();

        alert(
          `Solicitud enviada correctamente.\n` +
          `Número de radicado: ${radicado}`
        );
      })
      .catch(() => {
        form.classList.remove('sending');
        alert('No fue posible enviar la solicitud. Inténtalo nuevamente.');
      });
  });
});
