import { CACHE_MANAGER, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Cache } from 'cache-manager';
import { Server, Socket } from 'socket.io';
import { AppLogger } from 'src/logger/app-logger.service';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import serializeResponse from 'src/utils/ws-response-serializer';
import { SocketStateService } from './sockets-state.service';

export type IWsResponseData<T> =
  | IWsResponseDataToUser<T>
  | IWsResponseDataToRoom<T>;

export interface IWsResponseDataToUser<T> {
  message: T;
  event: string;
  userHash: User['hash'] | User['hash'][];
}

export interface IWsResponseDataToRoom<T> {
  message: T;
  event: string;
  room: string[] | string;
}

@Injectable()
export class SocketCoreService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly socketService: SocketStateService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext('SocketCoreService');
  }

  public sendMessage<T>(data: IWsResponseDataToUser<T>): void {
    try {
      const { message, userHash, event } = data;

      const users = typeof userHash === 'string' ? [userHash] : userHash;

      if (!users) {
        this.logger.warn('No users to send data');
        return null;
      }

      if (users.length === 0) {
        this.logger.warn('Cannot find users to send data');
        return;
      }

      users.forEach((user) => {
        const connections = this.socketService.get(user);

        if (!connections) {
          return null;
        }

        connections.forEach((socket) => {
          socket.emit(event, serializeResponse(message));
        });
      });
    } catch (err) {
      this.logger.error('ws send error: ', err);
    }
  }

  public sendToRoom<T>(server: Server, data: IWsResponseDataToRoom<T>): void {
    try {
      const { message, room, event } = data;

      const rooms = typeof room === 'string' ? [room] : room;

      if (!rooms) {
        this.logger.warn('No rooms to send data');
        return null;
      }

      if (rooms.length === 0) {
        this.logger.warn('Cannot find rooms to send data');
        return null;
      }

      rooms.forEach((room) => {
        server.to(room).emit(event, serializeResponse(message));
      });
    } catch (err) {
      this.logger.error('ws send error: ', err);
    }
  }

  public joinRoom(client: Socket, mapHash: string) {
    void client.join(mapHash);
    this.logger.log(`Client join room: ${mapHash}`);
  }

  async handleConnection(client: Socket) {
    try {
      const token = this.getTokenFromClient(client);

      if (!token) {
        throw new WsException({
          status: HttpStatus.UNAUTHORIZED,
        });
      }

      const payload = this.jwtService.verify(token);

      const user = await this.usersService.findOne({ id: payload.id });

      if (!user) {
        new WsException({
          status: HttpStatus.UNAUTHORIZED,
        });
      }

      this.logger.log(
        `Connected to socket service --- User: ${user.firstName} ${user.lastName} Hash: ${user.hash}`,
      );

      const connections = this.socketService.get(user.hash) || [];

      if (connections.length === 0) {
        await this.cacheManager.set(
          `online.${user.hash}`,
          true,
          60 * 60 * 1000,
        );
      }

      return this.socketService.add(user.hash, client);
    } catch (err) {
      this.logger.error(err);
      throw new WsException({
        status: HttpStatus.UNAUTHORIZED,
      });
    }
  }

  async handleDisconnect(client: Socket) {
    try {
      const token = this.getTokenFromClient(client);

      if (!token) {
        throw new WsException({
          status: HttpStatus.UNAUTHORIZED,
        });
      }

      const payload = this.jwtService.verify(token);

      this.socketService.remove(payload.hash, client);

      const connections = this.socketService.get(payload.hash) || [];

      if (connections.length === 0) {
        await this.cacheManager.set(`online.${payload.hash}`, false);
      }
    } catch (err) {
      this.logger.error(err);
      throw new WsException({
        status: HttpStatus.UNAUTHORIZED,
      });
    }
  }

  getTokenFromClient(client: Socket) {
    return (
      client.handshake?.headers?.authorization?.replace('Bearer ', '') || null
    );
  }
}
