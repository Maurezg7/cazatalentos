ALTER TABLE "artists" ADD COLUMN "cover" TEXT;

CREATE TABLE "artist_posts" (
    "id" SERIAL NOT NULL,
    "artistId" INTEGER NOT NULL,
    "body" VARCHAR(280) NOT NULL,
    "media" TEXT,
    "mediaKind" VARCHAR(8),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "artist_posts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "artist_posts_artistId_createdAt_idx" ON "artist_posts"("artistId", "createdAt");

ALTER TABLE "artist_posts" ADD CONSTRAINT "artist_posts_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "artists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
