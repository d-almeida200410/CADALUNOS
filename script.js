// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDUYi6zK0Wikn7GxNvXwlaZ0IDAWjeBPFA",
    authDomain: "sistemarefoco.firebaseapp.com",
    projectId: "sistemarefoco",
    storageBucket: "sistemarefoco.appspot.com",
    messagingSenderId: "575074315451",
    appId: "1:575074315451:web:46a990adb690b40e3a8d9e",
    measurementId: "G-0SVNNZGEF4"
};

// Inicialize o Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

document.addEventListener('DOMContentLoaded', function() {
    // Elementos do DOM
    const cadastroForm = document.getElementById('cadastroForm');
    const listaAlunos = document.getElementById('listaAlunos');
    const submitBtn = document.getElementById('submitBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const alunoIdInput = document.getElementById('alunoId');
    
    // Elementos do modal
    const modal = document.getElementById('confirmModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const modalConfirmBtn = document.getElementById('modalConfirmBtn');
    const modalCancelBtn = document.getElementById('modalCancelBtn');
    const closeBtn = document.querySelector('.close');
    
    // Estado da aplicação
    let alunos = [];
    let editandoId = null;
    
    // Carregar alunos do Firestore
    function carregarAlunos() {
        db.collection("alunos").orderBy("nome").onSnapshot((snapshot) => {
            alunos = [];
            snapshot.forEach((doc) => {
                const aluno = doc.data();
                aluno.id = doc.id;
                alunos.push(aluno);
            });
            atualizarListaAlunos();
        });
    }
    
    // Função para adicionar mês pago
    async function adicionarMesPago(alunoId, mesAno) {
        try {
            await db.collection("alunos").doc(alunoId).update({
                mesesPagos: firebase.firestore.FieldValue.arrayUnion(mesAno)
            });
            showSuccess('Mês adicionado com sucesso!');
        } catch (error) {
            showError('Erro ao adicionar mês: ' + error.message);
        }
    }
    
    // Função para remover mês pago
    async function removerMesPago(alunoId, mesAno) {
        try {
            await db.collection("alunos").doc(alunoId).update({
                mesesPagos: firebase.firestore.FieldValue.arrayRemove(mesAno)
            });
            showSuccess('Mês removido com sucesso!');
        } catch (error) {
            showError('Erro ao remover mês: ' + error.message);
        }
    }
    
    // Inicialização
    carregarAlunos();
    
    // Event Listeners
    cadastroForm.addEventListener('submit', handleSubmit);
    cancelEditBtn.addEventListener('click', cancelarEdicao);
    closeBtn.addEventListener('click', fecharModal);
    modalCancelBtn.addEventListener('click', fecharModal);
    window.addEventListener('click', clickForaModal);
    
    // Funções de manipulação de eventos
    function handleSubmit(e) {
        e.preventDefault();
        
        const aluno = {
            nome: document.getElementById('nome').value,
            valor: parseFloat(document.getElementById('valor').value).toFixed(2),
            vencimento: document.getElementById('vencimento').value,
            periodo: document.querySelector('input[name="periodo"]:checked').value,
            dias: getDiasSelecionados(),
            dataCadastro: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        if (aluno.dias.length === 0) {
            showError('Selecione pelo menos um dia da semana!');
            return;
        }
        
        if (editandoId) {
            // Atualizar aluno existente
            db.collection("alunos").doc(editandoId).update(aluno)
                .then(() => {
                    showSuccess('Aluno atualizado com sucesso!');
                    limparFormulario();
                    finalizarEdicao();
                })
                .catch((error) => {
                    showError('Erro ao atualizar aluno: ' + error.message);
                });
        } else {
            // Adicionar novo aluno
            db.collection("alunos").add(aluno)
                .then(() => {
                    showSuccess('Aluno cadastrado com sucesso!');
                    limparFormulario();
                })
                .catch((error) => {
                    showError('Erro ao cadastrar aluno: ' + error.message);
                });
        }
    }
    
    function getDiasSelecionados() {
        const diasCheckboxes = document.querySelectorAll('input[name="dias"]:checked');
        return Array.from(diasCheckboxes).map(cb => cb.value);
    }
    
    // Funções de interface
    function editarAluno(id) {
        const aluno = alunos.find(a => a.id === id);
        if (!aluno) return;
        
        editandoId = id;
        document.getElementById('alunoId').value = id;
        document.getElementById('nome').value = aluno.nome;
        document.getElementById('valor').value = aluno.valor;
        document.getElementById('vencimento').value = aluno.vencimento;
        
        // Definir período
        document.querySelectorAll('input[name="periodo"]').forEach(radio => {
            radio.checked = radio.value === aluno.periodo;
        });
        
        // Definir dias
        document.querySelectorAll('input[name="dias"]').forEach(cb => {
            cb.checked = aluno.dias.includes(cb.value);
        });
        
        submitBtn.textContent = 'Atualizar Aluno';
        cancelEditBtn.style.display = 'inline-block';
        document.getElementById('nome').focus();
    }
    
    function cancelarEdicao() {
        limparFormulario();
        finalizarEdicao();
    }
    
    function finalizarEdicao() {
        submitBtn.textContent = 'Cadastrar Aluno';
        cancelEditBtn.style.display = 'none';
        editandoId = null;
    }
    
    function limparFormulario() {
        cadastroForm.reset();
        document.getElementById('manha').checked = true;
        alunoIdInput.value = '';
    }
    
    function confirmarRemocao(id, nome) {
        modalTitle.textContent = 'Confirmar Remoção';
        modalMessage.textContent = `Tem certeza que deseja remover o aluno "${nome}"?`;
        
        modalConfirmBtn.onclick = function() {
            db.collection("alunos").doc(id).delete()
                .then(() => {
                    showSuccess('Aluno removido com sucesso!');
                    fecharModal();
                })
                .catch((error) => {
                    showError('Erro ao remover aluno: ' + error.message);
                });
        };
        
        abrirModal();
    }
    
    // Funções do Modal
    function abrirModal() {
        modal.style.display = 'block';
    }
    
    function fecharModal() {
        modal.style.display = 'none';
    }
    
    function clickForaModal(event) {
        if (event.target === modal) {
            fecharModal();
        }
    }
    
    // Funções de renderização
    function atualizarListaAlunos() {
        if (alunos.length === 0) {
            listaAlunos.innerHTML = '<p class="no-data">Nenhum aluno cadastrado ainda.</p>';
            return;
        }
        
        let html = `
            <table>
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>Valor (R$)</th>
                        <th>Vencimento</th>
                        <th>Período</th>
                        <th>Dias</th>
                        <th>Meses Pagos</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        alunos.forEach(aluno => {
            const dataVencimento = aluno.vencimento ? 
                new Date(aluno.vencimento).toLocaleDateString('pt-BR') : 
                'Não informado';
            
            // Garantir que dias seja tratado como array
            const diasAluno = Array.isArray(aluno.dias) ? aluno.dias : 
                             (aluno.dias && typeof aluno.dias === 'string' ? aluno.dias.split(', ') : []);
            
            // Formatar meses pagos
            let mesesPagosHtml = 'Nenhum';
            if (aluno.mesesPagos && aluno.mesesPagos.length > 0) {
                mesesPagosHtml = `
                    <div class="meses-pagos-container">
                        <ul class="meses-pagos-list">
                            ${aluno.mesesPagos.map(mes => `
                                <li>
                                    ${formatarMesParaExibicao(mes)}
                                    <button onclick="removerMesPago('${aluno.id}', '${mes}')" class="btn btn-danger btn-xs">
                                        <span class="btn-text">🗑️</span>
                                    </button>
                                </li>
                            `).join('')}
                        </ul>
                        <div class="add-mes-form">
                            <input type="month" id="novoMes-${aluno.id}" class="input-sm">
                            <button onclick="adicionarNovoMes('${aluno.id}')" class="btn btn-secondary btn-xs">
                                <span class="btn-text">+</span>
                            </button>
                        </div>
                    </div>
                `;
            } else {
                mesesPagosHtml = `
                    <div class="add-mes-form">
                        <input type="month" id="novoMes-${aluno.id}" class="input-sm">
                        <button onclick="adicionarNovoMes('${aluno.id}')" class="btn btn-secondary btn-xs">
                            <span class="btn-text">Adicionar Mês</span>
                        </button>
                    </div>
                `;
            }
            
            html += `
                <tr>
                    <td>${aluno.nome}</td>
                    <td>${aluno.valor}</td>
                    <td>${dataVencimento}</td>
                    <td>${aluno.periodo}</td>
                    <td>${diasAluno.join(', ')}</td>
                    <td>${mesesPagosHtml}</td>
                    <td class="actions-cell">
                        <button onclick="editarAluno('${aluno.id}')" class="btn btn-secondary btn-sm">
                            <span class="btn-text">✏️ Editar</span>
                        </button>
                        <button onclick="confirmarRemocao('${aluno.id}', '${aluno.nome}')" class="btn btn-danger btn-sm">
                            <span class="btn-text">🗑️ Remover</span>
                        </button>
                    </td>
                </tr>
            `;
        });
        
        html += `
                </tbody>
            </table>
        `;
        
        listaAlunos.innerHTML = html;
    }    
    // Função para formatar mês para exibição (YYYY-MM para "Mês/YYYY")
    function formatarMesParaExibicao(mesAno) {
        const [ano, mes] = mesAno.split('-');
        const meses = [
            'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
            'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
        ];
        return `${meses[parseInt(mes) - 1]}/${ano}`;
    }
    
    // Notificações
    function showSuccess(message) {
        const notification = document.createElement('div');
        notification.className = 'notification success';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    function showError(message) {
        const notification = document.createElement('div');
        notification.className = 'notification error';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    // Funções globais para manipulação de meses pagos
    window.adicionarNovoMes = function(alunoId) {
        const inputMes = document.getElementById(`novoMes-${alunoId}`);
        if (inputMes && inputMes.value) {
            adicionarMesPago(alunoId, inputMes.value);
            inputMes.value = ''; // Limpar o campo após adicionar
        } else {
            showError('Selecione um mês válido!');
        }
    };
    
    window.removerMesPago = function(alunoId, mesAno) {
        if (confirm(`Tem certeza que deseja remover o mês ${formatarMesParaExibicao(mesAno)}?`)) {
            removerMesPago(alunoId, mesAno);
        }
    };
    
    // Expor outras funções para o escopo global
    window.editarAluno = editarAluno;
    window.confirmarRemocao = confirmarRemocao;
});