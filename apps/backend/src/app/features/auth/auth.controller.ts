import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { LIMITS } from "../../common/throttle/limits.js";
import { deviceLabel } from "./device-label.js";
import { AuthService } from "./auth.service.js";
import { ClerkExchangeDto } from "./dto/clerk-exchange.dto.js";
import { LoginDto } from "./dto/login.dto.js";
import { SignupDetailsDto } from "./dto/signup-details.dto.js";
import { SignupDto } from "./dto/signup.dto.js";
import { VerifyOtpDto } from "./dto/verify-otp.dto.js";

function bearerToken(authorization: string | undefined): string {
  const token = authorization?.match(/^Bearer (.+)$/)?.[1];
  if (!token) throw new UnauthorizedException("Missing bearer token.");
  return token;
}

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle(LIMITS.sensitive)
  @Post("signup/check")
  @HttpCode(HttpStatus.NO_CONTENT)
  async checkSignupDetails(@Body() dto: SignupDetailsDto) {
    await this.authService.checkSignupDetails(dto);
  }

  @Throttle(LIMITS.sendEmail)
  @Post("signup/otp")
  @HttpCode(HttpStatus.OK)
  sendSignupOtp(@Body() dto: SignupDetailsDto) {
    return this.authService.sendSignupOtp(dto);
  }

  @Throttle(LIMITS.sensitive)
  @Post("signup/otp/verify")
  @HttpCode(HttpStatus.OK)
  verifySignupOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifySignupOtp(dto);
  }

  @Throttle(LIMITS.sensitive)
  @Post("signup")
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Throttle(LIMITS.login)
  @Post("login")
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Throttle(LIMITS.sensitive)
  @Post("oauth/clerk")
  @HttpCode(HttpStatus.OK)
  loginWithClerk(@Body() dto: ClerkExchangeDto, @Headers("user-agent") userAgent?: string) {
    return this.authService.loginWithClerk(dto.token, deviceLabel(userAgent));
  }

  @Get("me")
  me(@Headers("authorization") authorization?: string) {
    return this.authService.me(bearerToken(authorization));
  }

  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Headers("authorization") authorization?: string) {
    await this.authService.logout(bearerToken(authorization));
  }
}
