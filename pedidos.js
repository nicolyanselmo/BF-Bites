// Gerenciamento de Dados (Estoque e Pedidos)
// Este arquivo simula o banco de dados da aplicação

const DB = {
    produtos: [
        { id: 1, nome: "Coxinha de Frango", preco: 5.50, estoque: 15 },
        { id: 2, nome: "Kibe Recheado", preco: 5.00, estoque: 10 },
        { id: 3, nome: "Enroladinho de Presunto", preco: 6.00, estoque: 0 },
        { id: 4, nome: "Pão de Queijo Grande", preco: 4.50, estoque: 20 },
        { id: 5, nome: "Suco Natural 300ml", preco: 7.00, estoque: 12 }
    ],
    pedidos: []
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
    return novoPedido;
}

// Atualiza o status de um pedido para entregue
// parametro: id do pedido
// retorno: booleano indicando sucesso
function marcarComoEntregue(id) {
    const pedido = DB.pedidos.find(p => p.id === id);
    if (pedido) {
        pedido.status = 'entregue';
        return true;
    }
    return false;
}
