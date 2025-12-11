// parceiros.js
// Requer: supabase (cliente inicializado em supabaseClient.js)
// Opcionalmente reutiliza: createCarCard(card), setupCarousel(card), setupFavoriteButton(card, car)

// ==================== CONFIGURAÇÃO ====================
const PARTNER_BRANDS = ["Ferrari", "BMW", "Lamborghini", "Mercedes", "Porsche"];
// ids dos containers esperados: #loja-ferrari, #loja-bmw, etc.
// home container padrão: .card-container (como na sua homepage)

// ==================== HELPERS ====================
function brandToId(brand) {
  return `loja-${String(brand).toLowerCase().trim().replace(/\s+/g, "-")}`;
}

function hasCreateCard() {
  return typeof window.createCarCard === "function";
}

// Fallback simples para criar um card (caso createCarCard não exista)
function createCardFallback(car) {
  const card = document.createElement("div");
  card.className = "car-card dynamic " + (car.type || "");
  card.dataset.cardId = String(car.id);

  const price = !isNaN(Number(car.price)) ? `R$ ${Number(car.price).toLocaleString("pt-BR")}` : (car.price || "");
  const img = car.imagem_1 || car.imagem_2 || car.imagem_3 || "assets/img/placeholder.png";

  card.innerHTML = `
    <div class="card-image">
      <img src="${img}" alt="${car.name || car.modelo || 'Veículo'}" class="slide-img active">
      <button class="favorite-btn" aria-label="Adicionar aos favoritos" type="button"><i class="bi bi-heart-fill"></i></button>
    </div>
    <div class="card-content">
      <h3 class="car-name">${car.name || car.modelo || ''}</h3>
      <p class="car-details">${car.details || car.descricao || ''}</p>
      <div class="card-footer">
        <span class="car-price">${price}</span>
        <a href="car-detail.html?id=${car.id}" class="rent-btn" data-id="${car.id}">Detalhes</a>
      </div>
    </div>
  `;

  // try to init favorite & carousel (if those functions exist)
  if (typeof window.setupCarousel === "function") {
    try { window.setupCarousel(card); } catch (e) { /* ignore */ }
  }
  if (typeof window.setupFavoriteButton === "function") {
    try { window.setupFavoriteButton(card, car); } catch (e) { /* ignore */ }
  }

  // attach details click
  const detalhesBtn = card.querySelector(".rent-btn");
  if (detalhesBtn) {
    detalhesBtn.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.href = `car-detail.html?id=${car.id}`;
    });
  }

  return card;
}

// ==================== MAIN ====================
async function carregarParceirosUmaVez() {
  // garantir que supabase exista
  if (!window.supabase) {
    console.error("parceiros.js: supabase não encontrado. Carregue supabaseClient.js antes deste arquivo.");
    return;
  }

  // detecta se a página é uma página específica de marca via <body data-brand="Ferrari">
  const bodyBrand = document.body.getAttribute("data-brand");
  const onlyThisBrand = bodyBrand ? String(bodyBrand).trim() : null;

  // decide quais marcas buscar: se página marca específica, busca apenas ela
  const marcasParaBuscar = onlyThisBrand ? [onlyThisBrand] : PARTNER_BRANDS;

  try {
    // busca todos os carros para as marcas solicitadas de uma só vez
    const { data, error } = await supabase
      .from("inventory_cars")
      .select("*")
      .in("brand", marcasParaBuscar)
      .order("id", { ascending: false });

    if (error) {
      console.error("Erro ao buscar carros das marcas parceiras:", error);
      return;
    }

    if (!data || data.length === 0) {
      // nada para mostrar — podemos limpar containers se quiser
      marcasParaBuscar.forEach(b => {
        const c = document.getElementById(brandToId(b));
        if (c) c.innerHTML = "<p>Nenhum veículo desta marca no momento.</p>";
      });
      return;
    }

    // mapeia cars por brand (normalize brand key)
    const carsByBrand = {};
    data.forEach(car => {
      const key = String(car.brand || "").trim();
      if (!carsByBrand[key]) carsByBrand[key] = [];
      carsByBrand[key].push(car);
    });

    // 1) Inserir na home caso exista container
    const homeContainer = document.querySelector(".card-container");
    if (homeContainer && !onlyThisBrand) {
      // se a página for a home, ou se existir um container global, também adiciona
      data.forEach(car => {
        const node = hasCreateCard() ? window.createCarCard(car) : createCardFallback(car);
        homeContainer.appendChild(node);
      });
    }

    // 2) Inserir em cada container de parceiro
    Object.keys(carsByBrand).forEach(brandKey => {
      const normalized = brandKey; // ex: "Ferrari"
      const containerId = brandToId(normalized);
      const container = document.getElementById(containerId);

      // se não houver container na página atual, ignora (essa página não é da marca)
      if (!container) return;

      // limpa container antes
      container.innerHTML = "";

      carsByBrand[brandKey].forEach(car => {
        const node = hasCreateCard() ? window.createCarCard(car) : createCardFallback(car);
        container.appendChild(node);
      });
    });

  } catch (e) {
    console.error("parceiros.js erro inesperado:", e);
  }
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

// roda quando DOM estiver pronto
document.addEventListener("DOMContentLoaded", carregarParceirosUmaVez);
