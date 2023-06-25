import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MapEntity } from './entities/map.entity';
import { MapsController } from './maps.controller';
import { MapsService } from './maps.service';
import { MapEvent, MapEventSchema } from './entities/map-event.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([MapEntity]),
    MongooseModule.forFeature([
      { name: MapEvent.name, schema: MapEventSchema },
    ]),
  ],
  controllers: [MapsController],
  providers: [MapsService],
  exports: [MapsService],
})
export class MapsModule {}
