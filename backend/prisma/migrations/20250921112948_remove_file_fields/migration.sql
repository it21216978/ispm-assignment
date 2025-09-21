/*
  Warnings:

  - You are about to drop the column `fileName` on the `Policy` table. All the data in the column will be lost.
  - You are about to drop the column `filePath` on the `Policy` table. All the data in the column will be lost.
  - You are about to drop the column `fileSize` on the `Policy` table. All the data in the column will be lost.
  - You are about to drop the column `mimeType` on the `Policy` table. All the data in the column will be lost.
  - You are about to drop the column `fileName` on the `TrainingContent` table. All the data in the column will be lost.
  - You are about to drop the column `filePath` on the `TrainingContent` table. All the data in the column will be lost.
  - You are about to drop the column `fileSize` on the `TrainingContent` table. All the data in the column will be lost.
  - You are about to drop the column `mimeType` on the `TrainingContent` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Policy" DROP COLUMN "fileName",
DROP COLUMN "filePath",
DROP COLUMN "fileSize",
DROP COLUMN "mimeType";

-- AlterTable
ALTER TABLE "public"."TrainingContent" DROP COLUMN "fileName",
DROP COLUMN "filePath",
DROP COLUMN "fileSize",
DROP COLUMN "mimeType";
