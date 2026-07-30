"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const argon2 = __importStar(require("argon2"));
const prisma_service_1 = require("../prisma/prisma.service");
const password_util_1 = require("./password.util");
const sessions_service_1 = require("./sessions.service");
const login_history_service_1 = require("./login-history.service");
const email_verification_service_1 = require("./email-verification.service");
const two_factor_service_1 = require("./two-factor.service");
let AuthService = class AuthService {
    constructor(prisma, jwt, config, sessions, loginHistory, emailVerification, twoFactor) {
        this.prisma = prisma;
        this.jwt = jwt;
        this.config = config;
        this.sessions = sessions;
        this.loginHistory = loginHistory;
        this.emailVerification = emailVerification;
        this.twoFactor = twoFactor;
    }
    get isProd() {
        return this.config.get('app.env') === 'production';
    }
    async register(dto, ctx) {
        const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (existing) {
            throw new common_1.ConflictException('Unable to register with these details');
        }
        const passwordHash = await argon2.hash(dto.password, password_util_1.ARGON2ID_OPTIONS);
        const user = await this.prisma.user.create({
            data: { email: dto.email, passwordHash, displayName: dto.displayName },
        });
        await this.loginHistory.record(user.id, true, 'register', ctx);
        const devVerificationToken = await this.emailVerification.requestVerification(user.id, user.email);
        const tokens = await this.issueSessionTokens(user, ctx);
        return {
            ...tokens,
            ...(this.isProd ? {} : { devVerificationToken }),
        };
    }
    async login(dto, ctx) {
        const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
        const validHash = user?.passwordHash ?? (await argon2.hash('dummy-to-equalize-timing'));
        const valid = await argon2.verify(validHash, dto.password).catch(() => false);
        if (!user || !valid) {
            if (user)
                await this.loginHistory.record(user.id, false, 'invalid_password', ctx);
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (user.twoFactorEnabled) {
            await this.loginHistory.record(user.id, false, 'password_ok_2fa_pending', ctx);
            const twoFactorToken = await this.jwt.signAsync({ sub: user.id, purpose: 'two_factor' }, { expiresIn: '5m' });
            return { twoFactorRequired: true, twoFactorToken };
        }
        await this.loginHistory.record(user.id, true, 'success', ctx);
        return this.issueSessionTokens(user, ctx);
    }
    async verifyTwoFactorLogin(twoFactorToken, code, ctx) {
        let payload;
        try {
            payload = await this.jwt.verifyAsync(twoFactorToken);
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid or expired two-factor challenge');
        }
        if (payload.purpose !== 'two_factor') {
            throw new common_1.UnauthorizedException('Invalid challenge token');
        }
        const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
        if (!user)
            throw new common_1.UnauthorizedException('Invalid challenge token');
        const verified = await this.twoFactor.verifyCodeOrBackup(user.id, code);
        if (!verified) {
            await this.loginHistory.record(user.id, false, '2fa_failed', ctx);
            throw new common_1.UnauthorizedException('Invalid authenticator or backup code');
        }
        await this.loginHistory.record(user.id, true, 'success_2fa', ctx);
        return this.issueSessionTokens(user, ctx);
    }
    async refresh(rawRefreshToken) {
        const { session, rawToken } = await this.sessions.rotate(rawRefreshToken);
        const user = await this.prisma.user.findUnique({ where: { id: session.userId } });
        if (!user)
            throw new common_1.UnauthorizedException('Invalid refresh token');
        const accessToken = await this.signAccessToken(user, session.id);
        return { accessToken, refreshToken: rawToken };
    }
    async logout(rawRefreshToken) {
        await this.sessions.revokeByRawToken(rawRefreshToken);
    }
    async logoutAll(userId, currentSessionId) {
        await this.sessions.revokeAll(userId, currentSessionId);
    }
    async changePassword(userId, dto, currentSessionId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.UnauthorizedException();
        const valid = await argon2.verify(user.passwordHash, dto.currentPassword).catch(() => false);
        if (!valid)
            throw new common_1.UnauthorizedException('Current password is incorrect');
        const passwordHash = await argon2.hash(dto.newPassword, password_util_1.ARGON2ID_OPTIONS);
        await this.prisma.user.update({
            where: { id: userId },
            data: { passwordHash, passwordChangedAt: new Date() },
        });
        await this.sessions.revokeAll(userId, currentSessionId);
    }
    async issueSessionTokens(user, ctx) {
        const { session, rawToken: refreshToken } = await this.sessions.create(user.id, ctx);
        const accessToken = await this.signAccessToken(user, session.id);
        return { accessToken, refreshToken };
    }
    async signAccessToken(user, sessionId) {
        return this.jwt.signAsync({ sub: user.id, email: user.email, role: user.role, sessionId }, { expiresIn: '15m' });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService,
        sessions_service_1.SessionsService,
        login_history_service_1.LoginHistoryService,
        email_verification_service_1.EmailVerificationService,
        two_factor_service_1.TwoFactorService])
], AuthService);
//# sourceMappingURL=auth.service.js.map