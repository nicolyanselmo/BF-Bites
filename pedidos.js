// Gerenciamento de Dados (Estoque e Pedidos)
// Este arquivo simula o banco de dados da aplicação

const PRODUTOS_PADRAO = [
    { id: 1, nome: "Esfirra de Frango", preco: 11.00, estoque: 20 },
    { id: 2, nome: "Esfirra de Calabresa", preco: 11.00, estoque: 20 },
    { id: 3, nome: "Esfirra de Presunto e Queijo", preco: 11.00, estoque: 20 }
];

const DB = {
    produtos: [...PRODUTOS_PADRAO],
    pedidos: [],
    historico: [],
    usuarios: [],
    currentDate: new Date().toLocaleDateString('pt-BR')
};

// Retorna a lista de produtos atualizada
// parametro: nenhum
// retorno: array de objetos de produtos
function obterProdutos() {
    return DB.produtos;
}

// Retorna a lista de todos os pedidos realizados
// parametro: nenhum
// retorno: array de objetos de pedidos
function obterPedidos() {
    return DB.pedidos;
}

// Retorna o valor total de vendas acumulado nos pedidos do dia atual
// parametro: status opcional ('entregue' ou 'pendente')
// retorno: número com o total das vendas filtradas
function obterTotalVendas(status = null) {
    const pedidos = status ? DB.pedidos.filter(p => p.status === status) : DB.pedidos;
    return pedidos.reduce((sum, pedido) => sum + pedido.total, 0);
}

// Retorna o histórico de vendas dos dias anteriores
function obterHistoricoVendas() {
    return DB.historico;
}

function getDataAtual() {
    return new Date().toLocaleDateString('pt-BR');
}

function salvarBanco() {
    localStorage.setItem('bfBitesDB', JSON.stringify({
        produtos: DB.produtos,
        pedidos: DB.pedidos,
        historico: DB.historico,
        usuarios: DB.usuarios,
        currentDate: DB.currentDate
    }));
}

function carregarBanco() {
    const dados = localStorage.getItem('bfBitesDB');
    if (dados) {
        const parsed = JSON.parse(dados);
        if (parsed.produtos) DB.produtos = parsed.produtos;
        if (parsed.pedidos) DB.pedidos = parsed.pedidos;
        if (parsed.historico) DB.historico = parsed.historico;
        if (parsed.usuarios) DB.usuarios = parsed.usuarios;
        if (parsed.currentDate) DB.currentDate = parsed.currentDate;
    }

    if (!Array.isArray(DB.produtos) || DB.produtos.length === 0) {
        DB.produtos = [...PRODUTOS_PADRAO];
    } else {
        PRODUTOS_PADRAO.forEach(defaultProduto => {
            if (!DB.produtos.some(prod => prod.nome === defaultProduto.nome)) {
                DB.produtos.push({ ...defaultProduto });
            }
        });
    }

    resetDoDiaSeNecessario();
}

function resetDoDiaSeNecessario() {
    const hoje = getDataAtual();
    if (DB.currentDate !== hoje) {
        const pedidosDoDia = DB.pedidos.filter(p => p.status === 'entregue');
        const pedidosPendentes = DB.pedidos.filter(p => p.status !== 'entregue');
        const total = pedidosDoDia.reduce((sum, pedido) => sum + pedido.total, 0);
        const count = pedidosDoDia.length;
        const produtos = pedidosDoDia.reduce((sum, p) => sum + p.itens.length, 0);
        if (count > 0) {
            DB.historico.unshift({
                date: DB.currentDate,
                total: total,
                pedidos: count,
                produtos: produtos
            });
        }
        DB.pedidos = pedidosPendentes;
        DB.currentDate = hoje;
        salvarBanco();
    }
}

function agendarResetDiario() {
    const agora = new Date();
    const proximoDia = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 23, 55, 0);
    
    // Se já passou das 23:55, agendar para amanhã
    if (agora > proximoDia) {
        proximoDia.setDate(proximoDia.getDate() + 1);
    }
    
    const atraso = proximoDia.getTime() - agora.getTime();
    setTimeout(() => {
        resetDoDiaSeNecessario();
        agendarResetDiario();
    }, atraso);
}

// Gera um ID único para o novo pedido
// parametro: nenhum
// retorno: string de ID (ex: #171483...)
function gerarIdPedido() {
    return '#' + Math.floor(Math.random() * 10000);
}

// Adiciona um novo pedido ao sistema e abate do estoque
// parametro: objeto contendo nome do aluno e itens do carrinho
// retorno: objeto do pedido criado
function salvarPedido(dados) {
    const novoPedido = {
        id: gerarIdPedido(),
        aluno: dados.aluno,
        itens: [...dados.itens],
        total: dados.total,
        status: 'pendente',
        data: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    DB.pedidos.unshift(novoPedido); // Adiciona no início da lista
    salvarBanco();
    return novoPedido;
}

// Atualiza o status de um pedido para entregue se houver estoque
// parametro: id do pedido
// retorno: booleano indicando sucesso
function marcarComoEntregue(id) {
    const pedido = DB.pedidos.find(p => p.id === id);
    if (!pedido) return false;

    // Verificar se há estoque disponível para todos os itens do pedido
    const contagemItens = pedido.itens.reduce((acc, item) => {
        acc[item.id] = (acc[item.id] || 0) + 1;
        return acc;
    }, {});

    const itensSemEstoque = [];
    for (const itemId in contagemItens) {
        const prod = DB.produtos.find(p => p.id === Number(itemId));
        if (!prod || prod.estoque < contagemItens[itemId]) {
            itensSemEstoque.push(prod ? prod.nome : "Produto desconhecido");
        }
    }

    if (itensSemEstoque.length > 0) {
        app.mostrarToast(`Sem estoque suficiente para: ${itensSemEstoque.join(', ')}`, true);
        return false;
    }

    // Abater estoque na aceitação do pedido
    pedido.itens.forEach(item => {
        const prod = DB.produtos.find(p => p.id === item.id);
        if (prod) {
            prod.estoque -= 1;
        }
    });

    pedido.status = 'entregue';
    salvarBanco();
    return true;
}

// Recusa um pedido pendente
function recusarPedido(id) {
    const pedido = DB.pedidos.find(p => p.id === id);
    if (pedido) {
        pedido.status = 'recusado';
        salvarBanco();
        return true;
    }
    return false;
}

// Encerra o expediente consolidando os dados do caixa do dia atual
function encerrarExpediente() {
    const hoje = getDataAtual();
    const pedidosDoDia = DB.pedidos.filter(p => p.status === 'entregue');
    const total = pedidosDoDia.reduce((sum, pedido) => sum + pedido.total, 0);
    const count = pedidosDoDia.length;
    const produtos = pedidosDoDia.reduce((sum, p) => sum + p.itens.length, 0);

    if (count === 0 && total === 0) {
        return { sucesso: false, mensagem: "Nenhuma venda realizada hoje para encerrar." };
    }

    DB.historico.unshift({
        date: hoje + ' (Fechamento Manual)',
        total: total,
        pedidos: count,
        produtos: produtos
    });

    // Remove os pedidos entregues ativos da lista
    DB.pedidos = DB.pedidos.filter(p => p.status !== 'entregue');

    salvarBanco();
    return { sucesso: true, mensagem: "Expediente encerrado com sucesso! Caixa reiniciado." };
}

// Retorna relatório de vendas agrupado por mês e ano
function obterRelatorioMensal() {
    const relatorio = {};

    DB.historico.forEach(entry => {
        const match = entry.date.match(/(\d{2})\/(\d{2})\/(\d{4})/);
        if (match) {
            const mes = match[2];
            const ano = match[3];
            const chave = `${mes}/${ano}`;

            if (!relatorio[chave]) {
                relatorio[chave] = {
                    mesAno: chave,
                    total: 0,
                    pedidos: 0,
                    produtos: 0
                };
            }
            relatorio[chave].total += entry.total;
            relatorio[chave].pedidos += entry.pedidos;
            relatorio[chave].produtos += entry.produtos;
        }
    });

    return Object.values(relatorio);
}
