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
    const addHorarioBtn = document.getElementById('addHorarioBtn');
    const horariosContainer = document.getElementById('horariosContainer');
    
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
    
    // Função para formatar a data corretamente
    function formatarDataVencimento(dataString) {
        if (!dataString) return 'Não informado';
        
        const partes = dataString.split('-');
        const ano = parseInt(partes[0]);
        const mes = parseInt(partes[1]) - 1;
        const dia = parseInt(partes[2]);
        
        const data = new Date(ano, mes, dia);
        
        return data.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }
    
    // Adicionar novo horário
    function adicionarNovoHorario() {
        const novoHorario = document.createElement('div');
        novoHorario.className = 'horario-item';
        novoHorario.innerHTML = `
            <div class="horario-row">
                <div class="periodo-group">
                    <label>Período:</label>
                    <select class="periodo-select input-glow">
                        <option value="Manhã">🌞 Manhã</option>
                        <option value="Tarde (14h-16h)">🌇 Tarde (14h-16h)</option>
                        <option value="Tarde (14h-15:30h)">🌇 Tarde (14h-15:30h)</option>
                        <option value="Tarde (16h-18h)">🌆 Tarde (16h-18h)</option>
                        <option value="Tarde (18h-20h)">🌃 Tarde (18h-20h)</option>
                    </select>
                </div>
                
                <div class="dias-group">
                    <label>Dias:</label>
                    <div class="checkbox-group">
                        <label><input type="checkbox" value="Segunda"> Seg</label>
                        <label><input type="checkbox" value="Terça"> Ter</label>
                        <label><input type="checkbox" value="Quarta"> Qua</label>
                        <label><input type="checkbox" value="Quinta"> Qui</label>
                    </div>
                </div>
                
                <button type="button" class="btn btn-danger btn-remove-horario">
                    <span class="btn-text">🗑</span>
                </button>
            </div>
        `;
        
        horariosContainer.appendChild(novoHorario);
        
        // Habilitar botão de remover para todos exceto o primeiro
        const removeButtons = document.querySelectorAll('.btn-remove-horario');
        if (removeButtons.length > 1) {
            removeButtons.forEach(btn => btn.style.display = 'inline-block');
        }
    }
    
    // Remover horário
    function removerHorario(event) {
        if (horariosContainer.children.length > 1) {
            event.target.closest('.horario-item').remove();
            
            // Se só restar um horário, esconder botão de remover
            if (horariosContainer.children.length === 1) {
                document.querySelector('.btn-remove-horario').style.display = 'none';
            }
        }
    }
    
    // Obter horários do formulário
    function getHorariosFromForm() {
        const horarios = [];
        const horarioItems = document.querySelectorAll('.horario-item');
        
        horarioItems.forEach(item => {
            const periodo = item.querySelector('.periodo-select').value;
            const dias = Array.from(item.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
            
            if (dias.length > 0) {
                horarios.push({ periodo, dias });
            }
        });
        
        return horarios;
    }
    
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
    addHorarioBtn.addEventListener('click', adicionarNovoHorario);
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-remove-horario')) {
            removerHorario(e);
        }
    });
    
    // Event Listeners
    cadastroForm.addEventListener('submit', handleSubmit);
    cancelEditBtn.addEventListener('click', cancelarEdicao);
    closeBtn.addEventListener('click', fecharModal);
    modalCancelBtn.addEventListener('click', fecharModal);
    window.addEventListener('click', clickForaModal);
    
    // Funções de manipulação de eventos
    function handleSubmit(e) {
        e.preventDefault();
        
        const horarios = getHorariosFromForm();
        if (horarios.length === 0) {
            showError('Adicione pelo menos um horário com dias selecionados!');
            return;
        }
        
        const aluno = {
            nome: document.getElementById('nome').value,
            valor: parseFloat(document.getElementById('valor').value).toFixed(2),
            vencimento: document.getElementById('vencimento').value,
            horarios: horarios,
            dataCadastro: firebase.firestore.FieldValue.serverTimestamp()
        };
        
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
    
    // Funções de interface
    function editarAluno(id) {
        const aluno = alunos.find(a => a.id === id);
        if (!aluno) return;
        
        editandoId = id;
        document.getElementById('alunoId').value = id;
        document.getElementById('nome').value = aluno.nome;
        document.getElementById('valor').value = aluno.valor;
        document.getElementById('vencimento').value = aluno.vencimento;
        
        // Limpar horários existentes
        horariosContainer.innerHTML = '';
        
        // Adicionar horários do aluno
        if (aluno.horarios && aluno.horarios.length > 0) {
            aluno.horarios.forEach((horario, index) => {
                if (index === 0) {
                    // Primeiro horário (já existe no HTML)
                    const primeiroSelect = document.querySelector('.periodo-select');
                    const primeiroCheckboxes = document.querySelectorAll('.horario-item:first-child input[type="checkbox"]');
                    
                    primeiroSelect.value = horario.periodo;
                    primeiroCheckboxes.forEach(cb => {
                        cb.checked = horario.dias.includes(cb.value);
                    });
                } else {
                    // Horários adicionais
                    adicionarNovoHorario();
                    const ultimoHorario = document.querySelector('.horario-item:last-child');
                    ultimoHorario.querySelector('.periodo-select').value = horario.periodo;
                    
                    ultimoHorario.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                        cb.checked = horario.dias.includes(cb.value);
                    });
                }
            });
        } else {
            // Compatibilidade com versão antiga (período e dias separados)
            const primeiroSelect = document.querySelector('.periodo-select');
            const primeiroCheckboxes = document.querySelectorAll('.horario-item:first-child input[type="checkbox"]');
            
            if (aluno.periodo) primeiroSelect.value = aluno.periodo;
            if (aluno.dias) {
                primeiroCheckboxes.forEach(cb => {
                    cb.checked = aluno.dias.includes(cb.value);
                });
            }
        }
        
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
        
        // Limpar horários (deixar apenas um)
        horariosContainer.innerHTML = `
            <div class="horario-item">
                <div class="horario-row">
                    <div class="periodo-group">
                        <label>Período:</label>
                        <select class="periodo-select input-glow">
                            <option value="Manhã">🌞 Manhã</option>
                            <option value="Tarde (14h-16h)">🌇 Tarde (14h-16h)</option>
                            <option value="Tarde (14h-15:30h)">🌇 Tarde (14h-15:30h)</option>
                            <option value="Tarde (16h-18h)">🌆 Tarde (16h-18h)</option>
                            <option value="Tarde (18h-20h)">🌃 Tarde (18h-20h)</option>
                        </select>
                    </div>
                    
                    <div class="dias-group">
                        <label>Dias:</label>
                        <div class="checkbox-group">
                            <label><input type="checkbox" value="Segunda"> Seg</label>
                            <label><input type="checkbox" value="Terça"> Ter</label>
                            <label><input type="checkbox" value="Quarta"> Qua</label>
                            <label><input type="checkbox" value="Quinta"> Qui</label>
                        </div>
                    </div>
                    
                    <button type="button" class="btn btn-danger btn-remove-horario" style="display: none;">
                        <span class="btn-text">🗑</span>
                    </button>
                </div>
            </div>
        `;
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
                        <th>Horários</th>
                        <th>Meses Pagos</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        alunos.forEach(aluno => {
            const dataVencimento = formatarDataVencimento(aluno.vencimento);
            
            // Formatar horários
            let horariosHtml = 'Nenhum horário';
            if (aluno.horarios && aluno.horarios.length > 0) {
                horariosHtml = aluno.horarios.map(horario => {
                    const dias = Array.isArray(horario.dias) ? horario.dias.join(', ') : horario.dias;
                    return `<div class="horario-info"><strong>${horario.periodo}</strong>: ${dias}</div>`;
                }).join('');
            } else if (aluno.periodo && aluno.dias) {
                // Compatibilidade com versão antiga
                const dias = Array.isArray(aluno.dias) ? aluno.dias.join(', ') : aluno.dias;
                horariosHtml = `<div class="horario-info"><strong>${aluno.periodo}</strong>: ${dias}</div>`;
            }
            
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
                    <td>${horariosHtml}</td>
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