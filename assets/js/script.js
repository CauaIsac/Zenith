// ================= CARROSSEL DE FUNDO =================
const images = [
  "assets/img/ferrari-purosangue.png",
  "assets/img/mercedesG63.png",
  "assets/img/porsche-cayman.png",
  "assets/img/bmwX6.png",
  "assets/img/urus.png"
];

let currentIndex = 0;
const carousel = document.querySelector(".background-carousel");

// Inicializa com a primeira imagem
if (carousel) {
  carousel.style.backgroundImage = `url(${images[currentIndex]})`;

  setInterval(() => {
    currentIndex = (currentIndex + 1) % images.length;
    carousel.style.backgroundImage = `url(${images[currentIndex]})`;
  }, 2500);
}

// ================= TROCA DE IMAGEM PRINCIPAL =================
window.addEventListener('DOMContentLoaded', () => {
  const mainImage = document.getElementById('mainCarImage');
  const thumbnails = document.querySelectorAll('#imageThumbnails img');

  if (!mainImage || thumbnails.length === 0) return;

  // Garante que a primeira miniatura esteja ativa
  thumbnails[0].classList.add('active');
  mainImage.src = thumbnails[0].src;
  mainImage.alt = thumbnails[0].alt;

  // Adiciona evento de clique a cada miniatura
  thumbnails.forEach(thumbnail => {
    thumbnail.addEventListener('click', () => {
      thumbnails.forEach(img => img.classList.remove('active'));
      thumbnail.classList.add('active');
      mainImage.src = thumbnail.src;
      mainImage.alt = thumbnail.alt;
    });
  });
});
