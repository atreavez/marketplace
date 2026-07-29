import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { DealsService } from './deals.service';
import { CreateInquiryDto, TransitionDealDto } from './dto/deal.dto';

@ApiTags('deals')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('deals')
export class DealsController {
  constructor(private dealsService: DealsService) {}

  @Get()
  findMine(@CurrentUser() user: { userId: string }) {
    return this.dealsService.findForUser(user.userId);
  }

  @Post()
  createInquiry(@CurrentUser() user: { userId: string }, @Body() dto: CreateInquiryDto) {
    return this.dealsService.createInquiry(user.userId, dto);
  }

  @Patch(':id/stage')
  transition(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() dto: TransitionDealDto,
  ) {
    return this.dealsService.transition(id, user.userId, dto.toStage);
  }
}
