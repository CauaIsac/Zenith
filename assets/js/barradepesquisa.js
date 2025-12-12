document.addEventListener('DOMContentLoaded', () => {
    // 1. Seleciona os elementos principais
    const searchForm = document.getElementById('searchForm');
    const searchInput = document.getElementById('searchInput');
    const searchButton = searchForm.querySelector('.search-btn');
    const cardContainer = document.querySelector('.card-container'); // Onde os resultados são exibidos

    // --- VARIÁVEL DE AJUDA PARA CHECAR SE ESTAMOS NA HOMEPAGE ---
    // IMPORTANTE: Ajuste 'homepage.html' para o nome exato do seu arquivo
    // ou use '/' se a homepage for a raiz do seu site.
    const estaNaHomePage = window.location.pathname.endsWith('homepage.html') || window.location.pathname === '/'; 

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
        // Verifica a disponibilidade do cliente Supabase ANTES de tentar a busca
        if (typeof supabase === 'undefined' || !supabase.from) {
            console.error("Erro: Cliente Supabase não encontrado ou não inicializado. Não foi possível executar a busca.");
            cardContainer.innerHTML = '<p style="text-align: center; width: 100%; color: red;">Erro: Falha na conexão com o banco de dados.</p>';
            return;
        }

        // Converte o termo para minúsculas para garantir que a busca 'ilike' funcione bem
        const termoBusca = termo.toLowerCase();
        
        console.log(`Buscando por: ${termoBusca}`); // Log de depuração

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

    // E. Ação: Lidar com o envio do formulário (executa a busca ou REDIRECIONA)
    searchForm.addEventListener('submit', (event) => {
        const termo = searchInput.value.trim();

        if (termo === "") {
            console.log("Campo vazio. Você deve carregar todos os veículos aqui.");
            event.preventDefault(); // Impede o envio se estiver vazio
            // carregarTodosOsVeiculos(); 
            return;
        }

        if (estaNaHomePage) {
            // Se estiver na homepage, executa a busca imediatamente
            event.preventDefault(); 
            pesquisarVeiculosNoSupabase(termo);
        } else {
            // Se NÃO estiver na homepage, redireciona com o termo na URL.
            // O formulário DEVE ter method="GET" no HTML.
            
            // Define a URL de redirecionamento para a homepage, passando a busca como parâmetro 'busca'
            const urlRedirecionamento = `homepage.html?busca=${encodeURIComponent(termo)}`;
            
            // Impedimos o submit padrão e forçamos o redirecionamento via JS
            event.preventDefault(); 
            window.location.href = urlRedirecionamento;
        }
    });

    // =========================================================================
    // LÓGICA DE BUSCA APÓS REDIRECIONAMENTO (EXECUTA APENAS NA HOMEPAGE)
    // =========================================================================
    
    let tentativas = 0; // Contador de tentativas para evitar loop infinito
    const maxTentativas = 10;
    
    function verificarBuscaURL() {
        const params = new URLSearchParams(window.location.search);
        const termoBuscaURL = params.get('busca');

        // Se não houver termo de busca na URL, encerra a função
        if (!termoBuscaURL) {
            if (estaNaHomePage) {
                console.log("Homepage carregada sem termo de busca. Carregar todos os veículos (Função carregarTodosOsVeiculos() deve ser implementada).");
                // carregarTodosOsVeiculos(); 
            }
            return;
        }

        // TENTATIVA DE EXECUÇÃO DA BUSCA
        if (typeof supabase !== 'undefined' && supabase.from) {
            // Cliente Supabase está pronto!

            // 1. Executa a pesquisa com o termo da URL
            pesquisarVeiculosNoSupabase(termoBuscaURL);

            // 2. Preenche o campo de input com o termo (para o usuário ver)
            searchInput.value = termoBuscaURL;
            
            // 3. Abre a barra de pesquisa 
            openSearchBar();

            // 4. Limpa o parâmetro 'busca' da URL (opcional, mas recomendado)
            const novaURL = window.location.pathname;
            history.replaceState(null, '', novaURL);
            
        } else if (tentativas < maxTentativas) {
            // Cliente Supabase AINDA NÃO está pronto, tenta novamente em breve
            tentativas++;
            console.log(`Supabase ainda não pronto. Tentativa ${tentativas}/${maxTentativas}. Aguardando...`);
            // Aguarda 300ms e tenta novamente
            setTimeout(verificarBuscaURL, 300);
        } else {
            // Excedeu o máximo de tentativas
            console.error("Erro fatal: Cliente Supabase não carregou após várias tentativas. Não foi possível executar a busca redirecionada.");
            cardContainer.innerHTML = '<p style="text-align: center; width: 100%; color: red;">Erro: Falha crítica na inicialização do sistema de busca.</p>';
        }
    }
    
    // Chamada inicial para verificar a URL quando a página carrega
    if (estaNaHomePage) {
        verificarBuscaURL();
    }
}); // Fim do DOMContentLoaded