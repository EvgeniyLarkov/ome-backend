import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { FindOptionsWhere } from 'typeorm/find-options/FindOptionsWhere';
import { AppLogger } from 'src/logger/app-logger.service';
import { MapEntity } from './entities/map.entity';
import { MapParticipantEntity } from './entities/map-participants.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChangeMapParticipantDto } from './dto/participant/change-map-participant.dto';
import { Cache } from 'cache-manager';
import { hoursToMilliseconds } from 'src/utils/hoursToMilliseconds';

@Injectable()
export class MapsParticipantsService {
  MAP_PARTICIPANT_CACHE_TTL = hoursToMilliseconds(1);

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectModel(MapParticipantEntity.name)
    private readonly mapParticipantModel: Model<MapParticipantEntity>,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext('MapsService');
  }

  getCachedParticipant(
    participantHash: MapParticipantEntity['hash'],
    mapHash: MapEntity['hash'],
  ): Promise<MapParticipantEntity | null> {
    return this.cacheManager.get(
      `map-participant.${mapHash}.${participantHash}`,
    );
  }

  setCachedParticipant(
    participantHash: MapParticipantEntity['hash'],
    mapHash: MapEntity['hash'],
    participant: MapParticipantEntity,
  ): Promise<void> {
    return this.cacheManager.set(
      `map-participant.${mapHash}.${participantHash}`,
      participant,
      this.MAP_PARTICIPANT_CACHE_TTL,
    );
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

  async findWithCache(participantHashes: string | string[], mapHash: string) {
    const hashes = Array.isArray(participantHashes)
      ? participantHashes
      : [participantHashes];

    const cachedParticipants = hashes.map((hash) =>
      this.getCachedParticipant(hash, mapHash),
    );

    const result = await Promise.all(cachedParticipants);

    const notCachedParticipants: string[] = [];
    const notCachedParticipantsIndexes: number[] = [];
    result.forEach((item, index) => {
      if (!item) {
        notCachedParticipants.push(hashes[index]);
        notCachedParticipantsIndexes.push(index);
      }
    });

    if (notCachedParticipants.length === 0) {
      return result;
    } else {
      const dbParticipants = await this.mapParticipantModel.find(
        {
          participantHash: { $in: notCachedParticipants },
        },
        null,
        { lean: true },
      );

      if (dbParticipants.length !== notCachedParticipants.length) {
        this.logger.error(
          `findWithCache: cant fetch all map participants on map: ${mapHash}; participants hashes: ${hashes.join(
            ', ',
          )}`,
        );
      }

      this.logger.log(
        `findWithCache: Add ${dbParticipants.length} participants to cache`,
      );

      const participantsById: Record<string, MapParticipantEntity> = {};

      dbParticipants.forEach((participant) => {
        if (participant) {
          void this.setCachedParticipant(
            participant.hash,
            mapHash,
            participant,
          );

          participantsById[participant.hash] = participant;
        }
      });

      result.forEach((participant) => {
        participantsById[participant.hash] = participant;
      });

      return hashes.map((item) => participantsById[item]);
    }
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
