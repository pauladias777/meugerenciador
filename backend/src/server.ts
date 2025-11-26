import 'dotenv/config'; // <- importante para carregar o .env
import express, { Request, Response } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { z, ZodError } from 'zod'; // Zod importado

// 2. SCHEMAS ZOD
const CreateTaskSchema = z.object({
    titulo: z.string().min(1, "O título não pode ser vazio."),
});

const UpdateTaskSchema = z.object({
    titulo: z.string().min(1, "O título não pode ser vazio.").optional(),
    concluida: z.boolean().optional(),
}).refine(data => data.titulo !== undefined || data.concluida !== undefined, {
    message: "Pelo menos um campo (titulo ou concluida) deve ser fornecido para a atualização.",
});

// 3. INICIALIZAÇÃO
const app = express();
app.use(cors({
    origin: '*' // Lembre-se de mudar para a URL do seu frontend quando deployar
}));
app.use(express.json());

const prisma = new PrismaClient();

// --- ROTAS CRUD E EXTRAS ---

// ROTA 1: GET /tarefas (Listar Tarefas)
app.get('/tarefas', async (req: Request, res: Response) => {
    try {
        const tarefas = await prisma.tarefa.findMany();
        res.json(tarefas);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao listar tarefas.' });
    }
});

// ROTA 2: POST /tarefas (Criar Tarefa) - COM VALIDAÇÃO ZOD
app.post('/tarefas', async (req: Request, res: Response) => {
    try {
        // Validação Zod
        const { titulo } = CreateTaskSchema.parse(req.body);

        const tarefa = await prisma.tarefa.create({ data: { titulo } });
        res.status(201).json(tarefa); // 201 Created

    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({
                message: "Erro de validação dos dados (Zod)",
                errors: (error as z.ZodError).errors // <-- CORRIGIDO
            });
        }
        console.error(error);
        res.status(500).json({ message: 'Erro ao criar tarefa.' });
    }
});

// ROTA 3: PUT /tarefas/:id (Atualizar Tarefa) - COM VALIDAÇÃO ZOD e tratamento de ID
app.put('/tarefas/:id', async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        // Validação Zod
        const dataToUpdate = UpdateTaskSchema.parse(req.body);

        const tarefa = await prisma.tarefa.update({
            where: { id: Number(id) },
            data: dataToUpdate
        });
        res.json(tarefa);

    } catch (error: any) { // Usamos 'any' aqui para facilitar a verificação de 'error.code' do Prisma
        if (error instanceof ZodError) {
            return res.status(400).json({
                message: "Erro de validação dos dados (Zod)",
                errors: (error as z.ZodError).errors 
            });
        }
        
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Tarefa não encontrada.' });
        }
        console.error(error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// ROTA 4: DELETE /tarefas/:id (Deletar Tarefa)
app.delete('/tarefas/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await prisma.tarefa.delete({ where: { id: Number(id) } });
        res.status(204).send(); // 204 No Content

    } catch (error: any) {
        // Tratamento para Tarefa Não Encontrada
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Tarefa não encontrada.' });
        }
        console.error(error);
        res.status(500).json({ message: 'Erro ao deletar tarefa.' });
    }
});

// ROTA EXTRA: GET /tarefas/filtro/:status (Filtrar por Status)
app.get('/tarefas/filtro/:status', async (req: Request, res: Response) => {
    const { status } = req.params;
    let concluida: boolean;

    if (status === 'concluida') {
        concluida = true;
    } else if (status === 'pendente') {
        concluida = false;
    } else {
        return res.status(400).json({ message: "Status de filtro inválido. Use 'concluida' ou 'pendente'." });
    }

    try {
        const tarefas = await prisma.tarefa.findMany({
            where: { concluida: concluida }
        });
        res.json(tarefas);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao filtrar tarefas.' });
    }
});

// ROTA EXTRA: PATCH /tarefas/concluir-todas (Atualização em Massa)
app.patch('/tarefas/concluir-todas', async (req: Request, res: Response) => {
    try {
        const resultado = await prisma.tarefa.updateMany({
            where: {
                concluida: false // Altera apenas as que estão pendentes
            },
            data: {
                concluida: true
            }
        });
        res.json({
            message: `Todas as ${resultado.count} tarefas pendentes foram concluídas.`,
            count: resultado.count
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao concluir todas as tarefas.' });
    }
});


// 4. INICIA O SERVIDOR
app.listen(3000, () => console.log('Servidor rodando na porta 3000'));