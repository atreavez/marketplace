"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const nestjs_pino_1 = require("nestjs-pino");
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const path_1 = require("path");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
const prisma_service_1 = require("./prisma/prisma.service");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        rawBody: true,
        bufferLogs: true,
    });
    app.useLogger(app.get(nestjs_pino_1.Logger));
    app.use((0, helmet_1.default)());
    app.use((0, compression_1.default)());
    app.enableCors({
        origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:3000'],
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.useStaticAssets((0, path_1.join)(process.cwd(), 'uploads'), { prefix: '/uploads' });
    app.setGlobalPrefix('api', { exclude: ['health', 'health/live'] });
    app.enableVersioning({ type: common_1.VersioningType.URI, defaultVersion: '1' });
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Universal Marketplace API')
        .setDescription('Auth, Listings, Search, Deals, Payments (Stripe + BTCPay)')
        .setVersion('0.3')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document);
    const prismaService = app.get(prisma_service_1.PrismaService);
    await prismaService.enableShutdownHooks(app);
    app.enableShutdownHooks();
    const port = process.env.PORT ?? 4000;
    await app.listen(port);
    app.get(nestjs_pino_1.Logger).log(`API running on :${port} — docs at /api/docs, health at /health`);
}
bootstrap();
//# sourceMappingURL=main.js.map