import { Module } from '@nestjs/common';
import { DealsModule } from '../deals/deals.module';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { StripeProvider } from './providers/stripe.provider';
import { BtcpayProvider } from './providers/btcpay.provider';

@Module({
  imports: [DealsModule],
  providers: [PaymentsService, StripeProvider, BtcpayProvider],
  controllers: [PaymentsController],
})
export class PaymentsModule {}
