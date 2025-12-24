/*
  Warnings:

  - Added the required column `updatedAt` to the `AppConfig` table without a default value. This is not possible if the table is not empty.
  - Made the column `apiKey` on table `AppConfig` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "Flower_name_key";

-- AlterTable
ALTER TABLE "Flower" ADD COLUMN "alias" TEXT;
ALTER TABLE "Flower" ADD COLUMN "englishName" TEXT;
ALTER TABLE "Flower" ADD COLUMN "photographer" TEXT;

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "isFirstLogin" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "roleId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "permissions" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ImageConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accessKey" TEXT NOT NULL,
    "secretKey" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'unsplash',
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AppConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "baseUrl" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_AppConfig" ("apiKey", "baseUrl", "id", "modelName") SELECT "apiKey", "baseUrl", "id", "modelName" FROM "AppConfig";
DROP TABLE "AppConfig";
ALTER TABLE "new_AppConfig" RENAME TO "AppConfig";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Role_code_key" ON "Role"("code");
