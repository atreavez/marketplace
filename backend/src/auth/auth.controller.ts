import { Body, Controller, Delete, Get, HttpCode, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { SessionsService } from './sessions.service';
import { TwoFactorService } from './two-factor.service';
import { EmailVerificationService } from './email-verification.service';
import { PasswordResetService } from './password-reset.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { LogoutDto, RefreshTokenDto } from './dto/refresh.dto';
import { ChangePasswordDto, ConfirmPasswordResetDto, RequestPasswordResetDto } from './dto/password.dto';
import { ConfirmEmailVerificationDto } from './dto/email-verification.dto';
import { TwoFactorCodeDto, TwoFactorLoginVerifyDto } from './dto/two-factor.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

function deviceContext(req: Request, deviceLabel?: string) {
  return {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    deviceLabel,
  };
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private sessionsService: SessionsService,
    private twoFactorService: TwoFactorService,
    private emailVerificationService: EmailVerificationService,
    private passwordResetService: PasswordResetService,
    private config: ConfigService,
  ) {}

  private get isProd() {
    return this.config.get<string>('app.env') === 'production';
  }

  // --- Registration / Login (routes and response shape unchanged for existing callers) ---

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } }) // tighter limit — signup abuse is a common bot target
  register(@Body() dto: RegisterDto, @Req() req: Request) {
    return this.authService.register(dto, deviceContext(req));
  }

  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } }) // slows credential-stuffing without blocking normal retries
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto, deviceContext(req));
  }

  // --- Two-factor login completion ---

  @Post('2fa/verify')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  verifyTwoFactorLogin(@Body() dto: TwoFactorLoginVerifyDto, @Req() req: Request) {
    return this.authService.verifyTwoFactorLogin(dto.twoFactorToken, dto.code, deviceContext(req));
  }

  // --- Refresh / Logout ---

  @Post('refresh')
  @HttpCode(200)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(204)
  async logout(@Body() dto: LogoutDto) {
    await this.authService.logout(dto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('logout-all')
  @HttpCode(204)
  async logoutAll(@CurrentUser() user: { userId: string; sessionId?: string }) {
    // Keeps the calling device's own session alive — "log out everywhere
    // else," not "log me out too." Use DELETE /auth/sessions/:id for that.
    await this.authService.logoutAll(user.userId, user.sessionId);
  }

  // --- Change password (authenticated) ---

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('change-password')
  @HttpCode(204)
  async changePassword(
    @CurrentUser() user: { userId: string; sessionId?: string },
    @Body() dto: ChangePasswordDto,
  ) {
    await this.authService.changePassword(user.userId, dto, user.sessionId);
  }

  // --- Password reset (public) ---

  @Post('password-reset/request')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async requestPasswordReset(@Body() dto: RequestPasswordResetDto, @Req() req: Request) {
    const token = await this.passwordResetService.requestReset(dto.email, req.ip);
    // Always the same response whether or not the email exists — see
    // PasswordResetService.requestReset for the anti-enumeration reasoning.
    return {
      message: 'If that email is registered, a reset link has been sent.',
      ...(this.isProd || !token ? {} : { devResetToken: token }),
    };
  }

  @Post('password-reset/confirm')
  @HttpCode(204)
  async confirmPasswordReset(@Body() dto: ConfirmPasswordResetDto) {
    await this.passwordResetService.confirmReset(dto.token, dto.newPassword);
  }

  // --- Email verification ---

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('verify-email/request')
  @HttpCode(200)
  async requestEmailVerification(@CurrentUser() user: { userId: string; email: string }) {
    const token = await this.emailVerificationService.requestVerification(user.userId, user.email);
    return {
      message: 'Verification email sent.',
      ...(this.isProd ? {} : { devVerificationToken: token }),
    };
  }

  @Post('verify-email/confirm')
  @HttpCode(204)
  async confirmEmailVerification(@Body() dto: ConfirmEmailVerificationDto) {
    await this.emailVerificationService.confirm(dto.token);
  }

  // --- Two-factor setup/enable/disable (authenticated) ---

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('2fa/setup')
  setupTwoFactor(@CurrentUser() user: { userId: string; email: string }) {
    return this.twoFactorService.setup(user.userId, user.email);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('2fa/enable')
  async enableTwoFactor(@CurrentUser() user: { userId: string }, @Body() dto: TwoFactorCodeDto) {
    const backupCodes = await this.twoFactorService.enable(user.userId, dto.code);
    return { backupCodes }; // shown exactly once — client must display and let the user save them
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('2fa/disable')
  @HttpCode(204)
  async disableTwoFactor(@CurrentUser() user: { userId: string }, @Body() dto: TwoFactorCodeDto) {
    await this.twoFactorService.disable(user.userId, dto.code);
  }

  // --- Device / session management ---

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('sessions')
  async listSessions(@CurrentUser() user: { userId: string; sessionId?: string }) {
    const sessions = await this.sessionsService.listActive(user.userId);
    return sessions.map((s) => ({ ...s, current: s.id === user.sessionId }));
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete('sessions/:id')
  @HttpCode(204)
  async revokeSession(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    await this.sessionsService.revoke(id, user.userId);
  }
}
