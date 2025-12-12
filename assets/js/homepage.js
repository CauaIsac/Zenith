// homepage.js - versão completa com Busca em Tempo Real (Live Search), Debounce, Redirecionamento Direto e SCROLL APENAS NO SUBMIT

console.log("homepage.js carregado ✅");

// --- CONTAINER DOS CARDS ---
const cardContainer = document.querySelector(".card-container");
// --- ELEMENTOS DA BARRA DE PESQUISA ---
const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');
const searchButton = searchForm.querySelector('.search-btn');


// =========================================================================
// FUNÇÃO DE UTILIDADE: DEBOUNCE
// =========================================================================

/**
 * Cria uma função debounce que atrasa a execução da função fornecida
 * até que se passe um determinado tempo sem novas chamadas.
 */
function debounce(func, delay) {
  let timeout;
  return function (...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), delay);
  };
}


// =========================================================================
// FUNÇÕES DE UTILIDADE E UI (FAVORITOS, CARROSSEL, BARRA DE PESQUISA)
// =========================================================================

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
  const filtrados = favoritos.filter(f => existingIds.includes(String(f.id)));

  if (filtrados.length !== favoritos.length) {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(filtrados));
    console.log("Favoritos inválidos removidos na homepage.");
  }
}

// --- FUNÇÃO PARA CRIAR CARD ---
function createCarCard(car) {
  const images = [car.imagem_1, car.imagem_2, car.imagem_3].filter(Boolean);

  const card = document.createElement("div");
  card.classList.add("car-card", "dynamic", car.type);
  card.dataset.cardId = String(car.id);

  let preco = car.price;
  let precoFormatado;
  if (!isNaN(Number(preco))) {
    precoFormatado = Number(preco).toLocaleString("pt-BR");
  } else {
    precoFormatado = preco;
  }

  card.innerHTML = `
        <div class="card-image">
            <div class="carousel-slides">
                ${images.length > 0
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

  setupCarousel(card);
  setupFavoriteButton(card, car);

  const detalhesBtn = card.querySelector(".rent-btn");
  detalhesBtn.addEventListener("click", (e) => {
    e.preventDefault();
    window.location.href = `car-detail.html?id=${car.id}`;
  });

  return card;
}

// --- CAROUSEL (Mantida) ---
function setupCarousel(card) {
  const slides = card.querySelectorAll(".slide-img");
  const prevBtn = card.querySelector(".prev-btn");
  const nextBtn = card.querySelector(".next-btn");

  if (!slides.length) return;

  let currentIndex = 0;

  function showSlide(index) {
    slides.forEach((s, i) => s.classList.toggle("active", i === index));
  }

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

// --- FAVORITOS (Mantida) ---
function setupFavoriteButton(card, car) {
  const favBtn = card.querySelector(".favorite-btn");
  if (!favBtn) return;

  const userId = localStorage.getItem("zenith_user_id") || "guest";
  const FAVORITES_KEY = `favoritos_${userId}`;

  let favoritos = JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];

  const isFav = favoritos.some(f => String(f.id) === String(car.id));
  if (isFav) favBtn.classList.add("favorited");

  favBtn.addEventListener("click", (e) => {
    e.stopPropagation();

    let favoritos = JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];
    const index = favoritos.findIndex(f => String(f.id) === String(car.id));

    if (index > -1) {
      favoritos.splice(index, 1);
      favBtn.classList.remove("favorited");
      if (typeof showToast === "function") showToast(`${car.name} removido dos favoritos.`, "info");
    } else {
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

// --- FUNÇÕES DA BARRA DE PESQUISA (UI) ---
function openSearchBar() {
  if (!searchForm.classList.contains('open')) {
    searchForm.classList.add('open');
    setTimeout(() => {
      searchInput.focus();
    }, 300);
  }
}

function closeSearchBar() {
  if (searchInput.value === '') {
    searchForm.classList.remove('open');
    searchInput.blur();
  }
}

// =========================================================================
// FUNÇÕES DE CARREGAMENTO E BUSCA (INTEGRAÇÃO COM SUPABASE)
// =========================================================================

// --- FUNÇÃO PARA RENDERIZAR E LIMPAR O CONTAINER (SCROLL REMOVIDO) ---
function renderizarCardsDeVeiculos(veiculos) {
  cardContainer.innerHTML = '';

  if (veiculos.length === 0) {
    cardContainer.innerHTML = '<p style="text-align: center; width: 100%; padding: 20px; color: #ccc;">Nenhum veículo encontrado para este termo. 😔</p>';
  } else {
    veiculos.forEach((car) => {
      const card = createCarCard(car);
      cardContainer.appendChild(card);
    });
  }

  // O SCROLL FOI REMOVIDO DESTA FUNÇÃO para ser controlado apenas no submit
}

// --- FUNÇÃO PARA BUSCAR TODOS OS VEÍCULOS (Retorna os dados) ---
async function fetchAllCars() {
  if (typeof supabase === 'undefined') {
    console.error("Erro: Cliente Supabase não encontrado.");
    return [];
  }
  try {
    const { data, error } = await supabase
      .from("inventory_cars")
      .select("*")
      .order("id", { ascending: false });

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Erro ao carregar veículos:", err.message);
    cardContainer.innerHTML = '<p style="text-align: center; width: 100%; padding: 20px; color: red;">Falha ao carregar veículos iniciais.</p>';
    return [];
  }
}

// --- FUNÇÃO PARA BUSCAR TODOS OS VEÍCULOS E RENDERIZAR (Inicialização/Recarga) ---
async function loadCars() {
  const data = await fetchAllCars();
  renderizarCardsDeVeiculos(data);
}


// --- FUNÇÃO PRINCIPAL DE BUSCA NO SUPABASE (Retorna os dados, não renderiza) ---
async function fetchFilteredCars(termo) {
  if (typeof supabase === 'undefined') {
    console.error("Erro: Cliente Supabase não encontrado.");
    return [];
  }

  const termoBusca = termo.toLowerCase();

  try {
    const { data, error } = await supabase
      .from('inventory_cars')
      .select('*')
      .or(`name.ilike.%${termoBusca}%,brand.ilike.%${termoBusca}%`);

    if (error) throw error;
    return data; // Retorna o array de veículos
  } catch (error) {
    console.error('Erro ao pesquisar veículos:', error.message);
    return [];
  }
}

// --- FUNÇÃO PARA LIDAR COM A LÓGICA DE BUSCA (Live Search) ---
async function handleLiveSearch(termo) {
  const termoTratado = termo.trim();
  if (termoTratado === "") {
    await loadCars();
    return;
  }
  // Live Search: Apenas renderiza, NÃO ROLA
  const results = await fetchFilteredCars(termoTratado);
  renderizarCardsDeVeiculos(results);
}


// --- FILTRO LATERAL (Mantido) ---
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


// =========================================================================
// EVENT LISTENERS E INICIALIZAÇÃO
// =========================================================================

const debouncedLiveSearch = debounce(handleLiveSearch, 500);

document.addEventListener("DOMContentLoaded", async () => {
  // A. LIMPEZA E CARREGAMENTO INICIAL
  await cleanInvalidFavoritesHome();
  await loadCars(); // Carrega todos os cards na inicialização
  setupFilters(); // Configura os botões de filtro lateral

  // B. EVENTOS DA BARRA DE PESQUISA (UI)
  searchButton.addEventListener('click', (event) => {
    if (!searchForm.classList.contains('open')) {
      event.preventDefault();
      openSearchBar();
    }
  });

  searchInput.addEventListener('focus', openSearchBar);
  searchInput.addEventListener('blur', closeSearchBar);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && searchForm.classList.contains('open')) {
      closeSearchBar();
    }
  });

  // C. BUSCA EM TEMPO REAL NO EVENTO 'INPUT'
  searchInput.addEventListener('input', (event) => {
    debouncedLiveSearch(event.target.value);
  });


  // D. SUBMISSÃO DO FORMULÁRIO (REDIRECIONAMENTO DIRETO OU SCROLL)
  searchForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const termo = searchInput.value.trim();

    if (termo === "") {
      await loadCars();
      return;
    }

    // 1. Executa a busca imediatamente
    const results = await fetchFilteredCars(termo);

    // 2. Verifica a contagem de resultados
    if (results.length === 1) {
      // Se houver 1 resultado, redireciona diretamente
      const carId = results[0].id;
      console.log(`Redirecionando diretamente para o produto ID: ${carId}`);
      window.location.href = `car-detail.html?id=${carId}`;
    } else {
      // Se houver 0 ou mais de 1 resultado: renderiza e ROLA
      console.log(`Busca finalizada: ${results.length} resultados. Renderizando na página.`);
      renderizarCardsDeVeiculos(results);

      // 🚨 Rola a página APÓS a renderização (só acontece no submit/Enter)
      if (cardContainer) {
        cardContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
    closeSearchBar();
  });
});