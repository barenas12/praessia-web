/* ============================================================
   Praessia — animations.js
   Observer de animación fade-up al hacer scroll.
   Usado por: quienes_somos.html, test.html, exploration.html
   y cualquier página que use la clase .fade-up
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.fade-up').forEach(function (el) {
    observer.observe(el);
  });

});
