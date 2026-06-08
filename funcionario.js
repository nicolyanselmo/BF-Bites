// Lógica da Área do Funcionário
// Gerencia a visualização e entrega dos pedidos

const funcionario = {
    
    // Renderiza o resumo de caixa do funcionário
    // parametro: nenhum
    // retorno: exibe total de vendas e pedidos realizados
    renderizarCaixa: function() {
        const caixaContainer = document.getElementById('cash-summary');
        const totalVendas = obterTotalVendas();
        const totalPedidos = obterPedidos().length;

        const caixaHtml = `
            <div class="card">
                <h3>Controle de Caixa</h3>
                <p>Total de pedidos: <strong>${totalPedidos}</strong></p>
                <p>Valor total das vendas: <strong>R$ ${totalVendas.toFixed(2)}</strong></p>
            </div>
        `;

        caixaContainer.innerHTML = caixaHtml;
    },

    // Renderiza o controle de estoque e o painel de pedidos do funcionário
    // parametro: nenhum
    // retorno: atualiza o estoque e os pedidos na interface
    renderizarEstoque: function() {
        const estoqueContainer = document.getElementById('stock-summary');
        const produtos = obterProdutos();

        let estoqueHtml = `
            <div class="card">
                <h3>Controle de Estoque</h3>
                ${produtos.map(prod => `
                    <div class="product-item">
                        <div class="product-info">
                            <h3>${prod.nome}</h3>
                            <span class="stock-tag ${prod.estoque <= 0 ? 'out-of-stock' : ''}">
                                Estoque: ${prod.estoque}
                            </span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        estoqueContainer.innerHTML = estoqueHtml;
    },

    // Renderiza todos os pedidos na tela do funcionário
    // parametro: nenhum
    // retorno: insere cards de pedidos no elemento #orders-list
    renderizarPedidos: function() {
        this.renderizarCaixa();
        this.renderizarEstoque();
        const lista = document.getElementById('orders-list');
        const pedidos = obterPedidos();

        if (pedidos.length === 0) {
            lista.innerHTML = '<div class="card"><p style="text-align:center">Nenhum pedido no momento.</p></div>';
            return;
        }

        lista.innerHTML = '';
        pedidos.forEach(pedido => {
            const isEntregue = pedido.status === 'entregue';
            const itensHtml = pedido.itens.map(item => `<li>${item.nome}</li>`).join('');

            const pedidoHtml = `
                <div class="card order-card ${isEntregue ? 'delivered' : ''}">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div>
                            <h3>${pedido.aluno}</h3>
                            <span class="status-badge ${isEntregue ? 'status-delivered' : 'status-pending'}">
                                ${pedido.status}
                            </span>
                        </div>
                        <span class="gold-text">${pedido.id}</span>
                    </div>
                    
                    <ul style="margin: 15px 0; padding-left: 20px; font-size: 0.9rem;">
                        ${itensHtml}
                    </ul>
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px;">
                        <strong>Total: R$ ${pedido.total.toFixed(2)}</strong>
                        <span style="font-size: 0.8rem; color: #777;">${pedido.data}</span>
                    </div>

                    ${!isEntregue ? `
                        <button class="btn btn-primary" style="margin-top: 15px; background: #27ae60;" 
                                onclick="funcionario.confirmarEntrega('${pedido.id}')">
                            CONFIRMAR ENTREGA
                        </button>
                    ` : ''}
                </div>
            `;
            lista.innerHTML += pedidoHtml;
        });
    },

    // Marca um pedido como entregue e atualiza a tela
    // parametro: id do pedido
    // retorno: atualiza a lista de pedidos na interface
    confirmarEntrega: function(id) {
        if (marcarComoEntregue(id)) {
            app.mostrarToast("Pedido entregue!");
            this.renderizarPedidos();
        }
    }
};
