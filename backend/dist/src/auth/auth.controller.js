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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const swagger_1 = require("@nestjs/swagger");
const config_1 = require("@nestjs/config");
const auth_service_1 = require("./auth.service");
const sessions_service_1 = require("./sessions.service");
const two_factor_service_1 = require("./two-factor.service");
const email_verification_service_1 = require("./email-verification.service");
const password_reset_service_1 = require("./password-reset.service");
const auth_dto_1 = require("./dto/auth.dto");
const refresh_dto_1 = require("./dto/refresh.dto");
const password_dto_1 = require("./dto/password.dto");
const email_verification_dto_1 = require("./dto/email-verification.dto");
const two_factor_dto_1 = require("./dto/two-factor.dto");
const jwt_auth_guard_1 = require("./jwt-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
function deviceContext(req, deviceLabel) {
    return {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        deviceLabel,
    };
}
let AuthController = class AuthController {
    constructor(authService, sessionsService, twoFactorService, emailVerificationService, passwordResetService, config) {
        this.authService = authService;
        this.sessionsService = sessionsService;
        this.twoFactorService = twoFactorService;
        this.emailVerificationService = emailVerificationService;
        this.passwordResetService = passwordResetService;
        this.config = config;
    }
    get isProd() {
        return this.config.get('app.env') === 'production';
    }
    register(dto, req) {
        return this.authService.register(dto, deviceContext(req));
    }
    login(dto, req) {
        return this.authService.login(dto, deviceContext(req));
    }
    verifyTwoFactorLogin(dto, req) {
        return this.authService.verifyTwoFactorLogin(dto.twoFactorToken, dto.code, deviceContext(req));
    }
    refresh(dto) {
        return this.authService.refresh(dto.refreshToken);
    }
    async logout(dto) {
        await this.authService.logout(dto.refreshToken);
    }
    async logoutAll(user) {
        await this.authService.logoutAll(user.userId, user.sessionId);
    }
    async changePassword(user, dto) {
        await this.authService.changePassword(user.userId, dto, user.sessionId);
    }
    async requestPasswordReset(dto, req) {
        const token = await this.passwordResetService.requestReset(dto.email, req.ip);
        return {
            message: 'If that email is registered, a reset link has been sent.',
            ...(this.isProd || !token ? {} : { devResetToken: token }),
        };
    }
    async confirmPasswordReset(dto) {
        await this.passwordResetService.confirmReset(dto.token, dto.newPassword);
    }
    async requestEmailVerification(user) {
        const token = await this.emailVerificationService.requestVerification(user.userId, user.email);
        return {
            message: 'Verification email sent.',
            ...(this.isProd ? {} : { devVerificationToken: token }),
        };
    }
    async confirmEmailVerification(dto) {
        await this.emailVerificationService.confirm(dto.token);
    }
    setupTwoFactor(user) {
        return this.twoFactorService.setup(user.userId, user.email);
    }
    async enableTwoFactor(user, dto) {
        const backupCodes = await this.twoFactorService.enable(user.userId, dto.code);
        return { backupCodes };
    }
    async disableTwoFactor(user, dto) {
        await this.twoFactorService.disable(user.userId, dto.code);
    }
    async listSessions(user) {
        const sessions = await this.sessionsService.listActive(user.userId);
        return sessions.map((s) => ({ ...s, current: s.id === user.sessionId }));
    }
    async revokeSession(user, id) {
        await this.sessionsService.revoke(id, user.userId);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('register'),
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 60_000 } }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.RegisterDto, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('login'),
    (0, common_1.HttpCode)(200),
    (0, throttler_1.Throttle)({ default: { limit: 10, ttl: 60_000 } }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.LoginDto, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('2fa/verify'),
    (0, common_1.HttpCode)(200),
    (0, throttler_1.Throttle)({ default: { limit: 10, ttl: 60_000 } }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [two_factor_dto_1.TwoFactorLoginVerifyDto, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "verifyTwoFactorLogin", null);
__decorate([
    (0, common_1.Post)('refresh'),
    (0, common_1.HttpCode)(200),
    (0, throttler_1.Throttle)({ default: { limit: 30, ttl: 60_000 } }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [refresh_dto_1.RefreshTokenDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "refresh", null);
__decorate([
    (0, common_1.Post)('logout'),
    (0, common_1.HttpCode)(204),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [refresh_dto_1.LogoutDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Post)('logout-all'),
    (0, common_1.HttpCode)(204),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logoutAll", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Post)('change-password'),
    (0, common_1.HttpCode)(204),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, password_dto_1.ChangePasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "changePassword", null);
__decorate([
    (0, common_1.Post)('password-reset/request'),
    (0, common_1.HttpCode)(200),
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 60_000 } }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [password_dto_1.RequestPasswordResetDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "requestPasswordReset", null);
__decorate([
    (0, common_1.Post)('password-reset/confirm'),
    (0, common_1.HttpCode)(204),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [password_dto_1.ConfirmPasswordResetDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "confirmPasswordReset", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Post)('verify-email/request'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "requestEmailVerification", null);
__decorate([
    (0, common_1.Post)('verify-email/confirm'),
    (0, common_1.HttpCode)(204),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [email_verification_dto_1.ConfirmEmailVerificationDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "confirmEmailVerification", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Post)('2fa/setup'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "setupTwoFactor", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Post)('2fa/enable'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, two_factor_dto_1.TwoFactorCodeDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "enableTwoFactor", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Post)('2fa/disable'),
    (0, common_1.HttpCode)(204),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, two_factor_dto_1.TwoFactorCodeDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "disableTwoFactor", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Get)('sessions'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "listSessions", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Delete)('sessions/:id'),
    (0, common_1.HttpCode)(204),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "revokeSession", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('auth'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        sessions_service_1.SessionsService,
        two_factor_service_1.TwoFactorService,
        email_verification_service_1.EmailVerificationService,
        password_reset_service_1.PasswordResetService,
        config_1.ConfigService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map