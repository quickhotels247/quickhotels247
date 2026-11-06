import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import type { User } from "@quickhotels/types/users";
import { toPublicUser } from "../../auth/dto/auth-response.dto.js";
import { UsersRepository } from "../../auth/users.repository.js";
import type { UpdateProfileDto } from "./dto/update-profile.dto.js";

// Customers must be at least this old to hold an account (booking needs an adult).
const MIN_AGE = 18;

// The signed-in customer's personal details. Email and username stay fixed:
// email is the sign-in identity (verified through Clerk).
@Injectable()
export class ProfileService {
  constructor(private readonly users: UsersRepository) {}

  async update(userId: string, dto: UpdateProfileDto): Promise<User> {
    const code = dto.phoneCode ?? "";
    const number = dto.phone ?? "";
    if (Boolean(code) !== Boolean(number)) throw new BadRequestException("Enter both the country code and the phone number, or neither.");
    if (dto.dateOfBirth) checkDateOfBirth(dto.dateOfBirth);
    if (!(await this.users.findById(userId))) throw new UnauthorizedException("Your session has expired.");
    const user = await this.users.updateProfile(userId, {
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: number ? `${code} ${number}` : null,
      dateOfBirth: dto.dateOfBirth ?? null,
      nationality: dto.nationality ?? null,
      gender: dto.gender ?? null,
      address: dto.address
        ? { line1: dto.address.line1, line2: dto.address.line2 ?? null, city: dto.address.city, state: dto.address.state ?? null, postcode: dto.address.postcode ?? null, country: dto.address.country }
        : null,
    });
    return toPublicUser(user);
  }
}

function checkDateOfBirth(value: string) {
  const birth = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(birth.getTime()) || birth.toISOString().slice(0, 10) !== value || value < "1900-01-01") throw new BadRequestException("Check the date of birth.");
  const adult = new Date(birth);
  adult.setUTCFullYear(adult.getUTCFullYear() + MIN_AGE);
  if (adult > new Date()) throw new BadRequestException(`You must be at least ${MIN_AGE} to have an account.`);
}
