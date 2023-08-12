import {
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
  Body,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  Param,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { IRequestUser } from 'src/auth/types/user';
import { MapsService } from './maps.service';
import { CreateMapDto } from './dto/map/create-map.dto';
import { MapEventDto } from './dto/actions/map-event.dto';

@ApiTags('Maps')
@Controller({
  path: 'maps',
  version: '1',
})
export class MapsController {
  constructor(private readonly mapsService: MapsService) {}

  @ApiBearerAuth()
  @Post()
  @UseGuards(AuthGuard('jwt'))
  async createMap(
    @Body() data: CreateMapDto,
    @Request() request: IRequestUser,
  ) {
    const result = await this.mapsService.createMap(request.user, data);

    return result;
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get()
  async getSelfMaps(
    @Request() request: IRequestUser,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    if (limit > 50) {
      limit = 50;
    }
    return await this.mapsService.getUserCreatedMaps(request.user.id, {
      page,
      limit,
    });
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get(':hash')
  async getMapLogined(
    @Request() request: IRequestUser,
    @Param('hash') hash: string,
  ) {
    return await this.mapsService.getMapLogined(request.user, hash);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Post(':hash/event')
  async createMapEvent(
    @Request() request: IRequestUser,
    @Body() data: MapEventDto,
    @Param('hash') hash: string,
  ) {
    return await this.mapsService.createMapEvent(request.user.hash, {
      ...data,
      mapHash: hash,
    });
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get(':hash/events')
  async getMapEvent(
    @Request() request: IRequestUser,
    @Param('hash') hash: string,
  ) {
    return await this.mapsService.getSelfMapEvents(request.user, hash);
  }
}
