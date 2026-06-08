// Lógica da Área do Funcionário
// Gerencia a visualização e entrega dos pedidos

const funcionario = {
    activeTab: 'pedidos',

    renderizarFuncionario: function() {
        resetDoDiaSeNecessario();
        this.renderizarPedidos();
        this.renderizarEstoque();
        this.renderizarCaixa();
        this.mostrarSecao(this.activeTab);
    },

    mostrarSecao: function(tab) {
        this.activeTab = tab;
        const sections = document.querySelectorAll('.func-section');
        sections.forEach(sec => sec.classList.toggle('active', sec.id === `${tab}-section`));

        const buttons = document.querySelectorAll('.func-footer-menu button');
        buttons.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tab));
    },

    renderizarCaixa: function() {
        const caixaContainer = document.getElementById('cash-section');
        const totalVendas = obterTotalVendas();
        const totalPedidos = obterPedidos().length;
        const dataHoje = getDataAtual();
        const historico = obterHistoricoVendas();

        const historicoHtml = historico.slice(0, 3).map(item => `
            <div class="history-item">
                <strong>${item.date}</strong>
                <span>${item.pedidos} pedidos</span>
                <span>R$ ${item.total.toFixed(2)}</span>
            </div>
        `).join('');

        caixaContainer.innerHTML = `
            <div class="card">
                <h3>Controle de Caixa</h3>
                <p>Data: <strong>${dataHoje}</strong></p>
                <p>Total de pedidos hoje: <strong>${totalPedidos}</strong></p>
                <p>Valor total vendido hoje: <strong>R$ ${totalVendas.toFixed(2)}</strong></p>
                <div class="history-card">
                    <h4>Vendas dos dias anteriores</h4>
                    ${historicoHtml || '<p>Nenhum registro anterior</p>'}
                </div>
            </div>
        `;
    },

    renderizarEstoque: function() {
        const estoqueContainer = document.getElementById('stock-section');
        const produtos = obterProdutos();

        const produtosHtml = produtos.map(prod => `
            <div class="stock-card">
                <div class="stock-card-header">
                    <h3>${prod.nome}</h3>
                    <span class="price-tag">R$ ${prod.preco.toFixed(2)}</span>
                </div>
                <div class="stock-card-body">
                    <div class="stock-info">
                        <label>Quantidade em estoque:</label>
                        <input id="stock-qty-${prod.id}" type="number" min="0" value="${prod.estoque}" class="qty-input" />
                    </div>
                    <button class="btn btn-primary btn-sm" onclick="funcionario.atualizarEstoque(${prod.id})">Salvar</button>
                </div>
            </div>
        `).join('');

        const estoqueHtml = `
            <div class="card">
                <h3>Controle de Estoque</h3>
                <div class="add-product-section">
                    <h4>Adicionar novo sabor</h4>
                    <div class="stock-actions">
                        <input id="new-product-name" type="text" placeholder="Nome da esfirra" />
                        <input id="new-product-quantity" type="number" min="1" placeholder="Quantidade inicial" />
                        <button class="btn btn-gold btn-sm" onclick="funcionario.adicionarProdutoEstoque()">➕ Adicionar</button>
                    </div>
                </div>
                <div class="products-grid">
                    ${produtosHtml}
                </div>
            </div>
        `;

        estoqueContainer.innerHTML = estoqueHtml;
    },

    adicionarProdutoEstoque: function() {
        const nomeInput = document.getElementById('new-product-name');
        const quantidadeInput = document.getElementById('new-product-quantity');
        const nome = nomeInput.value.trim();
        const quantidade = Number(quantidadeInput.value);

        if (!nome || quantidade <= 0) {
            app.mostrarToast('Digite nome e quantidade válidos', true);
            return;
        }

        const novoId = DB.produtos.length ? Math.max(...DB.produtos.map(p => p.id)) + 1 : 1;
        DB.produtos.push({ id: novoId, nome, preco: 11.00, estoque: quantidade });
        salvarBanco();
        nomeInput.value = '';
        quantidadeInput.value = '';
        this.renderizarEstoque();
        app.mostrarToast('Produto adicionado ao estoque');
    },

    atualizarEstoque: function(id) {
        const input = document.getElementById(`stock-qty-${id}`);
        const novoValor = Number(input.value);
        if (isNaN(novoValor) || novoValor < 0) {
            app.mostrarToast('Quantidade inválida', true);
            return;
        }
        const produto = DB.produtos.find(p => p.id === id);
        if (!produto) return;
        produto.estoque = novoValor;
        salvarBanco();
        this.renderizarEstoque();
        app.mostrarToast(`Estoque de ${produto.nome} atualizado para ${novoValor}`);
    },

    renderizarPedidos: function() {
        const lista = document.getElementById('pedidos-section');
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
                    <div class="order-header">
                        <div>
                            <h3>${pedido.aluno}</h3>
                            <span class="status-badge ${isEntregue ? 'status-delivered' : 'status-pending'}">${pedido.status}</span>
                        </div>
                        <span class="gold-text">${pedido.id}</span>
                    </div>
                    <ul class="order-items">${itensHtml}</ul>
                    <div class="order-footer">
                        <strong>Total: R$ ${pedido.total.toFixed(2)}</strong>
                        <span>${pedido.data}</span>
                    </div>
                    ${!isEntregue ? `
                        <button class="btn btn-primary btn-sm" onclick="funcionario.confirmarEntrega('${pedido.id}')">CONFIRMAR ENTREGA</button>
                    ` : ''}
                </div>
            `;
            lista.innerHTML += pedidoHtml;
        });
    },

    confirmarEntrega: function(id) {
        if (marcarComoEntregue(id)) {
            app.mostrarToast('Pedido entregue!');
            this.renderizarPedidos();
            this.renderizarCaixa();
        }
    }
};
