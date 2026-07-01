/* ============================================================
   Praessia — faq-accordion.js
   Acordeón de preguntas frecuentes.
   Usado por: preguntas_frecuentes.html
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  const items = document.querySelectorAll('.faq-item');

  items.forEach(item => {
    const button = item.querySelector('.faq-question');

    button.addEventListener('click', () => {
      // Cerrar todas las demás
      items.forEach(other => {
        if (other !== item) {
          other.classList.remove('active');
        }
      });

      // Abrir / cerrar la actual
      item.classList.toggle('active');
    });
  });
});
