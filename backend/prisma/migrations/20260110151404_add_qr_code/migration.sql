/*
  Warnings:

  - A unique constraint covering the columns `[qrCode]` on the table `Tool` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Tool" ADD COLUMN     "qrCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Tool_qrCode_key" ON "Tool"("qrCode");
