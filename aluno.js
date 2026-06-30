// Lógica da Área do Aluno
// Gerencia o carrinho de compras e a exibição de produtos

const aluno = {
    carrinho: [],

    // Renderiza a lista de produtos na interface do aluno
    // parametro: nenhum
    // retorno: insere o HTML dos produtos no elemento #product-list
    renderizarProdutos: function() {
        const lista = document.getElementById('product-list');
        const produtos = obterProdutos();
        
        lista.innerHTML = '';
        
        produtos.forEach(prod => {
            const semEstoque = prod.estoque <= 0;
            const itemHtml = `
                <div class="product-item">
                    <div class="product-info">
                        <h3>${prod.nome}</h3>
                        <p class="gold-text">R$ ${prod.preco.toFixed(2)}</p>
                        <span class="stock-tag ${semEstoque ? 'out-of-stock' : ''}">
                            Estoque: ${prod.estoque}
                        </span>
                    </div>
                    <button 
                        class="btn btn-gold" 
                        style="width: auto; padding: 10px;"
                        onclick="aluno.adicionarAoCarrinho(${prod.id})"
                        ${semEstoque ? 'disabled' : ''}
                    >
                        ${semEstoque ? 'Esgotado' : 'Adicionar'}
                    </button>
                </div>
            `;
            lista.innerHTML += itemHtml;
        });
    },

    // Adiciona um item ao carrinho se houver estoque
    // parametro: id do produto
    // retorno: atualiza o carrinho e a interface
    adicionarAoCarrinho: function(id) {
        const produtos = obterProdutos();
        const produto = produtos.find(p => p.id === id);

        if (produto && produto.estoque > 0) {
            this.carrinho.push(produto);
            app.mostrarToast(`${produto.nome} adicionado!`);
            this.atualizarInterfaceCarrinho();
        } else {
            app.mostrarToast("Desculpe, item sem estoque!", true);
        }
    },

    // Atualiza o contador de itens e visibilidade da barra de checkout
    // parametro: nenhum
    // retorno: altera o DOM (visibilidade e texto)
    atualizarInterfaceCarrinho: function() {
        const container = document.getElementById('cart-container');
        const contador = document.getElementById('cart-count');
        
        if (this.carrinho.length > 0) {
            container.style.display = 'flex';
            contador.innerText = this.carrinho.length;
        } else {
            container.style.display = 'none';
        }
    },

    // Finaliza o pedido do aluno
    // parametro: nenhum
    // retorno: limpa o carrinho e envia para o "servidor"
    finalizarPedido: function() {
        if (this.carrinho.length === 0) return;

        const produtos = obterProdutos();
        const quantidadePorProduto = this.carrinho.reduce((acc, item) => {
            acc[item.id] = (acc[item.id] || 0) + 1;
            return acc;
        }, {});

        const itensSemEstoque = [];
        const itensDisponiveis = [];

        Object.keys(quantidadePorProduto).forEach(id => {
            const produto = produtos.find(p => p.id === Number(id));
            const quantidadeSolicitada = quantidadePorProduto[id];
            const quantidadeDisponivel = produto ? produto.estoque : 0;

            if (!produto || quantidadeDisponivel === 0) {
                itensSemEstoque.push(`${this.carrinho.find(item => item.id === Number(id)).nome}`);
            } else if (quantidadeSolicitada > quantidadeDisponivel) {
                itensSemEstoque.push(`${produto.nome} (apenas ${quantidadeDisponivel} disponível)`);
                itensDisponiveis.push(...Array(quantidadeDisponivel).fill(produto));
            } else {
                itensDisponiveis.push(...Array(quantidadeSolicitada).fill(produto));
            }
        });

        if (itensSemEstoque.length > 0) {
            const mensagem = `Os seguintes itens estão sem estoque:\n- ${itensSemEstoque.join('\n- ')}\n\nDeseja concluir o pedido apenas com os itens disponíveis?`;
            if (itensDisponiveis.length === 0) {
                app.mostrarToast("Não há itens disponíveis para finalizar o pedido.", true);
                return;
            }

            const confirmar = window.confirm(mensagem);
            if (!confirmar) {
                return;
            }

            this.carrinho = itensDisponiveis;
        }

        if (this.carrinho.length === 0) {
            app.mostrarToast("Nenhum item disponível no momento.", true);
            return;
        }

        const total = this.carrinho.reduce((sum, item) => sum + item.preco, 0);
        const nomeAluno = app.usuarioLogado || document.getElementById('user-name').value || "Aluno";

        const pedidoRealizado = salvarPedido({
            aluno: nomeAluno,
            itens: this.carrinho,
            total: total
        });

        if (pedidoRealizado) {
            app.mostrarToast("Pedido enviado com sucesso! ✅");
            this.carrinho = [];
            this.atualizarInterfaceCarrinho();
            this.renderizarProdutos(); // Atualiza estoque na tela
        }
    }
};
