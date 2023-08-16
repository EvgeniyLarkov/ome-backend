import { Injectable } from '@nestjs/common';
import { FindOptionsWhere } from 'typeorm/find-options/FindOptionsWhere';
import { AppLogger } from 'src/logger/app-logger.service';
import { MapEntity } from './entities/map.entity';
// import { ChangeMapPermissionsDto } from './dto/permissions/change-map-permissions.dto';
import { MapParticipantEntity } from './entities/map-participants.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChangeMapParticipantDto } from './dto/participant/change-map-participant.dto';

@Injectable()
export class MapsParticipantsService {
  constructor(
    @InjectModel(MapParticipantEntity.name)
    private readonly mapParticipantModel: Model<MapParticipantEntity>,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext('MapsService');
  }

  findOne(fields: FindOptionsWhere<MapParticipantEntity>) {
    return this.mapParticipantModel.findOne(
      {
        ...fields,
      },
      null,
      { lean: true },
    );
  }

  async createMapParticipant(
    map: MapEntity,
    data?: Partial<MapParticipantEntity>,
  ) {
    const participantData: Partial<MapParticipantEntity> = {
      mapHash: map.hash,
      ...data,
    };

    const mapParticipant = new this.mapParticipantModel(participantData);
    const dbParticipant = await mapParticipant.save();

    return dbParticipant;
  }

  async changeMapParticpant(
    map: MapEntity,
    participantHash: string,
    data: ChangeMapParticipantDto,
  ) {
    return await this.mapParticipantModel.findOneAndUpdate(
      {
        mapHash: map.hash,
        participantHash,
      },
      data,
      { returnDocument: 'after' },
    );
  }
}
