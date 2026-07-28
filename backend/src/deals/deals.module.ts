import { Module } from '@nestjs/common';
import { DealsService } from './deals.service';
import { DealsController } from './deals.controller';

@Module({
  providers: [DealsService],
  controllers: [DealsController],
  exports: [DealsService], // needed so PaymentsService can call systemTransition()
})
export class DealsModule {}
