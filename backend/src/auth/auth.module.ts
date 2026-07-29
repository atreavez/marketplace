import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { SessionsService } from './sessions.service';
import { LoginHistoryService } from './login-history.service';
import { EmailVerificationService } from './email-verification.service';
import { PasswordResetService } from './password-reset.service';
import { TwoFactorService } from './two-factor.service';
import { MailerService } from './mailer/mailer.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') ?? config.get<string>('jwt.secret'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  providers: [
    AuthService,
    JwtStrategy,
    SessionsService,
    LoginHistoryService,
    EmailVerificationService,
    PasswordResetService,
    TwoFactorService,
    MailerService,
  ],
  controllers: [AuthController],
  // SessionsService and LoginHistoryService are exported so the Users module
  // can offer GET /users/me/login-history and a future "active sessions"
  // profile widget without re-implementing session/history lookups.
  exports: [AuthService, SessionsService, LoginHistoryService],
})
export class AuthModule {}
