import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { avatarUploadOptions } from './avatar-upload.config';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  // --- IMPORTANT: 'me' routes must stay above the ':id' route below.
  // Express matches path segments in registration order, so if ':id' were
  // registered first, a request to /users/me would be captured as
  // GET /users/:id with id="me" instead of reaching these handlers. ---

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me')
  getMe(@CurrentUser() user: { userId: string }) {
    return this.usersService.findMe(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch('me')
  updateMe(@CurrentUser() user: { userId: string }, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me/login-history')
  getMyLoginHistory(@CurrentUser() user: { userId: string }) {
    return this.usersService.getLoginHistory(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('file', avatarUploadOptions))
  uploadAvatar(@CurrentUser() user: { userId: string }, @UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    // Served via app.useStaticAssets({ prefix: '/uploads' }) in main.ts.
    const avatarUrl = `/uploads/avatars/${file.filename}`;
    return this.usersService.updateAvatar(user.userId, avatarUrl);
  }

  // --- Existing public profile lookup — unchanged from before Module 2. ---
  @Get(':id')
  getProfile(@Param('id') id: string) {
    return this.usersService.findPublicProfile(id);
  }
}
