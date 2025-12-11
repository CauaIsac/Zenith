// favorites.js - modal + carregamento dos favoritos por usuário
console.log("favorites.js carregado ✅");

// --- PEGAR USER ID DO LOCALSTORAGE ---
const userId = localStorage.getItem("zenith_user_id") || "guest";
const FAVORITES_KEY = `favoritos_${userId}`;

// -------------------------
// HELPERS DE PREÇO
// -------------------------
/**
 * Recebe um valor "raw" (ex: "R$ 1.200.000,00", "1200000", "1.200.000", "6.5M")
 * Tenta normalizar para número e retorna a string formatada em pt-BR com 2 casas.
 * Se não for possível converter para número, retorna a string limpa (raw sem R$).
 */
function normalizeAndFormatPrice(raw) {
  if (raw == null) return "0,00";
  // Se for número já
  if (typeof raw === "number" && !isNaN(raw)) {
    return Number(raw).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  let s = String(raw);

  // Remove possíveis "R$" e espaços iniciais/finais
  s = s.replace(/^R\$\s*/i, "").trim();

  // Remove tudo que não seja dígito, ponto ou vírgula
  const only = s.replace(/[^0-9.,]/g, "");

  // Se vazio, retorno fallback
  if (!only) return s;

  // Caso contenha 'M' ou 'K' (ex: 6.5M), tratamos
  const suffixMatch = String(raw).match(/([0-9.,]+)\s*([mMkK])/);
  if (suffixMatch) {
    let numPart = suffixMatch[1].replace(/\./g, "").replace(",", ".");
    let n = parseFloat(numPart);
    if (!isNaN(n)) {
      const mul = /k/i.test(suffixMatch[2]) ? 1e3 : 1e6;
      return (n * mul).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
  }

  // Normal path: ex "1.200.000,00" -> remove dots, replace comma por ponto -> parseFloat
  let numeric = parseFloat(only.replace(/\./g, "").replace(",", "."));

  if (isNaN(numeric)) {
    // tente parse simples (caso "1200000")
    numeric = parseFloat(only);
  }

  if (isNaN(numeric)) {
    // não conseguiu converter, retorna apenas a "limpeza" (sem R$)
    return only || s;
  }

  // retorna formatado pt-BR com 2 casas
  return numeric.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// -------------------------
// MIGRAÇÃO: corrige favoritos antigos (ao carregar o script)
// -------------------------
(function migrateFavoritesFormatting() {
  try {
    let favoritos = JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];
    let changed = false;

    favoritos = favoritos.map(f => {
      if (!f) return f;
      // se já tiver price e estiver "formatado" com ponto ou vírgula, ainda tentamos normalizar
      const orig = f.price ?? "";
      const newPrice = normalizeAndFormatPrice(orig);
      if (String(newPrice) !== String(orig)) {
        changed = true;
        return { ...f, price: newPrice };
      }
      return f;
    });

    if (changed) {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favoritos));
      console.log("favorites.js: migração de formatação de preço executada.");
    }
  } catch (e) {
    console.warn("favorites.js: erro na migração de favoritos:", e);
  }
})();


// --- ELEMENTOS DO MODAL ---
const openModalBtn = document.querySelector("a.a-nav i.bi-heart-fill")?.parentElement;
let modal = document.getElementById("favoritesModal");
const closeModalBtn = document.getElementById("closeFavoritesModal");

// Garante que favoritesContainer exista
let favoritesContainer = document.getElementById("favoritesContainer");
if (!favoritesContainer) {
  favoritesContainer = document.createElement("div");
  favoritesContainer.id = "favoritesContainer";
  favoritesContainer.style.display = "block";
  document.body.appendChild(favoritesContainer);
}

const closeBtn = document.getElementById("closeFavoritesModal") || closeModalBtn;

// --- ABRIR MODAL ---
if (openModalBtn) {
 openModalBtn.addEventListener("click", async (e) => {
  e.preventDefault();
  await cleanInvalidFavorites(); // ⬅ LIMPA
  loadFavorites();               // ⬅ CARREGA ATUALIZADO
  if (modal) modal.style.display = "block";
});
}

// --- FECHAR MODAL ---
if (closeBtn) {
  closeBtn.addEventListener("click", () => { if (modal) modal.style.display = "none"; });
}

if (modal) {
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });
}

// ---------------------------------------------------------------------------------
// --- CAPTURA CLIQUES NO BOTÃO DE FAVORITOS (CORAÇÃO) ---
// ---------------------------------------------------------------------------------
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".favorite-btn");
  if (!btn) return;

  const card = btn.closest(".car-card");
  if (!card) return;

  const carId = card.dataset.cardId;
  const name = card.querySelector(".car-name")?.innerText || "Sem nome";
  let rawPrice = card.querySelector(".car-price")?.innerText || "0";
  const image = card.querySelector(".slide-img")?.src || "assets/img/placeholder.png";

  // Normaliza/formata o preço ANTES de salvar
  const price = normalizeAndFormatPrice(rawPrice);

  //  CARREGA FAVORITOS DO USUÁRIO ATUAL
  let favoritos = JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];

  //  VERIFICA SE JÁ EXISTE
  const existe = favoritos.find(f => String(f.id) === String(carId));

  if (existe) {
    console.log("Carro já está nos favoritos");
    return;
  }

  //  ADICIONA NOVO FAVORITO (price já formatado em pt-BR, ex: "1.200.000,00")
  favoritos.push({ id: carId, name, price, image });

  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favoritos));

  // MARCA O BOTÃO
  btn.classList.add("favorited");
});

//------------------------------------------------------
// --- REMOVE FAVORITOS DE CARROS EXCLUÍDOS DO BANCO ---
//------------------------------------------------------
async function cleanInvalidFavorites() {
  let favoritos = JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];

  if (favoritos.length === 0) return;

  // Busca IDs reais ainda existentes
  const { data: cars, error } = await supabase
    .from("inventory_cars")
    .select("id");

  if (error) {
    console.error("Erro ao verificar carros existentes:", error);
    return;
  }

  const existingIds = cars.map(c => String(c.id));

  // Filtra somente favoritos que ainda existem no banco
  const filtrados = favoritos.filter(f => existingIds.includes(String(f.id)));

  // Se mudou algo, salva e atualiza modal
  if (filtrados.length !== favoritos.length) {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(filtrados));
  }
}

// ---------------------------------------------------------------------------------
// --- CARREGAR FAVORITOS NO MODAL ---
// ---------------------------------------------------------------------------------
function loadFavorites() {
  favoritesContainer = document.getElementById("favoritesContainer");
  if (!favoritesContainer) return;

  favoritesContainer.innerHTML = "";

  let favoritos = JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];

  if (favoritos.length === 0) {
    favoritesContainer.innerHTML = "<p>Você ainda não favoritou nenhum carro.</p>";
    return;
  }

  favoritos.forEach(fav => {
    const div = document.createElement("div");
    div.classList.add("fav-row");

    // assegura que o preço exibido esteja formatado e sem "R$"
    const displayPrice = typeof fav.price === "string" ? fav.price : String(fav.price);
    const formattedPrice = normalizeAndFormatPrice(displayPrice);

    div.innerHTML = `
      <div class="fav-card">
        
        <!-- ESQUERDA: imagem -->
        <div class="fav-img-wrapper">
          <img src="${fav.image}" class="fav-img" alt="${fav.name}">
        </div>

        <!-- CENTRO: infos -->
        <div class="fav-info">
          <h4 class="car-name">${fav.name}</h4>
          <div class="car-price">R$ ${formattedPrice}</div>
        </div>

        <!-- DIREITA: botões -->
        <div class="fav-actions">
          <a href="car-detail.html?id=${fav.id}" class="rent-btn">Detalhes</a>
          <button class="remove-btn">Remover</button>
        </div>

      </div>
    `;

    favoritesContainer.appendChild(div);

    // Evento remover
    div.querySelector(".remove-btn").addEventListener("click", () => {
      let lista = JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];
      lista = lista.filter(f => String(f.id) !== String(fav.id));
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(lista));
      loadFavorites();

      const card = document.querySelector(`.car-card[data-card-id="${fav.id}"]`);
      if (card) card.querySelector(".favorite-btn")?.classList.remove("favorited");
    });
  });
}
