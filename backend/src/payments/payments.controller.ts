import { BadRequestException, Body, Controller, Headers, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/payment.dto';

@ApiTags('payments')
@Controller()
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('deals/:dealId/payment')
  initiate(
    @CurrentUser() user: { userId: string },
    @Param('dealId') dealId: string,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.paymentsService.initiate(dealId, user.userId, dto.provider);
  }

  // Webhook endpoints are intentionally NOT behind JwtAuthGuard — the provider
  // calling us has no user session. Trust is established entirely by signature
  // verification inside the service, not by anything at the controller layer.
  @Post('webhooks/stripe')
  stripeWebhook(@Req() req: Request, @Headers('stripe-signature') signature: string) {
    if (!req.rawBody) throw new BadRequestException('Missing raw body');
    return this.paymentsService.handleStripeWebhook(req.rawBody, signature);
  }

  @Post('webhooks/btcpay')
  btcpayWebhook(@Req() req: Request, @Headers('btcpay-sig') signature: string) {
    if (!req.rawBody) throw new BadRequestException('Missing raw body');
    return this.paymentsService.handleBtcpayWebhook(req.rawBody, signature);
  }
}
