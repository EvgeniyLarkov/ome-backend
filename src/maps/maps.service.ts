import { Injectable } from '@nestjs/common';
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
import { CreateMapEventDto } from './dto/create-map-event.dto';

@Injectable()
export class MapsService {
  constructor(
    @InjectRepository(MapEntity)
    @InjectModel(MapEvent.name)
    private mapEventModel: Model<MapEvent>,
    private mapsRepository: Repository<MapEntity>,
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

  async createMapEvent(user: User, mapData: CreateMapEventDto) {
    const mapEventData = {
      ...mapData,
      creatorHash: user.hash,
    };

    const mapEvent = new this.mapEventModel(mapEventData);

    return mapEvent.save();
  }

  async getMapEvents(user: User, hash: string) {
    const mapEvents = this.mapEventModel
      .find({
        mapHash: hash,
        creatorHash: user.hash,
      })
      .exec();

    return mapEvents;
  }
}