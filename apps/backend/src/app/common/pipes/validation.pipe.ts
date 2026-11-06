import { ValidationPipe } from "@nestjs/common";

// Validates request bodies against their DTO classes and strips unknown fields.
export function createValidationPipe() {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  });
}
