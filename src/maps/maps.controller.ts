import {
  Controller,
  Get,
  Post,
  Delete,
  UseGuards,
  Request,
  Body,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  Param,
  Patch,
  UseInterceptors,
  ClassSerializerInterceptor,
  SerializeOptions,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { IRequestUser } from 'src/auth/types/user';
import { MapsService } from './maps.service';
import { CreateMapDto } from './dto/map/create-map.dto';
import { MapActionDto } from './dto/actions/map-event.dto';
import { connectToMapDTO } from './dto/map/join-map-response.dto';
import { ChangeMapParticipantDto } from './dto/participant/change-map-participant.dto';
import { InterceptorForClassSerializer } from 'src/shared/interceptors/class-serializer';
import { ChangeMapDto } from './dto/map/change-map.dto';
import { ChangeMapPermissionsDto } from './dto/permissions/change-map-permissions.dto';
import { RequestHeader } from 'src/shared/decorators/RequestHeader';
import { AnonymousRequestHeader } from './types/anon-header';
import { MapsControllerToGatewayService } from './maps-controller-to-gateway.service';
import { MapEntity } from './entities/map.entity';
import { MapPermissionEntity } from './entities/map-permissions.entity';
import { MapAction } from './entities/map-event.entity';
import { MapParticipantEntity } from './entities/map-participants.entity';

@ApiTags('Maps')
@Controller({
  path: 'maps',
  version: '1',
})
@SerializeOptions({
  excludePrefixes: ['_id', '__v'],
})
@UseInterceptors(ClassSerializerInterceptor, InterceptorForClassSerializer)
export class MapsController {
  constructor(
    private readonly mapsService: MapsService,
    private readonly wsGateway: MapsControllerToGatewayService,
  ) {}

  @ApiBearerAuth()
  @Post()
  @UseGuards(AuthGuard('jwt'))
  async createMap(
    @Body() data: CreateMapDto,
    @Request() request: IRequestUser,
  ): Promise<MapEntity> {
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
  ): Promise<MapEntity[]> {
    if (limit > 50) {
      limit = 50;
    }
    return await this.mapsService.getUserCreatedMaps(request.user.id, {
      page,
      limit,
    });
  }

  // @ApiBearerAuth()
  // @UseGuards(AuthGuard('jwt')) //TO-DO add privilige check
  @Get(':hash')
  async getMap(@Request() request: IRequestUser, @Param('hash') hash: string) {
    return await this.mapsService.findOne({ hash });
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Delete(':hash/logined')
  async deleteMapLogined(
    @Request() request: IRequestUser,
    @Param('hash') mapHash: string,
  ): Promise<boolean> {
    const userHash = request.user.hash;

    return await this.mapsService.dropMap(userHash, mapHash);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Patch(':hash/logined')
  async changeMapLogined(
    @Request() request: IRequestUser,
    @Param('hash') mapHash: string,
    @Body() data: ChangeMapDto,
  ): Promise<MapEntity> {
    const userHash = request.user.hash;

    const result = await this.mapsService.changeMap(
      { userHash },
      mapHash,
      data,
    );

    this.wsGateway.sendChangeMapToRoom(mapHash, result);

    return result;
  }

  @Patch(':hash')
  async changeMapUnlogined(
    @RequestHeader(AnonymousRequestHeader) headers: AnonymousRequestHeader,
    @Param('hash') mapHash: string,
    @Body() data: ChangeMapDto,
  ): Promise<MapEntity> {
    const userHash = headers['anonymous-id'];

    const result = await this.mapsService.changeMap(
      { participantHash: userHash },
      mapHash,
      data,
    );

    this.wsGateway.sendChangeMapToRoom(mapHash, result);

    return result;
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Post('/connect/logined/:hash')
  async connectToMapLogined(
    @Request() request: IRequestUser,
    @Param('hash') hash: string,
  ): Promise<connectToMapDTO> {
    const userHash = request.user.hash; // TO-DO add participant hash check

    const [participant, permissions, map] =
      await this.mapsService.getMapParticipantWithPermissisons(
        { userHash },
        {
          mapHash: hash,
        },
      );

    return { participant, permissions, map };
  }

  @Post('/connect/unlogined/:hash')
  async connectToMapUnlogined(
    @Param('hash') hash: string,
    @RequestHeader(AnonymousRequestHeader) headers: AnonymousRequestHeader,
  ): Promise<connectToMapDTO> {
    const userHash = headers['anonymous-id']; //TO-DO add undefined check

    const [participant, permissions, map] =
      await this.mapsService.getMapParticipantWithPermissisons(
        { participantHash: userHash },
        {
          mapHash: hash,
        },
      );

    return { participant, permissions, map };
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Patch('/participant/:hash/logined')
  async changeMapParticipantLogined(
    @Request() request: IRequestUser,
    @Param('hash') participantHash: string,
    @Body() data: ChangeMapParticipantDto,
  ): Promise<MapParticipantEntity> {
    const userHash = request.user.hash;

    const result = await this.mapsService.changeMapParticipant(
      participantHash,
      { userHash },
      data,
    );

    this.wsGateway.sendChangeParticipantToRoom(data.mapHash, result);

    return result;
  }

  @Patch('/participant/:hash')
  async changeMapParticipantUnlogined(
    @RequestHeader(AnonymousRequestHeader) headers: AnonymousRequestHeader,
    @Param('hash') participantHash: string,
    @Body() data: ChangeMapParticipantDto,
  ): Promise<MapParticipantEntity> {
    const userHash = headers['anonymous-id'];

    const result = await this.mapsService.changeMapParticipant(
      participantHash,
      { participantHash: userHash },
      data,
    );

    this.wsGateway.sendChangeParticipantToRoom(data.mapHash, result);

    return result;
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get('/permissions/:hash/logined')
  async getMapPermissionsLogined(
    @Request() request: IRequestUser,
    @Param('hash') mapHash: string,
  ): Promise<MapPermissionEntity> {
    const userHash = request.user.hash;

    const result = await this.mapsService.getMapPermissions(
      { userHash },
      mapHash,
    );

    return result;
  }

  @Get('/permissions/:hash')
  async getMapPermissionsUnlogined(
    @RequestHeader(AnonymousRequestHeader) headers: AnonymousRequestHeader,
    @Param('hash') mapHash: string,
  ): Promise<MapPermissionEntity> {
    const userHash = headers['anonymous-id'];

    const result = await this.mapsService.getMapPermissions(
      { participantHash: userHash },
      mapHash,
    );

    return result;
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Patch('/permissions/:hash/logined')
  async changeMapPermissionsLogined(
    @Request() request: IRequestUser,
    @Param('hash') mapHash: string,
    @Body() data: ChangeMapPermissionsDto,
  ): Promise<MapPermissionEntity> {
    const userHash = request.user.hash;

    const result = await this.mapsService.changeMapPermissions(
      { userHash },
      mapHash,
      data,
    );

    this.wsGateway.sendChangeMapPermissionsToRoom(mapHash, result);

    return result;
  }

  @Patch('/permissions/:hash')
  async changeMapPermissionsUnlogined(
    @RequestHeader(AnonymousRequestHeader) headers: AnonymousRequestHeader,
    @Param('hash') mapHash: string,
    @Body() data: ChangeMapPermissionsDto,
  ): Promise<MapPermissionEntity> {
    const userHash = headers['anonymous-id'];

    const result = await this.mapsService.changeMapPermissions(
      { participantHash: userHash },
      mapHash,
      data,
    );

    this.wsGateway.sendChangeMapPermissionsToRoom(mapHash, result);

    return result;
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Post(':hash/event')
  async createMapAction(
    @Request() request: IRequestUser,
    @Body() data: MapActionDto,
    @Param('hash') hash: string,
  ): Promise<MapAction> {
    return await this.mapsService.createMapAction(request.user.hash, {
      ...data,
      mapHash: hash,
    });
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get(':hash/events')
  async getMapAction(
    @Request() request: IRequestUser,
    @Param('hash') hash: string,
  ): Promise<MapAction[]> {
    return await this.mapsService.getSelfMapActions(request.user, hash);
  }
}
