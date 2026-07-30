import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SavedLocationsService } from './saved-locations.service';
import { CreateSavedLocationDto, UpdateSavedLocationDto } from './dto/saved-location.dto';

@ApiTags('profiles')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('profiles/me/saved-locations')
export class SavedLocationsController {
  constructor(private savedLocations: SavedLocationsService) {}

  @Get()
  list(@CurrentUser() user: { userId: string }) {
    return this.savedLocations.list(user.userId);
  }

  @Post()
  create(@CurrentUser() user: { userId: string }, @Body() dto: CreateSavedLocationDto) {
    return this.savedLocations.create(user.userId, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() dto: UpdateSavedLocationDto,
  ) {
    return this.savedLocations.update(user.userId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.savedLocations.remove(user.userId, id);
  }
}
