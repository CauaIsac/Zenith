document.addEventListener('DOMContentLoaded', () => {
    // 1. Seleciona os elementos principais
    const searchForm = document.getElementById('searchForm');
    const searchInput = document.getElementById('searchInput');
    const searchButton = searchForm.querySelector('.search-btn');
    const cardContainer = document.querySelector('.card-container'); // Onde os resultados são exibidos

    // =========================================================================
    // FUNÇÕES DE UI (ABRIR/FECHAR BARRA DE PESQUISA)
    // =========================================================================

    function openSearchBar() {
        if (!searchForm.classList.contains('open')) {
            searchForm.classList.add('open');
            setTimeout(() => {
                searchInput.focus();
            }, 300);
        }
    }

    function closeSearchBar() {
        // A barra só fecha se o campo de input estiver vazio.
        if (searchInput.value === '') {
            searchForm.classList.remove('open');
            searchInput.blur();
        }
    }

    // =========================================================================
    // FUNÇÃO DE RENDERIZAÇÃO DOS CARDS (USADA APÓS A BUSCA)
    // =========================================================================

    function renderizarCardsDeVeiculos(veiculos) {
        cardContainer.innerHTML = ''; // Limpa os resultados anteriores

        if (veiculos.length === 0) {
            cardContainer.innerHTML = '<p style="text-align: center; width: 100%; color: #333;">Nenhum veículo encontrado para este termo.</p>';
            return;
        }

        veiculos.forEach(veiculo => {
            // Usa .toLocaleString('pt-BR') para formatar o preço como moeda brasileira
            const precoFormatado = veiculo.price ? veiculo.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'Preço sob consulta';

            const cardHTML = `
                <div class="card-item" data-brand="${veiculo.brand}" data-name="${veiculo.name}">
                    <img src="${veiculo.image_url}" alt="${veiculo.name}">
                    <h3>${veiculo.name}</h3>
                    <p>Marca: ${veiculo.brand}</p>
                    <p class="price">${precoFormatado}</p>
                    </div>
            `;
            // Recomenda-se usar insertAdjacentHTML em vez de += para melhor performance
            cardContainer.insertAdjacentHTML('beforeend', cardHTML);
        });
    }

    // =========================================================================
    // FUNÇÃO DE BUSCA NO SUPABASE (COM SUA LÓGICA DE TABELA/COLUNAS)
    // =========================================================================

    async function pesquisarVeiculosNoSupabase(termo) {
        if (typeof supabase === 'undefined') {
            console.error("Erro: Cliente Supabase não encontrado.");
            return;
        }

        // Converte o termo para minúsculas para garantir que a busca 'ilike' funcione bem
        const termoBusca = termo.toLowerCase();

        const { data, error } = await supabase
            .from('inventory_cars')
            .select('*')
            // Busca que verifica se o termo está no 'name' OU na 'brand'
            .or(`name.ilike.%${termoBusca}%,brand.ilike.%${termoBusca}%`);

        if (error) {
            console.error('Erro ao pesquisar veículos:', error);
            cardContainer.innerHTML = '<p style="text-align: center; width: 100%; color: red;">Erro ao carregar resultados da busca.</p>';
            return;
        }

        // Renderiza os resultados
        renderizarCardsDeVeiculos(data);
    }

    // NOTA: Você precisará de uma função para carregar todos os veículos
    // (carregarTodosOsVeiculos) e chamar essa função quando o site iniciar ou quando a busca for vazia.

    // =========================================================================
    // EVENT LISTENERS PARA INTERAÇÃO
    // =========================================================================

    // A. Ação: Ao clicar no botão (lupa) - Abre a barra
    searchButton.addEventListener('click', (event) => {
        if (!searchForm.classList.contains('open')) {
            event.preventDefault();
            openSearchBar();
        }
    });

    // B. Ação: Ao focar no campo - Abre a barra
    searchInput.addEventListener('focus', openSearchBar);

    // C. Ação: Ao perder o foco - Fecha a barra se estiver vazia
    searchInput.addEventListener('blur', closeSearchBar);

    // D. Ação: Fechar com a tecla ESC
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && searchForm.classList.contains('open')) {
            closeSearchBar();
        }
    });

    // E. Ação: Lidar com o envio do formulário (executa a busca no Supabase)
    searchForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Impede o recarregamento da página

        const termo = searchInput.value.trim();

        if (termo === "") {
            console.log("Campo vazio. Você deve carregar todos os veículos aqui.");
            // Chame sua função de carregamento inicial/total aqui
            // carregarTodosOsVeiculos(); 
            return;
        }

        // Chama a função que faz a comunicação com o Supabase
        pesquisarVeiculosNoSupabase(termo);

        // Opcional: Fechar a barra após a busca se não for necessário que ela fique aberta
        // closeSearchBar(); 
    });
});