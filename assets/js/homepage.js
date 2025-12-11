// homepage.js - versão corrigida para favoritos + carrossel
console.log("homepage.js carregado ✅");

// --- LIMPAR FAVORITOS DE CARROS QUE NÃO EXISTEM MAIS ---
async function cleanInvalidFavoritesHome() {
  const userId = localStorage.getItem("zenith_user_id") || "guest";
  const FAVORITES_KEY = `favoritos_${userId}`;

  let favoritos = JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];
  if (favoritos.length === 0) return;

  // Buscar IDs existentes no banco
  const { data: cars, error } = await supabase
    .from("inventory_cars")
    .select("id");

  if (error) {
    console.error("Erro ao verificar carros existentes:", error);
    return;
  }

  const existingIds = cars.map(c => String(c.id));

  // Mantém apenas favoritos válidos
  const filtrados = favoritos.filter(f =>
    existingIds.includes(String(f.id))
  );

  if (filtrados.length !== favoritos.length) {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(filtrados));
    console.log("Favoritos inválidos removidos na homepage.");
  }
}


// --- CONTAINER DOS CARDS ---
const cardContainer = document.querySelector(".card-container");

// --- FUNÇÃO PARA CRIAR CARD ---
function createCarCard(car) {
  // Usa as novas colunas de imagem
  const images = [car.imagem_1, car.imagem_2, car.imagem_3].filter(Boolean);

  const card = document.createElement("div");
  card.classList.add("car-card", "dynamic", car.type);
  // ADICIONA data-card-id para o favorites.js identificar
  card.dataset.cardId = String(car.id);

  // --- PREÇO FORMATADO ---
  let preco = car.price;
  let precoFormatado;
  if (!isNaN(Number(preco))) {
    precoFormatado = Number(preco).toLocaleString("pt-BR");
  } else {
    precoFormatado = preco; // mantém texto tipo "7M"
  }

  // --- HTML DO CARD ---
  card.innerHTML = `
    <div class="card-image">
      <div class="carousel-slides">
        ${
          images.length > 0
            ? images
                .map(
                  (img, i) =>
                    `<img src="${img.trim()}" class="slide-img ${i === 0 ? "active" : ""}" alt="${car.name}">`
                )
                .join("")
            : `<img src="assets/img/placeholder.png" class="slide-img active" alt="sem imagem">`
        }
      </div>
      <button class="carousel-btn prev-btn" type="button">❮</button>
      <button class="carousel-btn next-btn" type="button">❯</button>
      <button class="favorite-btn" aria-label="Adicionar aos favoritos" type="button">
        <i class="bi bi-heart-fill"></i>
      </button>
    </div>

    <div class="card-content">
      <h3 class="car-name">${car.name}</h3>
      <p class="car-details">${car.details || ""}</p>
      <div class="card-footer">
        <span class="car-price">R$ ${precoFormatado}</span>
        <a href="#" class="rent-btn" data-id="${car.id}">Detalhes</a>
      </div>
    </div>
  `;

  // --- Inicializa funcionalidades do card ---
  setupCarousel(card);
  setupFavoriteButton(card, car);

  // Redireciona ao clicar em "Detalhes"
  const detalhesBtn = card.querySelector(".rent-btn");
  detalhesBtn.addEventListener("click", (e) => {
    e.preventDefault();
    window.location.href = `car-detail.html?id=${car.id}`;
  });

  return card;
}

// --- CAROUSEL ---
function setupCarousel(card) {
  const slides = card.querySelectorAll(".slide-img");
  const prevBtn = card.querySelector(".prev-btn");
  const nextBtn = card.querySelector(".next-btn");

  if (!slides.length) return;

  let currentIndex = 0;

  function showSlide(index) {
    slides.forEach((s, i) => s.classList.toggle("active", i === index));
  }

  // Oculta botões se houver só uma imagem
  if (slides.length <= 1) {
    prevBtn.style.display = "none";
    nextBtn.style.display = "none";
  }

  prevBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    currentIndex = (currentIndex - 1 + slides.length) % slides.length;
    showSlide(currentIndex);
  });

  nextBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    currentIndex = (currentIndex + 1) % slides.length;
    showSlide(currentIndex);
  });
}

// --- FAVORITOS (por card, usando FAVORITES_KEY) ---
function setupFavoriteButton(card, car) {
  const favBtn = card.querySelector(".favorite-btn");
  if (!favBtn) return;

  // Pega o ID do usuário atual (o mesmo do favorites.js)
  const userId = localStorage.getItem("zenith_user_id") || "guest";
  const FAVORITES_KEY = `favoritos_${userId}`;

  let favoritos = JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];

  // Se já está favoritado, marca o botão
  const isFav = favoritos.some(f => String(f.id) === String(car.id));
  if (isFav) favBtn.classList.add("favorited");

  favBtn.addEventListener("click", (e) => {
    e.stopPropagation();

    let favoritos = JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];
    const index = favoritos.findIndex(f => String(f.id) === String(car.id));

    if (index > -1) {
      // REMOVE
      favoritos.splice(index, 1);
      favBtn.classList.remove("favorited");
      if (typeof showToast === "function") showToast(`${car.name} removido dos favoritos.`, "info");
    } else {
      // ADICIONA
      favoritos.push({
        id: String(car.id),
        name: car.name,
        price: car.price,
        image: car.imagem_1 || "assets/img/placeholder.png"
      });

      favBtn.classList.add("favorited");
      if (typeof showToast === "function") showToast(`${car.name} adicionado aos favoritos!`, "success");
    }

    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favoritos));
  });
}

// --- FUNÇÃO PARA CARREGAR VEÍCULOS ---
async function loadCars() {
  try {
    const { data, error } = await supabase
      .from("inventory_cars")
      .select("*")
      .order("id", { ascending: false });

    if (error) throw error;

    // Remove cards dinâmicos anteriores
    document.querySelectorAll(".car-card.dynamic").forEach((c) => c.remove());

    data.forEach((car) => {
      const card = createCarCard(car);
      cardContainer.appendChild(card);
    });
  } catch (err) {
    console.error("Erro ao carregar veículos:", err.message);
  }
}

// --- FILTRO ---
function setupFilters() {
  const filterButtons = document.querySelectorAll(".filter-btn");

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const filter = btn.dataset.filter;

      document.querySelectorAll(".car-card").forEach((card) => {
        card.style.display =
          filter === "all" || card.classList.contains(filter)
            ? "block"
            : "none";
      });

      filterButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });
}

// --- INICIALIZAÇÃO ---
document.addEventListener("DOMContentLoaded", async () => {
  await cleanInvalidFavoritesHome();  // <-- limpa favoritos inválidos
  await loadCars();
  setupFilters();
});
