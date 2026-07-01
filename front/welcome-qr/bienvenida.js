/* ============================================================
   Praessia — bienvenida.js
   Animación de entrada en secuencia para la página de
   bienvenida por QR de empaque físico.
   Usado por: bienvenida_qr.html
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {

  const secuencia = [
    document.querySelector('.qr-logo'),
    document.querySelector('.qr-welcome'),
    document.querySelector('.qr-hero h1'),
    document.querySelector('.qr-intro'),
    document.querySelector('.qr-divider'),
    document.querySelector('.qr-btn-primary'),
    document.querySelector('.qr-btn-secondary'),
    document.querySelector('.qr-footer-note'),
  ];

  secuencia.forEach(function (el, index) {
    if (!el) return;
    el.classList.add('qr-hidden');
    setTimeout(function () {
      el.classList.add('qr-visible');
    }, 180 * index);
  });

});
