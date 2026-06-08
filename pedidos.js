// Gerenciamento de Dados (Estoque e Pedidos)
// Este arquivo simula o banco de dados da aplicação

const DB = {
    produtos: [
        { id: 1, nome: "Esfirra de Frango", preco: 11.00, estoque: 20 },
        { id: 2, nome: "Esfirra de Calabresa", preco: 11.00, estoque: 20 },
        { id: 3, nome: "Esfirra de Presunto e Queijo", preco: 11.00, estoque: 20 }
    ],
    pedidos: [],
    historico: [],
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
// parametro: nenhum
// retorno: número com o total das vendas
function obterTotalVendas() {
    return DB.pedidos.reduce((sum, pedido) => sum + pedido.total, 0);
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
        if (parsed.currentDate) DB.currentDate = parsed.currentDate;
    }
    resetDoDiaSeNecessario();
}

function resetDoDiaSeNecessario() {
    const hoje = getDataAtual();
    if (DB.currentDate !== hoje) {
        const total = obterTotalVendas();
        const count = DB.pedidos.length;
        const produtos = DB.pedidos.reduce((sum, p) => sum + p.itens.length, 0);
        if (count > 0) {
            DB.historico.unshift({
                date: DB.currentDate,
                total: total,
                pedidos: count,
                produtos: produtos
            });
        }
        DB.pedidos = [];
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

    // Abater estoque
    dados.itens.forEach(item => {
        const produto = DB.produtos.find(p => p.id === item.id);
        if (produto) {
            produto.estoque -= 1;
        }
    });

    DB.pedidos.unshift(novoPedido); // Adiciona no início da lista
    salvarBanco();
    return novoPedido;
}

// Atualiza o status de um pedido para entregue
// parametro: id do pedido
// retorno: booleano indicando sucesso
function marcarComoEntregue(id) {
    const pedido = DB.pedidos.find(p => p.id === id);
    if (pedido) {
        pedido.status = 'entregue';
        salvarBanco();
        return true;
    }
    return false;
}
