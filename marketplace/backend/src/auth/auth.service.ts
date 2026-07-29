import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      // Deliberately vague message — do not confirm/deny account existence to an unauthenticated caller.
      throw new ConflictException('Unable to register with these details');
    }

    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
      memoryCost: 19456, // OWASP-recommended baseline for argon2id
      timeCost: 2,
      parallelism: 1,
    });

    const user = await this.prisma.user.create({
      data: { email: dto.email, passwordHash, displayName: dto.displayName },
    });

    return this.issueTokens(user.id, user.email, user.role);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    // Constant-shape response whether the user exists or not, to resist user-enumeration.
    const validHash = user?.passwordHash ?? (await argon2.hash('dummy-to-equalize-timing'));
    const valid = await argon2.verify(validHash, dto.password).catch(() => false);

    if (!user || !valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueTokens(user.id, user.email, user.role);
  }

  private async issueTokens(sub: string, email: string, role: string) {
    const accessToken = await this.jwt.signAsync(
      { sub, email, role },
      { expiresIn: '15m' },
    );
    // Refresh token: longer-lived, rotated on use. Stored client-side as httpOnly cookie
    // in the real deployment; kept simple here since refresh-family tracking (Redis)
    // is a Slice-2 item alongside session revocation.
    const refreshToken = await this.jwt.signAsync({ sub }, { expiresIn: '7d' });
    return { accessToken, refreshToken };
  }
}
