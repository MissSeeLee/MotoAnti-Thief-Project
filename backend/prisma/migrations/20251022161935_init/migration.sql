-- CreateTable
CREATE TABLE "LocationHistory" (
    "id" SERIAL NOT NULL,
    "deviceId" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LocationHistory_pkey" PRIMARY KEY ("id")
);
