import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AddressesService } from './addresses.service';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';

@ApiTags('profiles')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('profiles/me/addresses')
export class AddressesController {
  constructor(private addresses: AddressesService) {}

  @Get()
  list(@CurrentUser() user: { userId: string }) {
    return this.addresses.list(user.userId);
  }

  @Post()
  create(@CurrentUser() user: { userId: string }, @Body() dto: CreateAddressDto) {
    return this.addresses.create(user.userId, dto);
  }

  @Patch(':id')
  update(@CurrentUser() user: { userId: string }, @Param('id') id: string, @Body() dto: UpdateAddressDto) {
    return this.addresses.update(user.userId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.addresses.remove(user.userId, id);
  }
}
