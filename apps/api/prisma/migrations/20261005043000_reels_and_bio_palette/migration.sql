ALTER TABLE "artists" ADD COLUMN "bioWash" VARCHAR(7);
ALTER TABLE "artists" ADD COLUMN "bioInk" VARCHAR(7);

CREATE TABLE "artist_reels" (
    "id" SERIAL NOT NULL,
    "artistId" INTEGER NOT NULL,
    "caption" VARCHAR(80) NOT NULL DEFAULT '',
    "fileName" VARCHAR(64) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "artist_reels_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "artist_reels_artistId_createdAt_idx" ON "artist_reels"("artistId", "createdAt");

ALTER TABLE "artist_reels" ADD CONSTRAINT "artist_reels_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "artists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
