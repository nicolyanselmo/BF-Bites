// Controle Geral da Aplicação
// Gerencia navegação, login e UI global

// UIDs do Firebase Authentication autorizados a acessar como Administrador
const ADMIN_UIDS = ["2cH3uoX8VaUILaRniJJWQV7yfzI2", "LsoKUvhY7QTqVJrTtsPA8aW40j32", "lAyOJO9HIYPKeJ4kV7j3bNqLvb93"];

// Chave usada para persistir a sessão do usuário entre atualizações de página
const SESSION_KEY = 'bfBitesSessao';

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
        // Checar conexão com Firebase Realtime Database (se disponível)
        if (typeof verificarConexaoFirebase === 'function') {
            verificarConexaoFirebase().then(connected => {
                if (!connected) {
                    console.warn('Banco de dados Firebase não conectado ou inacessível.');
                    this.mostrarToast('Banco de dados remoto inacessível', true);
                } else {
                    console.log('Banco de dados remoto conectado.');
                }
            });
        }

        // Restaura a sessão salva (aluno ou funcionário/admin) para não deslogar ao atualizar a página
        const sessao = this._carregarSessao();
        if (sessao) {
            this.roleAtual = sessao.role;
            this.usuarioLogado = sessao.nome;
            this.usuarioEmail = sessao.email;

            if (sessao.role === 'aluno') {
                document.getElementById('display-aluno-name').innerText = this.usuarioLogado;
                aluno.renderizarProdutos();
                aluno.renderizarMeusPedidos();
                this.mudarTela('screen-aluno');
            } else if (sessao.role === 'funcionario') {
                funcionario.renderizarFuncionario();
                this.mudarTela('screen-funcionario');
            }
        }

        // Se houver resultado de redirect do Firebase, processar (fallback para ambientes que bloqueiam popup)
        if (typeof firebase !== 'undefined' && firebase.auth) {
            firebase.auth().getRedirectResult().then((result) => {
                if (result && result.user) {
                    this._handleAuthSignResult(result.user);
                }
            }).catch(err => {
                console.warn('getRedirectResult erro:', err);
            });

            // Valida sessões restauradas que dependem do Firebase Auth (aluno via Google e admin)
            firebase.auth().onAuthStateChanged((user) => {
                if (!sessao || !sessao.viaFirebase) return;
                const valido = user && (!sessao.isAdmin || ADMIN_UIDS.includes(user.uid));
                if (!valido && this.roleAtual === sessao.role) {
                    this._limparSessao();
                    this.voltarParaHome();
                }
            });
        }

        console.log("BF Bites inicializado 🚀");
    },

    // Salva a sessão atual no localStorage para sobreviver a atualizações de página
    _salvarSessao: function(role, nome, email, opts = {}) {
        const sessao = {
            role: role,
            nome: nome,
            email: email || "",
            viaFirebase: !!opts.viaFirebase,
            isAdmin: !!opts.isAdmin
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(sessao));
    },

    // Lê a sessão salva no localStorage, se houver
    _carregarSessao: function() {
        const dados = localStorage.getItem(SESSION_KEY);
        if (!dados) return null;
        try {
            return JSON.parse(dados);
        } catch (e) {
            return null;
        }
    },

    // Remove a sessão salva no localStorage
    _limparSessao: function() {
        localStorage.removeItem(SESSION_KEY);
    },

    // Navega para a tela de login definindo o papel do usuário
    // parametro: papel ('aluno' ou 'funcionario')
    // retorno: altera a visibilidade das seções
    irParaLogin: function(role) {
        this.roleAtual = role;
        document.getElementById('login-title').innerText = `Entrar como ${role.charAt(0).toUpperCase() + role.slice(1)}`;
        
        const nameGroup = document.getElementById('user-name').parentElement;
        const passwordGroup = document.getElementById('password-group');
        const btnGoogle = document.getElementById('btn-google-login');
        const btnEntrarManual = document.getElementById('btn-entrar-manual');

        document.getElementById('user-name').value = '';
        document.getElementById('user-password').value = '';

        if (role === 'funcionario') {
            // Funcionário: Login manual com credenciais próprias
            if (nameGroup) nameGroup.style.display = 'block';
            if (passwordGroup) passwordGroup.style.display = 'block';
            if (btnEntrarManual) btnEntrarManual.style.display = 'block';
            if (btnGoogle) btnGoogle.style.display = 'none';
            document.getElementById('user-name').placeholder = 'Digite seu usuário...';
        } else {
            // Aluno: login exclusivamente com Google
            if (nameGroup) nameGroup.style.display = 'none';
            if (passwordGroup) passwordGroup.style.display = 'none';
            if (btnEntrarManual) btnEntrarManual.style.display = 'none';
            if (btnGoogle) btnGoogle.style.display = 'flex';
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
            // Valida credenciais do funcionário
            const isFuncionarioCred = (username.toLowerCase() === 'funcionario' && password === '123');

            if (isFuncionarioCred) {
                this.usuarioLogado = "Funcionário";
                this.usuarioEmail = "";
                this._salvarSessao('funcionario', this.usuarioLogado, this.usuarioEmail, { viaFirebase: false, isAdmin: false });
                this.mostrarToast(`Bem-vindo, ${this.usuarioLogado}!`);

                funcionario.renderizarFuncionario();
                this.mudarTela('screen-funcionario');
                return;
            }

            // Não é o funcionário padrão: tenta autenticar como Administrador via Firebase Auth
            if (typeof firebase === 'undefined' || !firebase.auth) {
                this.mostrarToast("Usuário ou senha inválidos", true);
                return;
            }

            firebase.auth().signInWithEmailAndPassword(username, password)
                .then((result) => this._handleAuthSignResult(result.user))
                .catch(() => {
                    this.mostrarToast("Usuário ou senha inválidos", true);
                });
        }
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
                if (result && result.user) this._handleAuthSignResult(result.user);
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

    // Processa o usuário retornado pelo Firebase Auth (Google ou e-mail/senha)
    _handleAuthSignResult: function(user) {
        if (!user) return;

        if (this.roleAtual === 'funcionario') {
            if (!ADMIN_UIDS.includes(user.uid)) {
                this.mostrarToast("Acesso negado. Apenas o administrador autorizado pode entrar.", true);
                firebase.auth().signOut();
                return;
            }

            this.usuarioLogado = user.displayName || "Admin";
            this.usuarioEmail = user.email || "";
            this._salvarSessao('funcionario', this.usuarioLogado, this.usuarioEmail, { viaFirebase: true, isAdmin: true });

            this.mostrarToast(`Bem-vindo, Admin ${this.usuarioLogado}! 🚀`);
            funcionario.renderizarFuncionario();
            this.mudarTela('screen-funcionario');
        } else {
            this.usuarioLogado = user.displayName || user.email || "Aluno Google";
            this.usuarioEmail = user.email || "";
            this._salvarSessao('aluno', this.usuarioLogado, this.usuarioEmail, { viaFirebase: true, isAdmin: false });

            const existe = DB.usuarios.some(u => u.username.toLowerCase() === this.usuarioLogado.toLowerCase());
            if (!existe) {
                DB.usuarios.push({ username: this.usuarioLogado, email: user.email, googleUser: true });
                salvarBanco();
            }

            this.mostrarToast(`Bem-vindo, ${this.usuarioLogado}! 🎉`);
            document.getElementById('display-aluno-name').innerText = this.usuarioLogado;
            aluno.renderizarProdutos();
            aluno.renderizarMeusPedidos();
            this.mudarTela('screen-aluno');
        }
    },

    // Volta para a tela inicial e reseta dados temporários
    // parametro: nenhum
    // retorno: limpa inputs e volta ao splash
    voltarParaHome: function() {
        this.roleAtual = null;
        this.usuarioLogado = null;
        this._limparSessao();
        if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
            firebase.auth().signOut();
        }
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
