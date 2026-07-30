"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_jwt_1 = require("passport-jwt");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
const sessions_service_1 = require("./sessions.service");
let JwtStrategy = class JwtStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy) {
    constructor(config, prisma, sessions) {
        super({
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: config.get('JWT_SECRET') ?? config.get('jwt.secret'),
        });
        this.prisma = prisma;
        this.sessions = sessions;
    }
    async validate(payload) {
        if (payload.purpose === 'two_factor') {
            throw new common_1.UnauthorizedException('Invalid token');
        }
        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
            select: { passwordChangedAt: true },
        });
        if (user?.passwordChangedAt && payload.iat * 1000 < user.passwordChangedAt.getTime()) {
            throw new common_1.UnauthorizedException('Token invalidated by password change');
        }
        if (payload.sessionId) {
            const active = await this.sessions.isActive(payload.sessionId);
            if (!active)
                throw new common_1.UnauthorizedException('Session has been revoked');
        }
        return { userId: payload.sub, email: payload.email, role: payload.role, sessionId: payload.sessionId };
    }
};
exports.JwtStrategy = JwtStrategy;
exports.JwtStrategy = JwtStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService,
        sessions_service_1.SessionsService])
], JwtStrategy);
//# sourceMappingURL=jwt.strategy.js.map