import { IsIn } from 'class-validator';

export class CreatePaymentDto {
  @IsIn(['STRIPE', 'BTCPAY'])
  provider: 'STRIPE' | 'BTCPAY';
}
