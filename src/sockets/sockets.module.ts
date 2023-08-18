import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from 'src/users/users.module';
import { SocketCoreService } from './sockets-core.service';
import { SocketStateService } from './sockets-state.service';
import { SocketsGateway } from './sockets.gateway';
import { SocketRoomService } from './sockets-room.service';

@Module({
  imports: [
    UsersModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('auth.secret'),
        signOptions: {
          expiresIn: configService.get('auth.expires'),
        },
      }),
    }),
  ],
  providers: [
    SocketStateService,
    SocketCoreService,
    SocketRoomService,
    SocketsGateway,
  ],
  controllers: [],
  exports: [
    SocketsGateway,
    SocketStateService,
    SocketCoreService,
    SocketRoomService,
  ],
})
export class SocketModule {}
