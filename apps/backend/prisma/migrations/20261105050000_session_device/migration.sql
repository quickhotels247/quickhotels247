-- Device label ("Chrome on macOS") for the signed-in devices list.
ALTER TABLE "auth_tokens" ADD COLUMN "device" TEXT;
