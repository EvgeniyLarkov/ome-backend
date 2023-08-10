import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectModel } from '@nestjs/mongoose';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { FindOptionsWhere } from 'typeorm/find-options/FindOptionsWhere';
import { AppLogger } from 'src/logger/app-logger.service';
import { MapEntity } from './entities/map.entity';
import { IPaginationOptions } from 'src/utils/types/pagination-options';
import { CreateMapDto } from './dto/create-map.dto';
import { MapEvent } from './entities/map-event.entity';
import { Model } from 'mongoose';
import { MapEventDto } from './dto/map-event.dto';
import { MapEventDB } from './dto/map-event.db';
import { WsException } from '@nestjs/websockets';
import { DropMapEventDto } from './dto/drop-map-event.dto';

@Injectable()
export class MapsService {
  constructor(
    @InjectModel(MapEvent.name)
    private readonly mapEventModel: Model<MapEvent>,
    @InjectRepository(MapEntity)
    private readonly mapsRepository: Repository<MapEntity>,
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
}
