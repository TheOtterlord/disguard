-- CreateEnum
CREATE TYPE "Action" AS ENUM ('BAN', 'KICK', 'MUTE', 'NONE');

-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('HACKED', 'SCAMMER');

-- CreateTable
CREATE TABLE "GuildSettings" (
    "guild" TEXT NOT NULL,
    "scammer" "Action" NOT NULL DEFAULT E'BAN',
    "hacked" "Action" NOT NULL DEFAULT E'MUTE',
    "logChannel" TEXT,

    CONSTRAINT "GuildSettings_pkey" PRIMARY KEY ("guild")
);

-- CreateTable
CREATE TABLE "Domain" (
    "value" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "reporter" TEXT NOT NULL,
    "blacklistId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Domain_pkey" PRIMARY KEY ("value")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "type" "UserType" NOT NULL,
    "reporter" TEXT NOT NULL,
    "blacklistId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Blacklist" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "controllers" TEXT[],
    "subscribers" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Blacklist_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Domain" ADD CONSTRAINT "Domain_blacklistId_fkey" FOREIGN KEY ("blacklistId") REFERENCES "Blacklist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_blacklistId_fkey" FOREIGN KEY ("blacklistId") REFERENCES "Blacklist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
