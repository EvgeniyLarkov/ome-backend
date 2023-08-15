import {
  CACHE_MANAGER,
  ClassSerializerInterceptor,
  Inject,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Cache } from 'cache-manager';
import { ApiTags } from '@nestjs/swagger';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsResponse,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SocketCoreService } from 'src/sockets/sockets-core.service';
import { SocketStateService } from 'src/sockets/sockets-state.service';
import { SocketsGateway } from 'src/sockets/sockets.gateway';
import { MapsService } from './maps.service';
import { MAP_EVENTS } from './types/map.types';
import { MapActionDto } from './dto/actions/map-event.dto';
import { DropMapActionDto } from './dto/actions/drop-map-event.dto';
import { ChangeMapActionDto } from './dto/actions/change-map-event.dto';
import { CreateMapParticipantDto } from './dto/participant/create-map-participant.dto';
import { JoinMapResponseDTO } from './dto/map/join-map-response.dto';
import { UseFilters } from '@discord-nestjs/core';
import { WebsocketExceptionsFilter } from 'src/sockets/ws-exceptions.filter';

@ApiTags('Maps-ws')
@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'maps',
})
@UseFilters(WebsocketExceptionsFilter)
@UseInterceptors(ClassSerializerInterceptor)
export class MapsGateway extends SocketsGateway {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    readonly mapsService: MapsService,
    readonly socketService: SocketStateService,
    readonly socketCoreService: SocketCoreService,
  ) {
    super(socketService, socketCoreService);

    this.socketCoreService;
    this.socketService;
  }

  @WebSocketServer() server: Server;

  @SubscribeMessage(MAP_EVENTS.join_map)
  async joinMap(
    @MessageBody() data: CreateMapParticipantDto,
    @ConnectedSocket() client: Socket,
  ): Promise<WsResponse<JoinMapResponseDTO>> {
    const userHash = this.socketService.getUserBySocketId(client.id);

    const [participant, permissions] =
      await this.mapsService.getMapParticipantWithPermissisons(userHash, data);

    if (!permissions.view) {
      return {
        // TO-do
        event: MAP_EVENTS.get_actions,
        data: {
          actions: [],
        },
      };
    }

    this.socketCoreService.joinRoom(client, data.mapHash);

    const response = {
      participant,
      room: data.mapHash,
    };

    //TO-DO sanitize sending data
    this.sendRoomMessage(this.server, {
      message: response,
      event: MAP_EVENTS.join_map,
      room: data.mapHash,
    });

    const actions = await this.mapsService.getMapActions(data.mapHash);

    return {
      event: MAP_EVENTS.get_actions,
      data: { actions },
    };
  }

  @SubscribeMessage(MAP_EVENTS.new_action)
  @UsePipes(new ValidationPipe({ transform: true }))
  async handleNewMapAction(
    @MessageBody() data: MapActionDto,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const userHash = this.socketService.getUserBySocketId(client.id);

    const response = await this.mapsService.createMapAction(userHash, data);

    //TO-DO sanitize sending data
    this.sendRoomMessage(this.server, {
      message: response,
      event: MAP_EVENTS.new_action,
      room: data.mapHash,
    });
  }

  @SubscribeMessage(MAP_EVENTS.drop_action)
  @UsePipes(new ValidationPipe({ transform: true }))
  async handleDropMapAction(
    @MessageBody() data: DropMapActionDto,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const userHash = this.socketService.getUserBySocketId(client.id);

    const response = await this.mapsService.dropMapAction(userHash, data);

    //TO-DO sanitize sending data
    this.sendRoomMessage(this.server, {
      message: response,
      event: MAP_EVENTS.drop_action,
      room: data.mapHash,
    });
  }

  @SubscribeMessage(MAP_EVENTS.change_action)
  @UsePipes(new ValidationPipe({ transform: true }))
  async handleChangeMapAction(
    @MessageBody() data: ChangeMapActionDto,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const userHash = this.socketService.getUserBySocketId(client.id);

    const response = await this.mapsService.changeMapAction(userHash, data);

    //TO-DO sanitize sending data
    this.sendRoomMessage(this.server, {
      message: response,
      event: MAP_EVENTS.change_action,
      room: data.mapHash,
    });
  }
}
