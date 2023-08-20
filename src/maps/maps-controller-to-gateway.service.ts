import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { AppLogger } from 'src/logger/app-logger.service';
import { SocketCoreService } from 'src/sockets/sockets-core.service';
import { MAP_EVENTS } from './types/map.types';
import { MapParticipantEntity } from './entities/map-participants.entity';
import { MapEntity } from './entities/map.entity';
import { MapPermissionEntity } from './entities/map-permissions.entity';

@Injectable()
export class MapsControllerToGatewayService {
  server: Server;

  constructor(
    private readonly socketCoreService: SocketCoreService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext('MapsControllerToGateway');
  }

  setSocketServer(server: Server) {
    this.server = server;
  }

  sendChangeParticipantToRoom(room: string, response: MapParticipantEntity) {
    this.socketCoreService.sendToRoom(this.server, {
      message: response,
      event: MAP_EVENTS.participant_change,
      room,
    });
  }

  sendChangeMapPermissionsToRoom(room: string, response: MapPermissionEntity) {
    this.socketCoreService.sendToRoom(this.server, {
      message: response,
      event: MAP_EVENTS.map_permissions_change,
      room,
    });
  }

  sendChangeMapToRoom(room: string, response: MapEntity) {
    this.socketCoreService.sendToRoom(this.server, {
      message: response,
      event: MAP_EVENTS.map_change,
      room,
    });
  }
}
