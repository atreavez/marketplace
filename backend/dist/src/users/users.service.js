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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const email_verification_service_1 = require("../auth/email-verification.service");
const login_history_service_1 = require("../auth/login-history.service");
let UsersService = class UsersService {
    constructor(prisma, emailVerification, loginHistory) {
        this.prisma = prisma;
        this.emailVerification = emailVerification;
        this.loginHistory = loginHistory;
    }
    async findPublicProfile(id) {
        const user = await this.prisma.user.findUnique({
            where: { id, deletedAt: null },
            select: { id: true, displayName: true, role: true, createdAt: true },
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        return user;
    }
    async findMe(id) {
        const user = await this.prisma.user.findUnique({
            where: { id, deletedAt: null },
            select: {
                id: true,
                email: true,
                displayName: true,
                role: true,
                avatarUrl: true,
                emailVerifiedAt: true,
                twoFactorEnabled: true,
                createdAt: true,
            },
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        return user;
    }
    async updateProfile(id, dto) {
        const data = {};
        if (dto.displayName !== undefined)
            data.displayName = dto.displayName;
        if (dto.email !== undefined) {
            const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
            if (existing && existing.id !== id) {
                throw new common_1.ConflictException('That email is already in use');
            }
            data.email = dto.email;
            data.emailVerifiedAt = null;
        }
        const user = await this.prisma.user.update({ where: { id }, data });
        if (dto.email !== undefined) {
            await this.emailVerification.requestVerification(user.id, user.email);
        }
        return this.findMe(id);
    }
    async updateAvatar(id, avatarUrl) {
        await this.prisma.user.update({ where: { id }, data: { avatarUrl } });
        return this.findMe(id);
    }
    async getLoginHistory(id) {
        return this.loginHistory.list(id);
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        email_verification_service_1.EmailVerificationService,
        login_history_service_1.LoginHistoryService])
], UsersService);
//# sourceMappingURL=users.service.js.map