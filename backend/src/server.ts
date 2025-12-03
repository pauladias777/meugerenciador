import 'dotenv/config'; // <- importante para carregar o .env
import express, { Request, Response } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { z, ZodError } from 'zod';

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
    origin: '*' 
}));
app.use(express.json());

const prisma = new PrismaClient();

// ROTA 1: LISTAR
app.get('/tarefas', async (req: Request, res: Response) => {
    try {
        const tarefas = await prisma.tarefa.findMany();
        res.json(tarefas);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao listar tarefas.' });
    }
});

// ROTA 2: CRIAR
app.post('/tarefas', async (req: Request, res: Response) => {
    try {
        const { titulo } = CreateTaskSchema.parse(req.body);

        const tarefa = await prisma.tarefa.create({ data: { titulo } });
        res.status(201).json(tarefa);

    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({
                message: "Erro de validação dos dados (Zod)",
                errors: error.issues   // <-- CORREÇÃO REAL
            });
        }
        console.error(error);
        res.status(500).json({ message: 'Erro ao criar tarefa.' });
    }
});

// ROTA 3: ATUALIZAR
app.put('/tarefas/:id', async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const dataToUpdate = UpdateTaskSchema.parse(req.body);

        const tarefa = await prisma.tarefa.update({
            where: { id: Number(id) },
            data: dataToUpdate
        });
        res.json(tarefa);

    } catch (error: any) {
        if (error instanceof ZodError) {
            return res.status(400).json({
                message: "Erro de validação dos dados (Zod)",
                errors: error.issues   // <-- CORREÇÃO REAL
            });
        }
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Tarefa não encontrada.' });
        }
        console.error(error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// ROTA 4: DELETAR
app.delete('/tarefas/:id', async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        await prisma.tarefa.delete({ where: { id: Number(id) } });
        res.status(204).send();

    } catch (error: any) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Tarefa não encontrada.' });
        }
        console.error(error);
        res.status(500).json({ message: 'Erro ao deletar tarefa.' });
    }
});


app.get('/tarefas/filtro/:status', async (req: Request, res: Response) => {
    const { status } = req.params;

    let concluida: boolean;
    if (status === 'concluida') concluida = true;
    else if (status === 'pendente') concluida = false;
    else return res.status(400).json({ message: "Use 'concluida' ou 'pendente'." });

    try {
        const tarefas = await prisma.tarefa.findMany({ where: { concluida } });
        res.json(tarefas);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao filtrar tarefas.' });
    }
});


app.patch('/tarefas/concluir-todas', async (req: Request, res: Response) => {
    try {
        const resultado = await prisma.tarefa.updateMany({
            where: { concluida: false },
            data: { concluida: true }
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


app.listen(3000, () => console.log('Servidor rodando na porta 3000'));
