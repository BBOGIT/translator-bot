-- CreateTable
CREATE TABLE "channel_extraction_configs" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "channelId" TEXT NOT NULL,
    "channelTitle" TEXT,
    "channelUsername" TEXT,
    "wordRegex" TEXT NOT NULL,
    "translationRegex" TEXT NOT NULL,
    "examplesRegex" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdByAI" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "channel_extraction_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "channel_extraction_configs_channelId_key" ON "channel_extraction_configs"("channelId");

-- CreateIndex
CREATE INDEX "channel_extraction_configs_channelId_idx" ON "channel_extraction_configs"("channelId");

-- CreateIndex
CREATE INDEX "channel_extraction_configs_isActive_idx" ON "channel_extraction_configs"("isActive");
