-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Device" (
    "id" SERIAL NOT NULL,
    "deviceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "emergencyPhone" TEXT,
    "currentBattery" INTEGER DEFAULT 0,
    "currentStatus" TEXT DEFAULT 'OFFLINE',
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocationHistory" (
    "id" SERIAL NOT NULL,
    "deviceId" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lng" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "accel_x" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "accel_y" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "accel_z" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT DEFAULT 'NORMAL',
    "speed" DOUBLE PRECISION DEFAULT 0,
    "vibration" INTEGER DEFAULT 0,
    "battery" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LocationHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceShare" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "label" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deviceId" TEXT NOT NULL,

    CONSTRAINT "DeviceShare_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_verificationToken_key" ON "User"("verificationToken");

-- CreateIndex
CREATE UNIQUE INDEX "Device_deviceId_key" ON "Device"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceShare_token_key" ON "DeviceShare"("token");

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationHistory" ADD CONSTRAINT "LocationHistory_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("deviceId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceShare" ADD CONSTRAINT "DeviceShare_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("deviceId") ON DELETE CASCADE ON UPDATE CASCADE;

