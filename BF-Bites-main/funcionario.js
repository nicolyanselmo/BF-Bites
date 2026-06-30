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

    renderizarPedidos: function() {
        const lista = document.getElementById('pedidos-section');
        const pedidos = obterPedidos();

        if (pedidos.length === 0) {
            lista.innerHTML = '<div class="card"><p style="text-align:center">Nenhum pedido no momento.</p></div>';
            return;
        }

        lista.innerHTML = '<div class="card"><h3>Pedidos Recebidos</h3></div>';
        pedidos.forEach(pedido => {
            const isEntregue = pedido.status === 'entregue';
            const isRecusado = pedido.status === 'recusado';
            const statusClass = pedido.status === 'entregue' ? 'status-delivered' : (pedido.status === 'recusado' ? 'status-refused' : 'status-pending');
            const cardClass = isEntregue ? 'delivered' : (isRecusado ? 'refused' : '');
            const itensHtml = pedido.itens.map(item => `<li>${item.nome}</li>`).join('');

            const pedidoHtml = `
                <div class="card order-card ${cardClass}">
                    <div class="order-header">
                        <div>
                            <h3>${pedido.aluno}</h3>
                            <span class="status-badge ${statusClass}">${pedido.status}</span>
                        </div>
                        <span class="gold-text">${pedido.id}</span>
                    </div>
                    <ul class="order-items">${itensHtml}</ul>
                    <div class="order-footer">
                        <strong>Total: R$ ${pedido.total.toFixed(2)}</strong>
                        <span>${pedido.data}</span>
                    </div>
                    ${pedido.status === 'pendente' ? `
                        <div style="display: flex; gap: 10px;">
                            <button class="btn btn-primary btn-sm" style="margin: 0;" onclick="funcionario.confirmarEntrega('${pedido.id}')">ACEITAR PEDIDO</button>
                            <button class="btn btn-outline btn-sm" style="margin: 0; border-color: var(--error); color: var(--error);" onclick="funcionario.confirmarRecusa('${pedido.id}')">RECUSAR</button>
                        </div>
                    ` : ''}
                </div>
            `;
            lista.innerHTML += pedidoHtml;
        });
    },

    renderizarEstoque: function() {
        const estoqueContainer = document.getElementById('estoque-section');
        const produtos = obterProdutos();

        const produtosHtml = produtos.map(prod => `
            <div class="stock-card">
                <div class="stock-card-header">
                    <h3>${prod.nome}</h3>
                    <span class="price-tag">R$ ${prod.preco.toFixed(2)}</span>
                </div>
                <div class="stock-card-body">
                    <div class="stock-info">
                        <label>Quantidade</label>
                        <input id="stock-qty-${prod.id}" type="number" min="0" value="${prod.estoque}" class="qty-input" />
                    </div>
                    <div class="stock-info">
                        <label>Preço (R$)</label>
                        <input id="stock-price-${prod.id}" type="number" min="0.01" step="0.01" value="${prod.preco.toFixed(2)}" class="qty-input" />
                    </div>
                    <button class="btn btn-primary btn-sm" onclick="funcionario.atualizarProduto(${prod.id})">Salvar</button>
                </div>
            </div>
        `).join('');

        const estoqueHtml = `
            <h3 style="margin-top: 0;">📦 Estoque</h3>
            <p style="color:#666; margin-bottom: 20px; font-size: 0.95rem;">Adicione novos produtos para que apareçam na tela dos alunos.</p>
            
            <div class="card product-create-card">
                <h4 style="margin: 0 0 12px 0; color: var(--primary-blue);">✨ Novo Produto</h4>
                <div class="stock-actions">
                    <input id="new-product-name" type="text" placeholder="Nome do produto" />
                    <input id="new-product-quantity" type="number" min="1" placeholder="Quantidade inicial" />
                    <input id="new-product-price" type="number" min="0.01" step="0.01" placeholder="Preço" />
                </div>
                <button class="btn btn-gold" style="width: 100%;" onclick="funcionario.adicionarProdutoEstoque()">➕ Adicionar</button>
            </div>

            <h4 style="margin-top: 25px; color: var(--primary-blue); margin-bottom: 15px;">Editar Produtos</h4>
            <div class="products-grid">
                ${produtosHtml || '<p style="text-align: center; color: #999;">Nenhum produto</p>'}
            </div>
        `;

        estoqueContainer.innerHTML = estoqueHtml;
    },

    renderizarCaixa: function() {
        const caixaContainer = document.getElementById('caixa-section');
        const totalVendas = obterTotalVendas('entregue');
        const pedidosEntregues = obterPedidos().filter(p => p.status === 'entregue');
        const totalPedidos = pedidosEntregues.length;
        const totalProdutosVendidos = pedidosEntregues.reduce((sum, p) => sum + p.itens.length, 0);
        const dataHoje = getDataAtual();

        // Gerar HTML de Fechamentos Diários
        const historico = obterHistoricoVendas();
        let historicoHtml = '';
        if (historico.length > 0) {
            historicoHtml = historico.map(h => `
                <div class="history-row">
                    <span class="history-date">${h.date}</span>
                    <span class="history-pedidos">${h.pedidos} ped.</span>
                    <span class="history-produtos">${h.produtos} prod.</span>
                    <span class="history-valor">R$ ${h.total.toFixed(2)}</span>
                </div>
            `).join('');
        } else {
            historicoHtml = '<p style="padding: 15px; text-align: center; color: #999; font-size: 0.9rem;">Nenhum fechamento registrado.</p>';
        }

        // Gerar HTML de Relatório Mensal
        const relatorioMensal = obterRelatorioMensal();
        let relatorioHtml = '';
        if (relatorioMensal.length > 0) {
            relatorioHtml = relatorioMensal.map(r => `
                <div class="history-row" style="background: #fff8eb; font-weight: 600;">
                    <span class="history-date" style="color: var(--gold-dark);">${r.mesAno}</span>
                    <span class="history-pedidos">${r.pedidos} ped.</span>
                    <span class="history-produtos">${r.produtos} prod.</span>
                    <span class="history-valor">R$ ${r.total.toFixed(2)}</span>
                </div>
            `).join('');
        } else {
            relatorioHtml = '<p style="padding: 15px; text-align: center; color: #999; font-size: 0.9rem;">Nenhum dado mensal registrado.</p>';
        }

        caixaContainer.innerHTML = `
            <h3 style="margin-top: 0;">💰 Caixa</h3>
            <p style="color: #666; margin-bottom: 20px; font-size: 0.95rem;">Data: <strong>${dataHoje}</strong></p>

            <div class="cash-today">
                <div class="cash-stat">
                    <span class="stat-label">📋 Pedidos Aceitos</span>
                    <span class="stat-value">${totalPedidos}</span>
                </div>
                <div class="cash-stat">
                    <span class="stat-label">📦 Produtos Vendidos</span>
                    <span class="stat-value">${totalProdutosVendidos}</span>
                </div>
                <div class="cash-stat" style="grid-column: 1/-1; justify-content: center;">
                    <span class="stat-label">💵 Valor Acumulado</span>
                    <span class="stat-value gold-large">R$ ${totalVendas.toFixed(2)}</span>
                </div>
            </div>

            <button class="btn btn-outline" style="border-color: var(--gold-dark); color: var(--gold-dark); margin-bottom: 25px;" onclick="funcionario.encerrarExpedienteManual()">
                🔒 Encerrar Expediente de Hoje
            </button>

            <div class="cash-history">
                <h4>Fechamentos Diários</h4>
                <div class="history-table">
                    <div class="history-header">
                        <span>Data</span>
                        <span>Pedidos</span>
                        <span>Itens</span>
                        <span>Valor</span>
                    </div>
                    ${historicoHtml}
                </div>
            </div>

            <div class="cash-history" style="margin-top: 25px;">
                <h4>Relatório Mensal de Vendas</h4>
                <div class="history-table">
                    <div class="history-header" style="background: var(--gold-dark);">
                        <span>Mês/Ano</span>
                        <span>Pedidos</span>
                        <span>Itens</span>
                        <span>Valor</span>
                    </div>
                    ${relatorioHtml}
                </div>
            </div>
        `;
    },

    adicionarProdutoEstoque: function() {
        const nomeInput = document.getElementById('new-product-name');
        const quantidadeInput = document.getElementById('new-product-quantity');
        const priceInput = document.getElementById('new-product-price');
        const nome = nomeInput.value.trim();
        const quantidade = Number(quantidadeInput.value);
        const preco = Number(priceInput.value);

        if (!nome || quantidade <= 0 || preco <= 0) {
            app.mostrarToast('Preencha nome, quantidade e valor válidos', true);
            return;
        }

        const novoId = DB.produtos.length ? Math.max(...DB.produtos.map(p => p.id)) + 1 : 1;
        DB.produtos.push({ id: novoId, nome, preco, estoque: quantidade });
        salvarBanco();
        nomeInput.value = '';
        quantidadeInput.value = '';
        priceInput.value = '';
        this.renderizarEstoque();
        app.mostrarToast('Produto adicionado ao estoque');
    },

    atualizarProduto: function(id) {
        const quantidadeInput = document.getElementById(`stock-qty-${id}`);
        const priceInput = document.getElementById(`stock-price-${id}`);
        const quantidade = Number(quantidadeInput.value);
        const preco = Number(priceInput.value);

        if (isNaN(quantidade) || quantidade < 0 || isNaN(preco) || preco <= 0) {
            app.mostrarToast('Quantidade ou preço inválidos', true);
            return;
        }

        const produto = DB.produtos.find(p => p.id === id);
        if (!produto) return;
        produto.estoque = quantidade;
        produto.preco = preco;
        salvarBanco();
        this.renderizarEstoque();
        app.mostrarToast(`Produto ${produto.nome} atualizado`);
    },

    confirmarEntrega: function(id) {
        if (marcarComoEntregue(id)) {
            app.mostrarToast('Pedido aceito e caixa atualizado!');
            this.renderizarPedidos();
            this.renderizarCaixa();
            this.renderizarEstoque();
        }
    },

    confirmarRecusa: function(id) {
        const confirmar = window.confirm("Deseja realmente recusar este pedido?");
        if (!confirmar) return;

        if (recusarPedido(id)) {
            app.mostrarToast('Pedido recusado.', true);
            this.renderizarPedidos();
        }
    },

    encerrarExpedienteManual: function() {
        const confirmar = window.confirm("Deseja realmente encerrar o expediente de hoje? Isso salvará as vendas atuais no histórico e reiniciará o caixa.");
        if (!confirmar) return;

        const resultado = encerrarExpediente();
        if (resultado.sucesso) {
            app.mostrarToast(resultado.mensagem);
            this.renderizarCaixa();
            this.renderizarPedidos();
        } else {
            app.mostrarToast(resultado.mensagem, true);
        }
    }
};
