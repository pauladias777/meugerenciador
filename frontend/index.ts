import axios from "axios";
import { z } from "zod";

// URL da sua API
const API_URL = "http://localhost:3000/tarefas";

// Schema Zod para validar o título da tarefa
const TarefaSchema = z.object({
    titulo: z.string().min(1, "O título não pode ser vazio."),
});

// Elementos HTML
const listaTarefas = document.getElementById("lista-tarefas") as HTMLUListElement;
const form = document.getElementById("form-adicionar") as HTMLFormElement;
const inputTitulo = document.getElementById("input-titulo") as HTMLInputElement;

// Renderizar lista
function renderizar(tarefas: any[]) {
    listaTarefas.innerHTML = "";

    tarefas.forEach(tarefa => {
        const li = document.createElement("li");

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = tarefa.concluida;
        checkbox.addEventListener("change", () =>
            atualizarStatus(tarefa.id, !tarefa.concluida)
        );

        const span = document.createElement("span");
        span.textContent = tarefa.titulo;
        if (tarefa.concluida) span.style.textDecoration = "line-through";

        const btn = document.createElement("button");
        btn.textContent = "X";
        btn.addEventListener("click", () => deletar(tarefa.id));

        li.appendChild(checkbox);
        li.appendChild(span);
        li.appendChild(btn);

        listaTarefas.appendChild(li);
    });
}

// Carregar tarefas
async function carregar() {
    try {
        const res = await axios.get(API_URL);
        renderizar(res.data);
    } catch {
        listaTarefas.innerHTML = "<li>Erro ao carregar tarefas</li>";
    }
}

// Adicionar nova tarefa
async function adicionar(e: Event) {
    e.preventDefault();

    const titulo = inputTitulo.value.trim();

    const validado = TarefaSchema.safeParse({ titulo });

    if (!validado.success) {
        alert(validado.error.issues[0].message);
        return;
    }

    try {
        await axios.post(API_URL, { titulo });
        inputTitulo.value = "";
        carregar();
    } catch {
        alert("Erro ao adicionar tarefa");
    }
}

// Atualizar concluída
async function atualizarStatus(id: number, concluida: boolean) {
    try {
        await axios.put(`${API_URL}/${id}`, { concluida });
        carregar();
    } catch {
        console.error("Erro ao atualizar");
    }
}

// Deletar tarefa
async function deletar(id: number) {
    if (!confirm("Tem certeza que deseja excluir?")) return;

    try {
        await axios.delete(`${API_URL}/${id}`);
        carregar();
    } catch {
        alert("Erro ao deletar tarefa");
    }
}

// Eventos
form.addEventListener("submit", adicionar);

// Inicialização
carregar();
