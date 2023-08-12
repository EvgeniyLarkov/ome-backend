import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MapEntity } from './entities/map.entity';
import { MapsController } from './maps.controller';
import { MapsService } from './maps.service';
import { MapEvent, MapEventSchema } from './entities/map-event.entity';
import { MapsGateway } from './maps.gateway';
import { SocketModule } from 'src/sockets/sockets.module';
import { MapPermissionEntity } from './entities/map-permissions.entity';
import {
  MapParticipantEntity,
  MapParticipantSchema,
} from './entities/map-participants.entity';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MapEntity, MapPermissionEntity]),
    MongooseModule.forFeature([
      { name: MapEvent.name, schema: MapEventSchema },
      { name: MapParticipantEntity.name, schema: MapParticipantSchema },
    ]),
    SocketModule,
    UsersModule,
  ],
  controllers: [MapsController],
  providers: [MapsService, MapsGateway],
  exports: [MapsService],
})
export class MapsModule {}
