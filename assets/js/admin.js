// --- REFERÊNCIAS ---
const addCarForm = document.getElementById('addCarForm');
const carsList = document.getElementById('carsList');
const logoutButton = document.getElementById('logoutButton');
const brandFilter = document.getElementById('brandFilter'); // <-- NOVO: Referência para o campo de filtro

// --- LISTENER DO FILTRO ---
// Chama a função fetchCars() a cada alteração no input para filtrar em tempo real
brandFilter.addEventListener('input', fetchCars); 
// -------------------------

// --- FUNÇÃO PARA LISTAR CARROS/MOTOS ---
async function fetchCars() {
    // 1. Obtém o valor do filtro e normaliza (minúsculas, sem espaços)
    const filterValue = brandFilter.value.toLowerCase().trim();

    // 2. Monta a query base
    let query = supabase
        .from('inventory_cars')
        .select('*');

    // 3. Adiciona a cláusula de filtro se houver algo digitado
    if (filterValue) {
        // Usa 'ilike' para pesquisa case-insensitive e '%...%' para buscar o texto em qualquer parte do campo 'brand'
        query = query.ilike('brand', `%${filterValue}%`);
    }

    // 4. Finaliza a query com a ordenação
    const { data, error } = await query
        .order('id', { ascending: false });

    if (error) {
        console.error('Erro ao buscar carros:', error);
        showToast('Erro ao buscar veículos: ' + error.message, 'error');
        return;
    }

    carsList.innerHTML = '';

    data.forEach(car => {
        const carDiv = document.createElement('div');
        carDiv.classList.add('car-item');

        // Lógica para pegar todas as imagens (antigas e novas)
        const imagens = [
            car.imagem_1,
            car.imagem_2,
            car.imagem_3,
            ...(car.images ? (typeof car.images === 'string' ? car.images.split(',') : car.images) : [])
        ].filter(Boolean);

        carDiv.innerHTML = `
            <div>
                <h3>${car.name}</h3>
                <p><strong>Marca:</strong> ${car.brand} | <strong>Tipo:</strong> ${car.type}</p>
                <p><strong>Preço:</strong> R$ ${car.price}</p>
                <p>${car.details ? car.details : '—'}</p>
                <p><strong>Vendedor:</strong> ${car.vendedor ? car.vendedor : '—'}</p>
                <p><strong>Localização:</strong> ${car.localizacao ? car.localizacao : '—'}</p>
                
                <div class="image-previews">
                    ${imagens.length ? imagens.map(url => `<img src="${url.trim()}" width="100" alt="Imagem do veículo">`).join('') : ''}
                </div>
            </div>
            <div class="actions">
                <button data-id="${car.id}" class="edit-btn">Editar</button>
                <button data-id="${car.id}" class="delete-btn">Remover</button>
            </div>
        `;
        carsList.appendChild(carDiv);
    });

    // Adiciona os listeners de evento após a renderização
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            const id = e.target.dataset.id;
            // Usa a função showConfirm que deve estar no seu arquivo confirm-modal.js
            await deleteCar(id);
        });
    });

    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            const id = e.target.dataset.id;
            openEditModal(id);
        });
    });
}

// --- FUNÇÃO PARA ADICIONAR CARRO/MOTO ---
addCarForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(addCarForm);
    const name = formData.get('name');
    const brand = formData.get('brand');
    const type = formData.get('type');
    const price = formData.get('price');
    const details = formData.get('details');
    const descricao = formData.get('descricao');
    const vendedor = formData.get('vendedor');
    const localizacao = formData.get('localizacao');
    const imagem_1 = formData.get('imagem_1');
    const imagem_2 = formData.get('imagem_2');
    const imagem_3 = formData.get('imagem_3');
    const highlight = formData.get('highlight') === 'on';

    const { data, error } = await supabase
        .from('inventory_cars')
        .insert([{
            name, brand, type, price, details,
            descricao, vendedor, localizacao,
            imagem_1, imagem_2, imagem_3,
            highlight
        }])
        .select();

    if (error) {
        showToast('Erro ao adicionar veículo: ' + error.message, 'error');
        return;
    }

    showToast('Veículo adicionado com sucesso!', 'success');
    addCarForm.reset();
    fetchCars(); // Recarrega a lista
});

// --- FUNÇÃO PARA REMOVER CARRO ---
async function deleteCar(id) {
    // showConfirm deve ser uma função definida no seu 'confirm-modal.js'
    const confirmation = await showConfirm('Tem certeza que deseja remover este veículo?');
    if (!confirmation) return;

    const { error } = await supabase
        .from('inventory_cars')
        .delete()
        .eq('id', id);

    if (error) {
        showToast('Erro ao remover veículo: ' + error.message, 'error');
        return;
    }

    showToast('Veículo removido!', 'success');
    fetchCars(); // Recarrega a lista
}

// --- FUNÇÃO PARA ABRIR MODAL DE EDIÇÃO ---
async function openEditModal(id) {
    const { data, error } = await supabase
        .from('inventory_cars')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        showToast('Erro ao buscar veículo: ' + error.message, 'error');
        return;
    }

    const imagens = [
        data.imagem_1 || '',
        data.imagem_2 || '',
        data.imagem_3 || ''
    ];

    const modal = document.createElement('div');
    modal.classList.add('edit-modal');
    modal.innerHTML = `
        <form id="editCarForm">
            <h3>Editar ${data.name}</h3>
            <input type="text" name="name" value="${data.name}" required>
            <input type="text" name="brand" value="${data.brand}" required>
            <select name="type" required>
                <option value="carro" ${data.type==='carro'?'selected':''}>Carro</option>
                <option value="moto" ${data.type==='moto'?'selected':''}>Moto</option>
            </select>
            <input type="text" name="price" value="${data.price}" required>
            <input type="text" name="details" value="${data.details ? data.details : ''}" placeholder="Detalhes adicionais">
            <textarea name="descricao" rows="3" placeholder="Descrição completa">${data.descricao || ''}</textarea>
            <input type="text" name="vendedor" value="${data.vendedor || ''}" placeholder="Vendedor">
            <input type="text" name="localizacao" value="${data.localizacao || ''}" placeholder="Localização">
            <input type="url" name="imagem_1" value="${imagens[0]}" placeholder="URL da imagem principal">
            <input type="url" name="imagem_2" value="${imagens[1]}" placeholder="URL da segunda imagem">
            <input type="url" name="imagem_3" value="${imagens[2]}" placeholder="URL da terceira imagem">
            <label>
               
            <button type="submit">Salvar alterações</button>
            <button type="button" id="closeModal">Cancelar</button>
        </form>
    `;
    document.body.appendChild(modal);

    document.getElementById('closeModal').addEventListener('click', () => {
        modal.remove();
    });

    document.getElementById('editCarForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const updated = {
            name: formData.get('name'),
            brand: formData.get('brand'),
            type: formData.get('type'),
            price: formData.get('price'),
            details: formData.get('details'),
            descricao: formData.get('descricao'),
            vendedor: formData.get('vendedor'),
            localizacao: formData.get('localizacao'),
            imagem_1: formData.get('imagem_1'),
            imagem_2: formData.get('imagem_2'),
            imagem_3: formData.get('imagem_3'),
            highlight: formData.get('highlight') === 'on'
        };

        const { error } = await supabase
            .from('inventory_cars')
            .update(updated)
            .eq('id', id);

        if (error) {
            showToast('Erro ao atualizar veículo: ' + error.message, 'error');
            return;
        }

        showToast('Veículo atualizado!', 'success');
        modal.remove();
        fetchCars(); // Recarrega a lista
    });
}

// --- LOGOUT ---
logoutButton.addEventListener('click', () => {
    // Nota: Se estiver usando autenticação via Supabase, o ideal é usar `supabase.auth.signOut()`
    // Antes de redirecionar, mas seguindo seu código original, apenas redireciona.
    window.location.href = 'index.html'; 
});

// --- INICIALIZAÇÃO ---
fetchCars();