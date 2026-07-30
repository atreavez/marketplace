"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const passport_1 = require("@nestjs/passport");
const config_1 = require("@nestjs/config");
const auth_service_1 = require("./auth.service");
const auth_controller_1 = require("./auth.controller");
const jwt_strategy_1 = require("./jwt.strategy");
const sessions_service_1 = require("./sessions.service");
const login_history_service_1 = require("./login-history.service");
const email_verification_service_1 = require("./email-verification.service");
const password_reset_service_1 = require("./password-reset.service");
const two_factor_service_1 = require("./two-factor.service");
const mailer_service_1 = require("./mailer/mailer.service");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            passport_1.PassportModule,
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    secret: config.get('JWT_SECRET') ?? config.get('jwt.secret'),
                    signOptions: { expiresIn: '15m' },
                }),
            }),
        ],
        providers: [
            auth_service_1.AuthService,
            jwt_strategy_1.JwtStrategy,
            sessions_service_1.SessionsService,
            login_history_service_1.LoginHistoryService,
            email_verification_service_1.EmailVerificationService,
            password_reset_service_1.PasswordResetService,
            two_factor_service_1.TwoFactorService,
            mailer_service_1.MailerService,
        ],
        controllers: [auth_controller_1.AuthController],
        exports: [auth_service_1.AuthService, sessions_service_1.SessionsService, login_history_service_1.LoginHistoryService],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map