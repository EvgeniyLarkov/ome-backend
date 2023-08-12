import { CACHE_MANAGER, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectModel } from '@nestjs/mongoose';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { FindOptionsWhere } from 'typeorm/find-options/FindOptionsWhere';
import { AppLogger } from 'src/logger/app-logger.service';
import { MapEntity } from './entities/map.entity';
import { IPaginationOptions } from 'src/utils/types/pagination-options';
import { CreateMapDto } from './dto/map/create-map.dto';
import { MapEvent } from './entities/map-event.entity';
import { Model } from 'mongoose';
import { MapEventDto } from './dto/actions/map-event.dto';
import { MapEventDB } from './dto/actions/map-event.db';
import { WsException } from '@nestjs/websockets';
import { DropMapEventDto } from './dto/actions/drop-map-event.dto';
import { ChangeMapEventDto } from './dto/actions/change-map-event.dto';
import { isLatLngAsObject } from 'src/utils/isLatLngAsObject';
import { MapsPermissionsService } from './maps-permissions.service';
import { createResponseErrorBody } from 'src/utils/createResponseErrorBody';
import { Cache } from 'cache-manager';
import { MapsParticipantsService } from './maps-participants.service';
import { CreateMapParticipantDto } from './dto/participant/create-map-participant.dto';
import { MapParticipantEntity } from './entities/map-participants.entity';
import { UsersService } from 'src/users/users.service';
import { MAP_PARTICIPANT_TYPE } from './types/map-participant.types';

@Injectable()
export class MapsService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectModel(MapEvent.name)
    private readonly mapEventModel: Model<MapEvent>,
    @InjectRepository(MapEntity)
    private readonly mapsRepository: Repository<MapEntity>,
    private readonly usersService: UsersService,
    private readonly permissionsService: MapsPermissionsService,
    private readonly participantsService: MapsParticipantsService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext('MapsService');
  }

  findOne(fields: FindOptionsWhere<MapEntity>) {
    return this.mapsRepository.findOne({
      where: fields,
      relations: ['creator'],
    });
  }

  findManyWithPagination(
    fields: FindOptionsWhere<MapEntity>,
    paginationOptions: IPaginationOptions,
  ) {
    return this.mapsRepository.find({
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
      where: fields,
      relations: ['creator'],
    });
  }

  async getUserCreatedMaps(
    userId: number,
    paginationOptions: IPaginationOptions,
  ) {
    const maps = await this.findManyWithPagination(
      { creator: { id: userId } },
      paginationOptions,
    );

    return maps;
  }

  async createMap(user: User, data: CreateMapDto) {
    const createMapData: Partial<MapEntity> = {
      name: data.name,
      creator: user,
    };

    if (typeof data.description !== 'undefined') {
      createMapData.description = data.description;
    }

    if (typeof data.public !== 'undefined') {
      createMapData.public = data.public;
    }

    const map = await this.mapsRepository.save(
      this.mapsRepository.create(createMapData),
    );

    await this.permissionsService.createMapPermissions(map);

    return map;
  }

  async getMapLogined(user: User, hash: string) {
    return await this.findOne({
      creator: { id: user.id },
      hash,
    });
  }

  async createMapEvent(userHash: User['hash'], mapData: MapEventDto) {
    try {
      const { mapHash, type, coordinates, data } = mapData;

      const mapEventData: MapEventDB = {
        creatorHash: userHash,
        mapHash,
        type,
        lat: null,
        lng: null,
        status: 0,
      };

      // TO-DO Add checks and errors
      if (coordinates) {
        mapEventData.lat = coordinates.lat;
        mapEventData.lng = coordinates.lng;
      }

      if (data) {
        mapEventData.data = data;
      }

      const mapEvent = new this.mapEventModel(mapEventData);

      return await mapEvent.save();
    } catch (err) {
      new WsException({
        status: HttpStatus.BAD_REQUEST,
      });
    }
  }

  async dropMapEvent(userHash: User['hash'], mapData: DropMapEventDto) {
    try {
      // TO-DO Need to add permissions by user
      const { mapHash, hash } = mapData;

      const mapEventData: Partial<MapEventDB> = {
        status: -1,
        deletedAt: new Date(),
      };

      const result = await this.mapEventModel.findOneAndUpdate(
        {
          hash: hash,
          mapHash,
        },
        mapEventData,
        { new: true, lean: true },
      );

      return result;
    } catch (err) {
      new WsException({
        status: HttpStatus.BAD_REQUEST,
      });
    }
  }

  async changeMapEvent(userHash: User['hash'], mapData: ChangeMapEventDto) {
    try {
      // Types of payload and necessary fields already checked

      const mapEventData: Partial<MapEventDB> = {};

      if (mapData.coordinates && isLatLngAsObject(mapData.coordinates)) {
        mapEventData.lat = mapData.coordinates.lat;
        mapEventData.lng = mapData.coordinates.lng;
      }

      // TO-DO add data fields

      const result = await this.mapEventModel.findOneAndUpdate(
        {
          hash: mapData.hash,
          mapHash: mapData.mapHash,
        },
        mapEventData,
        { new: true, lean: true },
      );

      return result;
    } catch (err) {
      new WsException({
        status: HttpStatus.BAD_REQUEST,
      });
    }
  }

  async getMapEvents(mapHash: string) {
    const mapEvents = await this.mapEventModel
      .find(
        {
          mapHash,
        },
        null,
        { lean: true },
      )
      .where({
        status: {
          $gte: 0,
        },
      })
      .exec();

    return mapEvents;
  }

  async getSelfMapEvents(user: User, hash: string) {
    const mapEvents = await this.mapEventModel
      .find(
        {
          mapHash: hash,
          creatorHash: user.hash,
        },
        null,
        { lean: true },
      )
      .exec();

    return mapEvents;
  }

  async getMapParticipant(
    userHash: string | null,
    data: CreateMapParticipantDto,
  ) {
    // participantId - for unlogined users;
    const { participantId, mapHash } = data;

    let mapParticipantCached: MapParticipantEntity | null = null;

    if (userHash) {
      mapParticipantCached = await this.cacheManager.get(
        `map-participant.${mapHash}.${userHash}`,
      );
    } else if (participantId) {
      mapParticipantCached = await this.cacheManager.get(
        `map-participant.${mapHash}.${participantId}`,
      );
    }

    let mapParticipant: MapParticipantEntity | null = null;

    if (!mapParticipantCached) {
      const findOptions = {
        mapHash: mapHash,
        ...(participantId ? { hash: participantId } : { userHash }),
      };

      mapParticipant = await this.participantsService.findOne(findOptions);
    } else {
      mapParticipant = mapParticipantCached;
    }

    const map = await this.findOne({ hash: mapHash });

    if (!map) {
      throw new WsException(
        createResponseErrorBody(HttpStatus.NOT_FOUND, 'Map does not exist'),
      );
    }

    if (!mapParticipant) {
      const participantData: Partial<MapParticipantEntity> = {
        mapHash: map.hash,
      };

      if (userHash) {
        const user = await this.usersService.findOne({
          hash: userHash,
        });

        participantData.name = `${user.firstName} + ${user.lastName}`;
        participantData.userHash = user.hash;

        if (map.creator.hash === userHash) {
          participantData.type = MAP_PARTICIPANT_TYPE.creator;
        }
      }

      const participant = await this.participantsService.createMapParticipant(
        map,
        participantData,
      );

      await this.cacheManager.set(
        `map-participant.${mapHash}.${userHash ? userHash : participant.hash}`,
        participant,
        60 * 60 * 1000,
      );

      return participant;
    } else {
      if (mapParticipant.userHash && !userHash) {
        throw new WsException(
          createResponseErrorBody(HttpStatus.FORBIDDEN, 'Access denied'),
        );
      }

      return mapParticipant;
    }
  }
}
