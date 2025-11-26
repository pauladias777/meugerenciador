/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Tarefa` table. All the data in the column will be lost.
  - You are about to drop the column `descricao` on the `Tarefa` table. All the data in the column will be lost.
  - You are about to drop the column `feita` on the `Tarefa` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Tarefa" DROP COLUMN "createdAt",
DROP COLUMN "descricao",
DROP COLUMN "feita",
ADD COLUMN     "concluida" BOOLEAN NOT NULL DEFAULT false;
