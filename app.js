// Controle Geral da Aplicação
// Gerencia navegação, login e UI global

const app = {
    roleAtual: null, // 'aluno' ou 'funcionario'
    usuarioLogado: null,

    // Inicializa a aplicação
    // parametro: nenhum
    // retorno: configura estados iniciais
    init: function() {
        console.log("BF Bites inicializado 🚀");
    },

    // Navega para a tela de login definindo o papel do usuário
    // parametro: papel ('aluno' ou 'funcionario')
    // retorno: altera a visibilidade das seções
    irParaLogin: function(role) {
        this.roleAtual = role;
        document.getElementById('login-title').innerText = `Entrar como ${role.charAt(0).toUpperCase() + role.slice(1)}`;
        this.mudarTela('screen-login');
    },

    // Simula o login do usuário e direciona para a área correta
    // parametro: nenhum
    // retorno: valida campo e muda para tela do dashboard
    fazerLogin: function() {
        const nomeInput = document.getElementById('user-name');
        
        if (nomeInput.value.trim() === "") {
            this.mostrarToast("Por favor, digite seu nome", true);
            return;
        }

        this.usuarioLogado = nomeInput.value;
        
        if (this.roleAtual === 'aluno') {
            document.getElementById('display-aluno-name').innerText = this.usuarioLogado;
            aluno.renderizarProdutos();
            this.mudarTela('screen-aluno');
        } else {
            funcionario.renderizarPedidos();
            this.mudarTela('screen-funcionario');
        }
        
        this.mostrarToast(`Bem-vindo, ${this.usuarioLogado}!`);
    },

    // Volta para a tela inicial e reseta dados temporários
    // parametro: nenhum
    // retorno: limpa inputs e volta ao splash
    voltarParaHome: function() {
        this.roleAtual = null;
        this.usuarioLogado = null;
        document.getElementById('user-name').value = "";
        this.mudarTela('screen-splash');
    },

    // Função genérica para trocar de tela (seções HTML)
    // parametro: id da tela destino
    // retorno: remove classe active de todas e adiciona na destino
    mudarTela: function(screenId) {
        const screens = document.querySelectorAll('.screen');
        screens.forEach(s => s.classList.remove('active'));
        
        const target = document.getElementById(screenId);
        if (target) {
            target.classList.add('active');
            window.scrollTo(0, 0); // Volta pro topo ao mudar de tela
        }
    },

    // Exibe uma pequena notificação na tela
    // parametro: mensagem e booleano de erro
    // retorno: mostra o elemento #toast por 3 segundos
    mostrarToast: function(msg, erro = false) {
        const toast = document.getElementById('toast');
        toast.innerText = msg;
        toast.style.display = 'block';
        toast.style.background = erro ? '#e74c3c' : '#1a2a6c';
        
        setTimeout(() => {
            toast.style.display = 'none';
        }, 3000);
    }
};

// Inicializa quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
