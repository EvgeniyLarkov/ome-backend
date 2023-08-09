import {
  CACHE_MANAGER,
  ClassSerializerInterceptor,
  Inject,
  UseInterceptors,
} from '@nestjs/common';
import { Cache } from 'cache-manager';
import { ApiTags } from '@nestjs/swagger';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SocketCoreService } from 'src/sockets/sockets-core.service';
import { SocketStateService } from 'src/sockets/sockets-state.service';
import { SocketsGateway } from 'src/sockets/sockets.gateway';
import { MapsService } from './maps.service';
import { mapsEventNames } from './types/map.types';
import { MapEventDto } from './dto/map-event.dto';

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

  @SubscribeMessage(mapsEventNames.join_map)
  joinMap(
    @MessageBody() data: { mapHash: string },
    @ConnectedSocket() client: Socket,
  ): void {
    const userHash = this.socketService.getUserBySocketId(client.id);

    this.socketCoreService.joinRoom(client, data.mapHash);

    const response = {
      userHash: userHash,
      room: data.mapHash,
    };

    //TO-DO sanitize sending data
    this.sendRoomMessage(this.server, {
      message: response,
      event: mapsEventNames.join_map,
      room: data.mapHash,
    });
  }

  @SubscribeMessage(mapsEventNames.new_event)
  async handleNewMessage(
    @MessageBody() data: MapEventDto,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const userHash = this.socketService.getUserBySocketId(client.id);

    const response = await this.mapsService.createMapEvent(userHash, data);

    //TO-DO sanitize sending data
    this.sendRoomMessage(this.server, {
      message: response,
      event: mapsEventNames.new_event,
      room: data.mapHash,
    });
  }
}
