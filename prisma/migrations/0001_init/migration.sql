-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('user', 'admin');

-- CreateEnum
CREATE TYPE "ContextType" AS ENUM ('cursorrules', 'claude_prompt', 'mcp_server');

-- CreateEnum
CREATE TYPE "ContextStatus" AS ENUM ('pending', 'approved', 'rejected', 'to_recheck');

-- CreateEnum
CREATE TYPE "EventKind" AS ENUM ('copy', 'install');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "email" TEXT,
    "mot_de_passe_hash" TEXT,
    "github_id" TEXT,
    "github_url" TEXT,
    "reputation_score" INTEGER NOT NULL DEFAULT 0,
    "role" "Role" NOT NULL DEFAULT 'user',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Context" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "ContextType" NOT NULL,
    "content_payload" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "pays" TEXT[],
    "version_api" TEXT NOT NULL,
    "source_url" TEXT NOT NULL,
    "source_hash" TEXT,
    "source_checked_at" TIMESTAMP(3),
    "tested_with" TEXT[],
    "status" "ContextStatus" NOT NULL DEFAULT 'pending',
    "last_verified_at" TIMESTAMP(3) NOT NULL,
    "author_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Context_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContextVersion" (
    "id" TEXT NOT NULL,
    "context_id" TEXT NOT NULL,
    "content_payload" TEXT NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContextVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContextTag" (
    "context_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,

    CONSTRAINT "ContextTag_pkey" PRIMARY KEY ("context_id","tag_id")
);

-- CreateTable
CREATE TABLE "Vote" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "context_id" TEXT NOT NULL,
    "value" INTEGER NOT NULL,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proof" (
    "id" TEXT NOT NULL,
    "context_id" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "output_sans_contexte" TEXT NOT NULL,
    "output_avec_contexte" TEXT NOT NULL,
    "modele" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Proof_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mock" (
    "id" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "base_path" TEXT NOT NULL,
    "fixtures" JSONB NOT NULL,
    "exemples_webhook" JSONB NOT NULL,

    CONSTRAINT "Mock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "context_id" TEXT NOT NULL,
    "user_id" TEXT,
    "raison" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "context_id" TEXT NOT NULL,
    "kind" "EventKind" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_github_id_key" ON "User"("github_id");

-- CreateIndex
CREATE UNIQUE INDEX "Context_slug_key" ON "Context"("slug");

-- CreateIndex
CREATE INDEX "Context_service_idx" ON "Context"("service");

-- CreateIndex
CREATE INDEX "Context_status_idx" ON "Context"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_user_id_context_id_key" ON "Vote"("user_id", "context_id");

-- CreateIndex
CREATE UNIQUE INDEX "Mock_service_key" ON "Mock"("service");

-- CreateIndex
CREATE INDEX "Event_context_id_kind_idx" ON "Event"("context_id", "kind");

-- AddForeignKey
ALTER TABLE "Context" ADD CONSTRAINT "Context_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContextVersion" ADD CONSTRAINT "ContextVersion_context_id_fkey" FOREIGN KEY ("context_id") REFERENCES "Context"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContextTag" ADD CONSTRAINT "ContextTag_context_id_fkey" FOREIGN KEY ("context_id") REFERENCES "Context"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContextTag" ADD CONSTRAINT "ContextTag_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_context_id_fkey" FOREIGN KEY ("context_id") REFERENCES "Context"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proof" ADD CONSTRAINT "Proof_context_id_fkey" FOREIGN KEY ("context_id") REFERENCES "Context"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_context_id_fkey" FOREIGN KEY ("context_id") REFERENCES "Context"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_context_id_fkey" FOREIGN KEY ("context_id") REFERENCES "Context"("id") ON DELETE CASCADE ON UPDATE CASCADE;

