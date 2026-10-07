CREATE TABLE "used_signatures" (
    "signature" VARCHAR(132) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "used_signatures_pkey" PRIMARY KEY ("signature")
);
