import { Server, Socket } from 'socket.io';

import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { SocketStateService } from './sockets-state.service';
import {
  IWsResponseDataToRoom,
  IWsResponseDataToUser,
  SocketCoreService,
} from './sockets-core.service';
// import { HttpToWsInterceptor } from './http-to-ws-exception.interceptor';
import { UseFilters } from '@nestjs/common';
import { WebsocketExceptionsFilter } from './ws-exceptions.filter';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
@UseFilters(WebsocketExceptionsFilter)
export class SocketsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
    readonly socketService: SocketStateService,
    readonly socketCoreService: SocketCoreService,
  ) {}

  public sendMessage<T>(data: IWsResponseDataToUser<T>) {
    return this.socketCoreService.sendMessage(data);
  }

  public sendRoomMessage<T>(server: Server, data: IWsResponseDataToRoom<T>) {
    return this.socketCoreService.sendToRoom(server, data);
  }

  public joinRoom(client: Socket, mapHash: string) {
    return this.socketCoreService.joinRoom(client, mapHash);
  }

  async handleConnection(client: Socket) {
    return await this.socketCoreService.handleConnection(client);
  }

  public handleDisconnect(client: Socket) {
    return this.socketCoreService.handleDisconnect(client);
  }
}
