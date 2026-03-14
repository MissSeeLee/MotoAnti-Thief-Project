-- AddForeignKey
ALTER TABLE "LocationHistory" ADD CONSTRAINT "LocationHistory_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("deviceId") ON DELETE CASCADE ON UPDATE CASCADE;
