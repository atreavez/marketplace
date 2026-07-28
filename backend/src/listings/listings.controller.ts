import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ListingsService } from './listings.service';
import { CreateListingDto, SearchListingsDto } from './dto/listing.dto';

@ApiTags('listings')
@Controller('listings')
export class ListingsController {
  constructor(private listingsService: ListingsService) {}

  @Get()
  search(@Query() query: SearchListingsDto) {
    return this.listingsService.search(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.listingsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post()
  create(@CurrentUser() user: { userId: string }, @Body() dto: CreateListingDto) {
    return this.listingsService.create(user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch(':id/publish')
  publish(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.listingsService.publish(id, user.userId);
  }
}
