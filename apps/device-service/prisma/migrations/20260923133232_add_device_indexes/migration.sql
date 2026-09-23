-- CreateIndex
CREATE INDEX "Device_homeId_type_idx" ON "Device"("homeId", "type");

-- CreateIndex
CREATE INDEX "Device_homeId_status_idx" ON "Device"("homeId", "status");
