var swiper = new Swiper(".mySwiper", {
  slidesPerView: 1,
  spaceBetween: 30,
  loop: true,
  pagination: {
    el: ".swiper-pagination",
    clickable: true,
  },
  navigation: {
    nextEl: ".swiper-button-next",
    prevEl: ".swiper-button-prev",
  },
  autoplay: {
    delay: 7000,
    disableOnInteraction: false, // continua mesmo se o usuário interagir
  },
});

//teste card carros

function setupCarouselsWithGSAP() {
    // 1. Seleciona todos os cards
    const cards = document.querySelectorAll('.car-card');

    cards.forEach((card, index) => {
        const slidesContainer = card.querySelector('.carousel-slides');
        const slides = card.querySelectorAll('.slide-img');
        const prevButton = card.querySelector('.prev-btn');
        const nextButton = card.querySelector('.next-btn');

        // Se o card não tem elementos de carrossel, pula para o próximo
        if (!slides.length || !prevButton || !nextButton) return;
        
        // Estado inicial
        let currentSlide = 0;
        const totalSlides = slides.length;

        // 2. Função principal para ANIMAR a troca de slide
        function showSlide(newSlideIndex) {
            // Calcula o índice, garantindo o loop infinito
            if (newSlideIndex >= totalSlides) {
                newSlideIndex = 0; 
            } else if (newSlideIndex < 0) {
                newSlideIndex = totalSlides - 1; 
            }
            
            currentSlide = newSlideIndex;

            // Calcula a distância que o contêiner deve se mover (em porcentagem)
            const offset = -currentSlide * 100;
            
            // GSAP entra em ação: anima o transform
            gsap.to(slidesContainer, {
                x: `${offset}%`, // Move no eixo X
                duration: 0.5, // Duração da animação em segundos
                ease: "power2.out" // Curva de aceleração/desaceleração
            });
        }

        // 3. Adiciona os eventos de clique
        nextButton.addEventListener('click', () => {
            showSlide(currentSlide + 1);
        });

        prevButton.addEventListener('click', () => {
            showSlide(currentSlide - 1);
        });
        
        // Garante que o CSS inicial seja correto
        slidesContainer.style.transform = 'translateX(0%)';
    });
}
