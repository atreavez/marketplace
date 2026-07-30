import { Body, Controller, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { BuyerProfileService } from './buyer-profile.service';
import { SellerProfileService } from './seller-profile.service';
import { BusinessProfileService } from './business-profile.service';
import { VerificationService } from './verification.service';
import { PublicProfileService } from './public-profile.service';
import { UpdateBuyerProfileDto } from './dto/buyer-profile.dto';
import { UpdateSellerProfileDto } from './dto/seller-profile.dto';
import { UpdateBusinessProfileDto } from './dto/business-profile.dto';
import { CreateVerificationRequestDto } from './dto/verification.dto';

@ApiTags('profiles')
@Controller('profiles')
export class ProfilesController {
  constructor(
    private buyerProfiles: BuyerProfileService,
    private sellerProfiles: SellerProfileService,
    private businessProfiles: BusinessProfileService,
    private verification: VerificationService,
    private publicProfiles: PublicProfileService,
  ) {}

  // --- IMPORTANT: every 'me/...' route below has two path segments
  // (me/buyer, me/seller, ...) so none of them can collide with the
  // single-segment ':userId' route at the bottom — but they're still
  // grouped above it for readability and to match the pattern already
  // established in UsersController. ---

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me/buyer')
  getMyBuyerProfile(@CurrentUser() user: { userId: string }) {
    return this.buyerProfiles.getOrCreate(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch('me/buyer')
  updateMyBuyerProfile(@CurrentUser() user: { userId: string }, @Body() dto: UpdateBuyerProfileDto) {
    return this.buyerProfiles.update(user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me/seller')
  getMySellerProfile(@CurrentUser() user: { userId: string }) {
    return this.sellerProfiles.findByUserId(user.userId);
  }

  // POST, not PATCH — creating a seller profile is a meaningful action (it
  // upgrades the account's role, see SellerProfileService) distinct from
  // editing one that already exists. Calling it again just returns/updates
  // the existing profile, so it's still safe to call more than once.
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('me/seller')
  becomeSellerOrUpdate(@CurrentUser() user: { userId: string }, @Body() dto: UpdateSellerProfileDto) {
    return this.sellerProfiles.update(user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me/business')
  getMyBusinessProfile(@CurrentUser() user: { userId: string }) {
    return this.businessProfiles.findByUserId(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Put('me/business')
  upsertMyBusinessProfile(@CurrentUser() user: { userId: string }, @Body() dto: UpdateBusinessProfileDto) {
    return this.businessProfiles.upsert(user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me/verification')
  getMyVerificationRequests(@CurrentUser() user: { userId: string }) {
    return this.verification.listForUser(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('me/verification')
  requestVerification(@CurrentUser() user: { userId: string }, @Body() dto: CreateVerificationRequestDto) {
    return this.verification.request(user.userId, dto);
  }

  // --- Public aggregate profile — no auth required. ---
  @Get(':userId')
  getPublicProfile(@Param('userId') userId: string) {
    return this.publicProfiles.get(userId);
  }
}
