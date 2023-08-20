import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MapEntity } from './entities/map.entity';
import { MapsController } from './maps.controller';
import { MapsService } from './maps.service';
import { MapAction, MapActionSchema } from './entities/map-event.entity';
import { MapsGateway } from './maps.gateway';
import { SocketModule } from 'src/sockets/sockets.module';
import { MapPermissionEntity } from './entities/map-permissions.entity';
import {
  MapParticipantEntity,
  MapParticipantSchema,
} from './entities/map-participants.entity';
import { UsersModule } from 'src/users/users.module';
import { MapsPermissionsService } from './maps-permissions.service';
import { MapsParticipantsService } from './maps-participants.service';
import { MapsControllerToGatewayService } from './maps-controller-to-gateway.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([MapEntity, MapPermissionEntity]),
    MongooseModule.forFeature([
      { name: MapAction.name, schema: MapActionSchema },
      { name: MapParticipantEntity.name, schema: MapParticipantSchema },
    ]),
    SocketModule,
    UsersModule,
  ],
  controllers: [MapsController],
  providers: [
    MapsService,
    MapsPermissionsService,
    MapsParticipantsService,
    MapsControllerToGatewayService,
    MapsGateway,
  ],
  exports: [MapsService],
})
export class MapsModule {}
