var swiper = new Swiper(".mySwiper", {
  slidesPerView: 1, // 1 card por vez no celular
  spaceBetween: 30,
  loop: true, // Carrossel infinito
  pagination: {
    el: ".swiper-pagination",
    clickable: true,
  },
  navigation: {
    nextEl: ".swiper-button-next",
    prevEl: ".swiper-button-prev",
  },
  breakpoints: {
    // Quando a tela for maior que 768px (Tablet/PC)
    768: {
      slidesPerView: 2,
    },
    // Quando a tela for maior que 1024px
    1024: {
      slidesPerView: 3,
    },
  },
});