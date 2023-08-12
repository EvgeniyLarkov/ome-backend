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
import { MapEventDto } from './dto/actions/map-event.dto';
import { MapEvent } from './entities/map-event.entity';
import { DropMapEventDto } from './dto/actions/drop-map-event.dto';
import { ChangeMapEventDto } from './dto/actions/change-map-event.dto';

@ApiTags('Maps-ws')
@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'maps',
})
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
    @MessageBody() data: { mapHash: string },
    @ConnectedSocket() client: Socket,
  ): Promise<WsResponse<MapEvent[]>> {
    const userHash = this.socketService.getUserBySocketId(client.id);

    this.socketCoreService.joinRoom(client, data.mapHash);

    const response = {
      userHash: userHash,
      room: data.mapHash,
    };

    //TO-DO sanitize sending data
    this.sendRoomMessage(this.server, {
      message: response,
      event: MAP_EVENTS.join_map,
      room: data.mapHash,
    });

    const mapData = await this.mapsService.getMapEvents(data.mapHash);

    return { event: MAP_EVENTS.get_actions, data: mapData };
  }

  @SubscribeMessage(MAP_EVENTS.new_action)
  @UsePipes(new ValidationPipe({ transform: true }))
  async handleNewMapEvent(
    @MessageBody() data: MapEventDto,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const userHash = this.socketService.getUserBySocketId(client.id);

    const response = await this.mapsService.createMapEvent(userHash, data);

    //TO-DO sanitize sending data
    this.sendRoomMessage(this.server, {
      message: response,
      event: MAP_EVENTS.new_action,
      room: data.mapHash,
    });
  }

  @SubscribeMessage(MAP_EVENTS.drop_action)
  @UsePipes(new ValidationPipe({ transform: true }))
  async handleDropMapEvent(
    @MessageBody() data: DropMapEventDto,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const userHash = this.socketService.getUserBySocketId(client.id);

    const response = await this.mapsService.dropMapEvent(userHash, data);

    //TO-DO sanitize sending data
    this.sendRoomMessage(this.server, {
      message: response,
      event: MAP_EVENTS.drop_action,
      room: data.mapHash,
    });
  }

  @SubscribeMessage(MAP_EVENTS.change_action)
  @UsePipes(new ValidationPipe({ transform: true }))
  async handleChangeMapEvent(
    @MessageBody() data: ChangeMapEventDto,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const userHash = this.socketService.getUserBySocketId(client.id);

    const response = await this.mapsService.changeMapEvent(userHash, data);

    //TO-DO sanitize sending data
    this.sendRoomMessage(this.server, {
      message: response,
      event: MAP_EVENTS.change_action,
      room: data.mapHash,
    });
  }
}
