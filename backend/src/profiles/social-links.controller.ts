import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SocialLinksService } from './social-links.service';
import { CreateSocialLinkDto, UpdateSocialLinkDto } from './dto/social-link.dto';

@ApiTags('profiles')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('profiles/me/social-links')
export class SocialLinksController {
  constructor(private socialLinks: SocialLinksService) {}

  @Get()
  list(@CurrentUser() user: { userId: string }) {
    return this.socialLinks.list(user.userId);
  }

  @Post()
  create(@CurrentUser() user: { userId: string }, @Body() dto: CreateSocialLinkDto) {
    return this.socialLinks.create(user.userId, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() dto: UpdateSocialLinkDto,
  ) {
    return this.socialLinks.update(user.userId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.socialLinks.remove(user.userId, id);
  }
}
