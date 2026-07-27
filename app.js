// Controle Geral da Aplicação
// Gerencia navegação, login e UI global

const app = {
    roleAtual: null, // 'aluno' ou 'funcionario'
    usuarioLogado: null,
    usuarioEmail: null,

    // Inicializa a aplicação
    // parametro: nenhum
    // retorno: configura estados iniciais
    init: function() {
        carregarBanco();
        agendarResetDiario();
        // Se houver resultado de redirect do Firebase, processar (fallback para ambientes que bloqueiam popup)
        if (typeof firebase !== 'undefined' && firebase.auth) {
            firebase.auth().getRedirectResult().then((result) => {
                if (result && result.user) {
                    this._handleGoogleSignResult(result.user);
                }
            }).catch(err => {
                console.warn('getRedirectResult erro:', err);
            });
        }
        console.log("BF Bites inicializado 🚀");
    },

    // Navega para a tela de login definindo o papel do usuário
    // parametro: papel ('aluno' ou 'funcionario')
    // retorno: altera a visibilidade das seções
    irParaLogin: function(role) {
        this.roleAtual = role;
        document.getElementById('login-title').innerText = `Entrar como ${role.charAt(0).toUpperCase() + role.slice(1)}`;
        
        const nameGroup = document.getElementById('user-name').parentElement;
        const passwordGroup = document.getElementById('password-group');
        const btnCadastro = document.getElementById('btn-cadastro-aluno');
        const btnGoogle = document.getElementById('btn-google-login');
        const btnEntrarManual = document.getElementById('btn-entrar-manual');

        document.getElementById('user-name').value = '';
        document.getElementById('user-password').value = '';

        if (role === 'funcionario') {
            // Funcionário: Login manual com credenciais próprias
            if (nameGroup) nameGroup.style.display = 'block';
            if (passwordGroup) passwordGroup.style.display = 'block';
            if (btnEntrarManual) btnEntrarManual.style.display = 'block';
            if (btnCadastro) btnCadastro.style.display = 'none';
            if (btnGoogle) btnGoogle.style.display = 'none';
            document.getElementById('user-name').placeholder = 'Digite seu usuário...';
        } else {
            // Aluno: Pode logar com senha ou Google
            if (nameGroup) nameGroup.style.display = 'block';
            if (passwordGroup) passwordGroup.style.display = 'block';
            if (btnEntrarManual) btnEntrarManual.style.display = 'block';
            if (btnCadastro) btnCadastro.style.display = 'block';
            if (btnGoogle) {
                btnGoogle.style.display = 'flex';
                btnGoogle.innerHTML = `<img src="https://lh3.googleusercontent.com/COxitFqgSI10jQPEha8Jg1hpJg4hQPAWZthJHHS1AlqqE4t5-42JgBt35wGAADk66W0" alt="Google" style="width: 18px; margin-right: 8px; vertical-align: middle;"> Entrar com o Google`;
            }
            document.getElementById('user-name').placeholder = 'Digite seu nome...';
        }

        this.mudarTela('screen-login');
    },

    // Simula o login do usuário e direciona para a área correta
    // parametro: nenhum
    // retorno: valida campo e muda para tela do dashboard
    fazerLogin: function() {
        const nomeInput = document.getElementById('user-name');
        const senhaInput = document.getElementById('user-password');
        const username = nomeInput.value.trim();
        const password = senhaInput.value;

        if (username === "") {
            this.mostrarToast("Por favor, digite seu usuário", true);
            return;
        }

        if (this.roleAtual === 'funcionario') {
            // Valida credenciais do funcionário ou do administrador
            const isFuncionarioCred = (username.toLowerCase() === 'funcionario' && password === '123');
            const isAdminCred = (username.toLowerCase() === 'bf.bites0@gmail.com' && password === 'administrador');

            if (!isFuncionarioCred && !isAdminCred) {
                this.mostrarToast("Usuário ou senha inválidos", true);
                return;
            }

            if (isAdminCred) {
                this.usuarioLogado = "Administrador";
                this.usuarioEmail = username;
                this.mostrarToast(`Bem-vindo, ${this.usuarioLogado}!`);
            } else {
                this.usuarioLogado = "Funcionário";
                this.usuarioEmail = "";
                this.mostrarToast(`Bem-vindo, ${this.usuarioLogado}!`);
            }

            funcionario.renderizarFuncionario();
            this.mudarTela('screen-funcionario');
        } else {
            // Login de aluno cadastrado
            const usuario = DB.usuarios.find(u => u.username.toLowerCase() === username.toLowerCase());
            if (!usuario) {
                this.mostrarToast("Aluno não cadastrado. Clique em CADASTRAR NOVO ALUNO", true);
                return;
            }
            if (usuario.password !== password) {
                this.mostrarToast("Senha incorreta", true);
                return;
            }
            this.usuarioLogado = usuario.username;
            this.usuarioEmail = usuario.email || "";
            document.getElementById('display-aluno-name').innerText = this.usuarioLogado;
            aluno.renderizarProdutos();
            this.mudarTela('screen-aluno');
            this.mostrarToast(`Bem-vindo, ${this.usuarioLogado}!`);
        }
    },

    // Realiza o cadastro do novo aluno e faz login automático
    fazerCadastro: function() {
        const nomeInput = document.getElementById('user-name');
        const senhaInput = document.getElementById('user-password');
        const username = nomeInput.value.trim();
        const password = senhaInput.value;

        if (username === "" || password === "") {
            this.mostrarToast("Preencha usuário e senha para cadastrar", true);
            return;
        }

        const existe = DB.usuarios.some(u => u.username.toLowerCase() === username.toLowerCase());
        if (existe) {
            this.mostrarToast("Este nome de usuário já está cadastrado", true);
            return;
        }

        DB.usuarios.push({ username, password });
        salvarBanco();
        
        this.usuarioLogado = username;
        this.mostrarToast("Cadastro realizado com sucesso! 🎉");
        
        document.getElementById('display-aluno-name').innerText = this.usuarioLogado;
        aluno.renderizarProdutos();
        this.mudarTela('screen-aluno');
    },

    // Realiza o login com o Google
    loginComGoogle: function() {
        if (typeof firebase === 'undefined' || !firebase.auth) {
            this.mostrarToast("Firebase Auth não carregado", true);
            return;
        }

        const provider = new firebase.auth.GoogleAuthProvider();
        // Tentar popup primeiro, se falhar (ex: popup bloqueado) usar redirect
        firebase.auth().signInWithPopup(provider)
            .then((result) => {
                if (result && result.user) this._handleGoogleSignResult(result.user);
            })
            .catch((error) => {
                console.warn('signInWithPopup erro:', error);
                // Se o ambiente não permitir popup, tentar redirect
                const fallbackCodes = ['auth/popup-blocked', 'auth/cancelled-popup-request', 'auth/operation-not-supported-in-this-environment'];
                if (error && error.code && fallbackCodes.includes(error.code)) {
                    firebase.auth().signInWithRedirect(provider);
                    return;
                }
                this.mostrarToast("Erro ao entrar com Google", true);
            });
    },

    // Processa o usuário retornado pelo Google (popup ou redirect)
    _handleGoogleSignResult: function(user) {
        if (!user) return;

        if (this.roleAtual === 'funcionario') {
            const adminUid = "2cH3uoX8VaUILaRniJJWQV7yfzI2";
            if (user.uid !== adminUid) {
                this.mostrarToast("Acesso negado. Apenas o administrador autorizado pode entrar.", true);
                firebase.auth().signOut();
                return;
            }

            this.usuarioLogado = user.displayName || "Admin";
            this.usuarioEmail = user.email || "";

            this.mostrarToast(`Bem-vindo, Admin ${this.usuarioLogado}! 🚀`);
            funcionario.renderizarFuncionario();
            this.mudarTela('screen-funcionario');
        } else {
            this.usuarioLogado = user.displayName || user.email || "Aluno Google";
            this.usuarioEmail = user.email || "";

            const existe = DB.usuarios.some(u => u.username.toLowerCase() === this.usuarioLogado.toLowerCase());
            if (!existe) {
                DB.usuarios.push({ username: this.usuarioLogado, email: user.email, googleUser: true });
                salvarBanco();
            }

            this.mostrarToast(`Bem-vindo, ${this.usuarioLogado}! 🎉`);
            document.getElementById('display-aluno-name').innerText = this.usuarioLogado;
            aluno.renderizarProdutos();
            this.mudarTela('screen-aluno');
        }
    },

    // Volta para a tela inicial e reseta dados temporários
    // parametro: nenhum
    // retorno: limpa inputs e volta ao splash
    voltarParaHome: function() {
        this.roleAtual = null;
        this.usuarioLogado = null;
        document.getElementById('user-name').value = "";
        document.getElementById('user-password').value = "";
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
