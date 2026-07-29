import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { ChangePasswordDto } from './dto/password.dto';
import { ARGON2ID_OPTIONS } from './password.util';
import { SessionsService } from './sessions.service';
import { LoginHistoryService } from './login-history.service';
import { EmailVerificationService } from './email-verification.service';
import { TwoFactorService } from './two-factor.service';

interface RequestContext {
  ip?: string;
  userAgent?: string;
  deviceLabel?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private sessions: SessionsService,
    private loginHistory: LoginHistoryService,
    private emailVerification: EmailVerificationService,
    private twoFactor: TwoFactorService,
  ) {}

  private get isProd() {
    return this.config.get<string>('app.env') === 'production';
  }

  async register(dto: RegisterDto, ctx: RequestContext) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      // Deliberately vague message — do not confirm/deny account existence to an unauthenticated caller.
      throw new ConflictException('Unable to register with these details');
    }

    const passwordHash = await argon2.hash(dto.password, ARGON2ID_OPTIONS);
    const user = await this.prisma.user.create({
      data: { email: dto.email, passwordHash, displayName: dto.displayName },
    });

    await this.loginHistory.record(user.id, true, 'register', ctx);

    // Registration still auto-logs-in (unchanged behavior) — email
    // verification runs in parallel, not as a gate on this response.
    const devVerificationToken = await this.emailVerification.requestVerification(user.id, user.email);
    const tokens = await this.issueSessionTokens(user, ctx);

    return {
      ...tokens,
      // Only present outside production — lets local/dev/e2e testing
      // complete the verification flow without reading server logs.
      ...(this.isProd ? {} : { devVerificationToken }),
    };
  }

  async login(dto: LoginDto, ctx: RequestContext) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    // Constant-shape response whether the user exists or not, to resist user-enumeration.
    const validHash = user?.passwordHash ?? (await argon2.hash('dummy-to-equalize-timing'));
    const valid = await argon2.verify(validHash, dto.password).catch(() => false);

    if (!user || !valid) {
      if (user) await this.loginHistory.record(user.id, false, 'invalid_password', ctx);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.twoFactorEnabled) {
      await this.loginHistory.record(user.id, false, 'password_ok_2fa_pending', ctx);
      const twoFactorToken = await this.jwt.signAsync(
        { sub: user.id, purpose: 'two_factor' },
        { expiresIn: '5m' },
      );
      return { twoFactorRequired: true, twoFactorToken };
    }

    await this.loginHistory.record(user.id, true, 'success', ctx);
    return this.issueSessionTokens(user, ctx);
  }

  async verifyTwoFactorLogin(twoFactorToken: string, code: string, ctx: RequestContext) {
    let payload: { sub: string; purpose?: string };
    try {
      payload = await this.jwt.verifyAsync(twoFactorToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired two-factor challenge');
    }
    if (payload.purpose !== 'two_factor') {
      throw new UnauthorizedException('Invalid challenge token');
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw new UnauthorizedException('Invalid challenge token');

    const verified = await this.twoFactor.verifyCodeOrBackup(user.id, code);
    if (!verified) {
      await this.loginHistory.record(user.id, false, '2fa_failed', ctx);
      throw new UnauthorizedException('Invalid authenticator or backup code');
    }

    await this.loginHistory.record(user.id, true, 'success_2fa', ctx);
    return this.issueSessionTokens(user, ctx);
  }

  async refresh(rawRefreshToken: string) {
    const { session, rawToken } = await this.sessions.rotate(rawRefreshToken);
    const user = await this.prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) throw new UnauthorizedException('Invalid refresh token');

    const accessToken = await this.signAccessToken(user, session.id);
    return { accessToken, refreshToken: rawToken };
  }

  async logout(rawRefreshToken: string) {
    await this.sessions.revokeByRawToken(rawRefreshToken);
  }

  async logoutAll(userId: string, currentSessionId?: string) {
    await this.sessions.revokeAll(userId, currentSessionId);
  }

  async changePassword(userId: string, dto: ChangePasswordDto, currentSessionId?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();

    const valid = await argon2.verify(user.passwordHash, dto.currentPassword).catch(() => false);
    if (!valid) throw new UnauthorizedException('Current password is incorrect');

    const passwordHash = await argon2.hash(dto.newPassword, ARGON2ID_OPTIONS);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash, passwordChangedAt: new Date() },
    });

    // Keep the device that made this change logged in; every other device
    // now holds an access token that's about to fail the passwordChangedAt
    // check anyway, so revoking their sessions too just makes that immediate
    // and gives them a clean "logged out" state instead of a confusing error.
    await this.sessions.revokeAll(userId, currentSessionId);
  }

  private async issueSessionTokens(
    user: { id: string; email: string; role: string },
    ctx: RequestContext,
  ) {
    const { session, rawToken: refreshToken } = await this.sessions.create(user.id, ctx);
    const accessToken = await this.signAccessToken(user, session.id);
    return { accessToken, refreshToken };
  }

  private async signAccessToken(user: { id: string; email: string; role: string }, sessionId: string) {
    return this.jwt.signAsync(
      { sub: user.id, email: user.email, role: user.role, sessionId },
      { expiresIn: '15m' },
    );
  }
}
