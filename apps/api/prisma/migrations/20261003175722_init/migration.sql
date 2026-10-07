-- CreateTable
CREATE TABLE "artists" (
    "id" INTEGER NOT NULL,
    "owner" VARCHAR(42) NOT NULL,
    "metadataURI" TEXT NOT NULL,
    "supporterCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT,
    "photo" TEXT,
    "bio" TEXT,
    "links" JSONB,

    CONSTRAINT "artists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supporters" (
    "id" SERIAL NOT NULL,
    "artistId" INTEGER NOT NULL,
    "address" VARCHAR(42) NOT NULL,
    "rank" INTEGER NOT NULL,
    "weight" INTEGER NOT NULL,
    "signedAt" TIMESTAMP(3) NOT NULL,
    "stakeWei" VARCHAR(78) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supporters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pools" (
    "id" INTEGER NOT NULL,
    "artistId" INTEGER NOT NULL,
    "amountWei" VARCHAR(78) NOT NULL,
    "milestoneHash" VARCHAR(66) NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "voteEnd" TIMESTAMP(3),
    "supportersAtOpen" INTEGER NOT NULL,
    "totalWeightAtOpen" VARCHAR(78) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "evidenceURI" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "votes" (
    "id" SERIAL NOT NULL,
    "poolId" INTEGER NOT NULL,
    "address" VARCHAR(42) NOT NULL,
    "approve" BOOLEAN NOT NULL,
    "weight" VARCHAR(78) NOT NULL,
    "votedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "indexer_cursors" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "lastBlock" BIGINT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "indexer_cursors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "supporters_artistId_rank_idx" ON "supporters"("artistId", "rank");

-- CreateIndex
CREATE INDEX "supporters_address_idx" ON "supporters"("address");

-- CreateIndex
CREATE UNIQUE INDEX "supporters_artistId_address_key" ON "supporters"("artistId", "address");

-- CreateIndex
CREATE INDEX "pools_artistId_status_idx" ON "pools"("artistId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "votes_poolId_address_key" ON "votes"("poolId", "address");

-- CreateIndex
CREATE UNIQUE INDEX "indexer_cursors_name_key" ON "indexer_cursors"("name");

-- AddForeignKey
ALTER TABLE "supporters" ADD CONSTRAINT "supporters_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "artists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pools" ADD CONSTRAINT "pools_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "artists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "pools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
