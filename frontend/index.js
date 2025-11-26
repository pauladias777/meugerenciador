import axios from 'axios';

// URL BASE da sua API (Backend rodando na porta 3000)
const API_BASE_URL = 'http://localhost:3000/tarefas';

// Seleção de elementos do HTML (certifique-se de que os IDs existam no seu index.html)
const listaElement = document.getElementById('lista-tarefas');
const formAdicionar = document.getElementById('form-adicionar');
const inputTitulo = document.getElementById('input-titulo');

// --- 1. FUNÇÕES DE RENDERIZAÇÃO E LISTAGEM (GET) ---

// Função para desenhar a lista de tarefas na tela
function renderizarTarefas(tarefas) {
    if (!listaElement) return; // Garante que o elemento existe

    listaElement.innerHTML = ''; // Limpa a lista anterior

    tarefas.forEach(tarefa => {
        const item = document.createElement('li');
        item.className = 'tarefa-item';
        
        // Checkbox para marcar como concluída/pendente
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = tarefa.concluida;
        checkbox.onclick = () => toggleConcluida(tarefa.id, !tarefa.concluida); // Liga ao PUT

        // Texto da tarefa
        const span = document.createElement('span');
        span.textContent = tarefa.titulo;
        if (tarefa.concluida) {
            span.style.textDecoration = 'line-through';
        }

        // Botão de deletar
        const btnDelete = document.createElement('button');
        btnDelete.textContent = 'X';
        btnDelete.className = 'btn-delete';
        btnDelete.onclick = () => deletarTarefa(tarefa.id); // Liga ao DELETE

        item.appendChild(checkbox);
        item.appendChild(span);
        item.appendChild(btnDelete);
        listaElement.appendChild(item);
    });
}

// Função para buscar a lista de tarefas da API
async function carregarTarefas() {
    console.log("Fazendo pedido: GET", API_BASE_URL);
    try {
        const resposta = await axios.get(API_BASE_URL);
        const tarefas = resposta.data;
        
        console.log("SUCESSO! Tarefas carregadas:", tarefas);
        renderizarTarefas(tarefas); // Atualiza a tela

    } catch (error) {
        console.error("ERRO ao carregar tarefas. O Backend está ligado?", error);
        if (listaElement) {
            listaElement.innerHTML = '<li>Erro ao conectar à API.</li>';
        }
    }
}

// --- 2. FUNÇÃO DE CRIAÇÃO (POST) ---

async function adicionarTarefa(event) {
    event.preventDefault(); // Evita que a página recarregue ao enviar o formulário
    
    if (!inputTitulo) return;
    const titulo = inputTitulo.value.trim();

    if (!titulo) {
        alert("O título não pode ser vazio!");
        return;
    }

    try {
        // Envia o título para a rota POST da sua API
        await axios.post(API_BASE_URL, { titulo });
        
        inputTitulo.value = ''; // Limpa o input
        carregarTarefas(); // Recarrega a lista para mostrar a nova tarefa

    } catch (error) {
        console.error("Erro ao adicionar tarefa:", error.response ? error.response.data : error);
        alert("Erro ao adicionar: Verifique o console para detalhes.");
    }
}

// --- 3. FUNÇÃO DE ATUALIZAÇÃO (PUT) ---

async function toggleConcluida(id, concluida) {
    try {
        // Envia o status 'concluida' para a rota PUT da sua API
        await axios.put(`${API_BASE_URL}/${id}`, { concluida });
        
        carregarTarefas(); // Recarrega a lista para refletir a mudança

    } catch (error) {
        console.error("Erro ao atualizar tarefa:", error);
    }
}

// --- 4. FUNÇÃO DE DELEÇÃO (DELETE) ---

async function deletarTarefa(id) {
    if (!confirm("Tem certeza que deseja deletar esta tarefa?")) return;
    
    try {
        // Envia o pedido de DELETAR para a rota DELETE da sua API
        await axios.delete(`${API_BASE_URL}/${id}`);
        
        carregarTarefas(); // Recarrega a lista

    } catch (error) {
        console.error("Erro ao deletar tarefa:", error);
    }
}

// --- 5. INICIALIZAÇÃO ---

// Liga a função de adicionar ao evento de submit do formulário
if (formAdicionar) {
    formAdicionar.addEventListener('submit', adicionarTarefa);
}

// Carrega a lista de tarefas assim que o script é executado
carregarTarefas();