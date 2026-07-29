import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { SessionsService } from './sessions.service';

interface AccessTokenPayload {
  sub: string;
  email: string;
  role: string;
  sessionId?: string; // absent on tokens issued before this change — treated as valid, session check skipped
  purpose?: string; // 'two_factor' marks a short-lived login-challenge token — never valid here
  iat: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private prisma: PrismaService,
    private sessions: SessionsService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET') ?? config.get<string>('jwt.secret'),
    });
  }

  async validate(payload: AccessTokenPayload) {
    // A 2FA-challenge token is a different token *purpose* signed with the
    // same secret — reject it outright if someone tries to use it as a
    // normal access token instead of exchanging it via /auth/2fa/verify.
    if (payload.purpose === 'two_factor') {
      throw new UnauthorizedException('Invalid token');
    }

    // Tokens issued before a password change are rejected even if not yet
    // expired — closes the window where a stolen-but-not-yet-expired access
    // token keeps working after the legitimate user changes their password.
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { passwordChangedAt: true },
    });
    if (user?.passwordChangedAt && payload.iat * 1000 < user.passwordChangedAt.getTime()) {
      throw new UnauthorizedException('Token invalidated by password change');
    }

    // Session check makes logout instant instead of "eventually, once the
    // access token naturally expires." Tokens without a sessionId (issued
    // before this change) skip the check rather than being rejected outright.
    if (payload.sessionId) {
      const active = await this.sessions.isActive(payload.sessionId);
      if (!active) throw new UnauthorizedException('Session has been revoked');
    }

    // Returned value is attached to req.user — shape unchanged from before
    // (userId/email/role) so every existing @CurrentUser() consumer in
    // Listings/Deals/Payments keeps working without modification.
    return { userId: payload.sub, email: payload.email, role: payload.role, sessionId: payload.sessionId };
  }
}
