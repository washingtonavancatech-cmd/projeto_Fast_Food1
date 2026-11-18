// Variáveis Globais de Estado
let listaProdutos = [];
let carrinho = JSON.parse(localStorage.getItem('carrinhoFastFood')) || [];
let categoriaAtual = 'todos';

// Seletores do DOM
const gridProdutos = document.getElementById('grid-produtos');
const msgCarregando = document.getElementById('mensagem-carregando');
const inputBusca = document.getElementById('input-busca');
const botoesCategoria = document.querySelectorAll('.btn-categoria');
const contadorCarrinho = document.getElementById('contador-carrinho');
const modalCarrinho = document.getElementById('modal-carrinho');
const itensCarrinhoDiv = document.getElementById('itens-carrinho');
const valorSubtotalSpan = document.getElementById('valor-subtotal');
const valorTotalSpan = document.getElementById('valor-total');
const selectPagamento = document.getElementById('forma-pagamento');
const detalhePagamento = document.getElementById('detalhe-pagamento');

// 1. Consome a API Pública TheMealDB para obter exatamente 12 alimentos
async function carregarCardapioAPI() {
    try {
        const buscas = [
            { termo: 'burger', categoria: 'burgers', rotulo: 'Hambúrgueres', preco: 28.90 },
            { termo: 'chicken', categoria: 'acompanhamentos', rotulo: 'Acompanhamentos', preco: 21.90 },
            { termo: 'cake', categoria: 'sobremesas', rotulo: 'Sobremesas', preco: 15.90 },
            { termo: 'shake', categoria: 'bebidas', rotulo: 'Bebidas', preco: 13.90 }
        ];

        let idContador = 1;

        for (const item of buscas) {
            const resposta = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${item.termo}`);
            const dados = await resposta.json();

            if (dados.meals) {
                const tresItens = dados.meals.slice(0, 3);
                tresItens.forEach((prato, index) => {
                    listaProdutos.push({
                        id: idContador++,
                        nome: prato.strMeal,
                        imagem: prato.strMealThumb,
                        categoria: item.categoria,
                        rotuloCategoria: item.rotulo,
                        calorias: 350 + (idContador * 35),
                        preco: parseFloat((item.preco + (index * 3.50)).toFixed(2))
                    });
                });
            }
        }

        listaProdutos = listaProdutos.slice(0, 12);
        msgCarregando.style.display = 'none';
        filtrarEExibirProdutos();
        atualizarCarrinho();

    } catch (erro) {
        msgCarregando.innerText = 'Erro ao carregar os dados da API. Verifique sua conexão.';
        console.error(erro);
    }
}

// 2. Renderiza os cards na tela
function renderizarCards(produtos) {
    gridProdutos.innerHTML = '';

    if (produtos.length === 0) {
        gridProdutos.innerHTML = '<p style="grid-column: 1/-1; text-align:center;">Nenhum lanche encontrado.</p>';
        return;
    }

    produtos.forEach(produto => {
        const card = document.createElement('article');
        card.classList.add('card');

        card.innerHTML = `
            <div class="card-img-container">
                <img src="${produto.imagem}" alt="${produto.nome}" loading="lazy">
                <span class="badge-kcal">🔥 ~${produto.calorias} kcal</span>
            </div>
            <div class="card-info">
                <span class="tag-categoria-card">${produto.rotuloCategoria}</span>
                <h3>${produto.nome}</h3>
                <p class="card-preco">R$ ${produto.preco.toFixed(2).replace('.', ',')}</p>
                <button class="btn-adicionar" onclick="adicionarAoCarrinho(${produto.id})">
                    <i class="fas fa-cart-plus"></i> Adicionar ao Pedido
                </button>
            </div>
        `;

        gridProdutos.appendChild(card);
    });
}

// 3. Filtrar por Categoria e Barra de Pesquisa
function filtrarEExibirProdutos() {
    const textoBusca = inputBusca.value.toLowerCase().trim();

    const produtosFiltrados = listaProdutos.filter(produto => {
        const correspondeCategoria = (categoriaAtual === 'todos') || (produto.categoria === categoriaAtual);
        const correspondeBusca = produto.nome.toLowerCase().includes(textoBusca);
        return correspondeCategoria && correspondeBusca;
    });

    renderizarCards(produtosFiltrados);
}

// Eventos de Filtro e Busca
botoesCategoria.forEach(botao => {
    botao.addEventListener('click', () => {
        botoesCategoria.forEach(b => b.classList.remove('ativo'));
        botao.classList.add('ativo');
        categoriaAtual = botao.getAttribute('data-categoria');
        filtrarEExibirProdutos();
    });
});

inputBusca.addEventListener('input', filtrarEExibirProdutos);

// 4. Lógica do Carrinho de Compras (Com laço while e localStorage)
function adicionarAoCarrinho(idProduto) {
    const itemExistente = carrinho.find(item => item.id === idProduto);

    if (itemExistente) {
        itemExistente.quantidade += 1;
    } else {
        const produto = listaProdutos.find(p => p.id === idProduto);
        if (produto) {
            carrinho.push({ ...produto, quantidade: 1 });
        }
    }

    salvarEAtualizarCarrinho();
    mostrarToast();
}

function alterarQuantidade(idProduto, delta) {
    const indice = carrinho.findIndex(item => item.id === idProduto);
    if (indice !== -1) {
        carrinho[indice].quantidade += delta;
        if (carrinho[indice].quantidade <= 0) {
            carrinho.splice(indice, 1);
        }
        salvarEAtualizarCarrinho();
    }
}

function salvarEAtualizarCarrinho() {
    localStorage.setItem('carrinhoFastFood', JSON.stringify(carrinho));
    atualizarCarrinho();
}

function atualizarCarrinho() {
    itensCarrinhoDiv.innerHTML = '';
    let totalItens = 0;
    let somaTotal = 0;
    let i = 0;

    // Utilizando o laço while()
    while (i < carrinho.length) {
        const item = carrinho[i];
        totalItens += item.quantidade;
        const subtotal = item.preco * item.quantidade;
        somaTotal += subtotal;

        const divItem = document.createElement('div');
        divItem.classList.add('item-carrinho');
        divItem.innerHTML = `
            <div>
                <strong>${item.nome}</strong><br>
                <small>R$ ${item.preco.toFixed(2).replace('.', ',')} un</small>
            </div>
            <div class="controles-qtd">
                <button class="btn-qtd" onclick="alterarQuantidade(${item.id}, -1)">-</button>
                <span><strong>${item.quantidade}</strong></span>
                <button class="btn-qtd" onclick="alterarQuantidade(${item.id}, 1)">+</button>
            </div>
        `;
        itensCarrinhoDiv.appendChild(divItem);
        i++;
    }

    if (carrinho.length === 0) {
        itensCarrinhoDiv.innerHTML = '<p>Seu carrinho está vazio. Escolha um lanche!</p>';
    }

    contadorCarrinho.innerText = totalItens;
    const valorFormatado = somaTotal.toFixed(2).replace('.', ',');
    valorSubtotalSpan.innerText = valorFormatado;
    valorTotalSpan.innerText = valorFormatado;
}

function mostrarToast() {
    const toast = document.getElementById('toast-aviso');
    toast.classList.add('mostrar');
    setTimeout(() => {
        toast.classList.remove('mostrar');
    }, 2000);
}

// 5. Formas de Pagamento e Modal
selectPagamento.addEventListener('change', () => {
    const metodo = selectPagamento.value;
    if (metodo === 'PIX') {
        detalhePagamento.innerHTML = `<p>🔑 Chave PIX (CNPJ): <strong>12.345.678/0001-99</strong></p>`;
    } else if (metodo === 'Dinheiro') {
        detalhePagamento.innerHTML = `<input type="text" id="troco" placeholder="Troco para quanto? (Ex: R$ 50,00)">`;
    } else {
        detalhePagamento.innerHTML = `<p>💳 A maquininha será levada até você na entrega (${metodo}).</p>`;
    }
});

document.getElementById('btn-abrir-carrinho').addEventListener('click', () => {
    modalCarrinho.style.display = 'flex';
});

document.getElementById('btn-fechar-carrinho').addEventListener('click', () => {
    modalCarrinho.style.display = 'none';
});

document.getElementById('btn-finalizar').addEventListener('click', () => {
    if (carrinho.length === 0) {
        alert('Seu carrinho está vazio!');
        return;
    }

    const pagamento = selectPagamento.value;
    const total = valorTotalSpan.innerText;
    const inputTroco = document.getElementById('troco');
    const infoTroco = (inputTroco && inputTroco.value) ? `
Troco para: ${inputTroco.value}` : '';

    alert(`🎉 Pedido Realizado com Sucesso!

Total: R$ ${total}
Pagamento: ${pagamento}${infoTroco}

Obrigado por comprar conosco!`);

    carrinho = [];
    salvarEAtualizarCarrinho();
    modalCarrinho.style.display = 'none';
});

// 6. Acessibilidade (Tema escuro, fonte e leitura em voz alta)
document.getElementById('btn-tema').addEventListener('click', () => {
    document.body.classList.toggle('tema-escuro');
});

let tamanhoFonte = 16;
document.getElementById('btn-aumentar-fonte').addEventListener('click', () => {
    if (tamanhoFonte < 22) {
        tamanhoFonte += 2;
        document.documentElement.style.setProperty('--tamanho-fonte', `${tamanhoFonte}px`);
    }
});

document.getElementById('btn-diminuir-fonte').addEventListener('click', () => {
    if (tamanhoFonte > 12) {
        tamanhoFonte -= 2;
        document.documentElement.style.setProperty('--tamanho-fonte', `${tamanhoFonte}px`);
    }
});

document.getElementById('btn-ler-texto').addEventListener('click', () => {
    window.speechSynthesis.cancel();
    const mensagem = "Bem-vindo à Burger e Grill Fast Food. Explore nossos 12 lanches artesanais, categorias variadas, monte seu carrinho e faça seu pedido com entrega rápida.";
    const fala = new SpeechSynthesisUtterance(mensagem);
    fala.lang = 'pt-BR';
    window.speechSynthesis.speak(fala);
});

// Inicialização da aplicação
carregarCardapioAPI();