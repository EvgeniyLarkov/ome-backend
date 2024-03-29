import {
  CACHE_MANAGER,
  HttpStatus,
  Inject,
  Injectable,
  HttpException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectModel } from '@nestjs/mongoose';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { FindOptionsWhere } from 'typeorm/find-options/FindOptionsWhere';
import { AppLogger } from 'src/logger/app-logger.service';
import { MapEntity } from './entities/map.entity';
import { CreateMapDto } from './dto/map/create-map.dto';
import { MapAction } from './entities/map-event.entity';
import { Model } from 'mongoose';
import { MapActionDto } from './dto/actions/map-event.dto';
import { MapActionDB } from './dto/actions/map-event.db';
import { WsException } from '@nestjs/websockets';
import { DropMapActionDto } from './dto/actions/drop-map-event.dto';
import { ChangeMapActionDto } from './dto/actions/change-map-event.dto';
import { isLatLngAsObject } from 'src/utils/isLatLngAsObject';
import { MapsPermissionsService } from './maps-permissions.service';
import { createResponseErrorBody } from 'src/utils/createResponseErrorBody';
import { Cache } from 'cache-manager';
import { MapsParticipantsService } from './maps-participants.service';
import { CreateMapParticipantDto } from './dto/participant/create-map-participant.dto';
import { MapParticipantEntity } from './entities/map-participants.entity';
import { UsersService } from 'src/users/users.service';
import {
  MAP_PARTICIPANT_STATUS,
  MAP_PARTICIPANT_TYPE,
} from './types/map-participant.types';
import { MapParticipantPermissions } from './types/map-permissions.types';
import { ChangeMapParticipantDto } from './dto/participant/change-map-participant.dto';
import { ChangeMapDto } from './dto/map/change-map.dto';
import { ChangeMapPermissionsDto } from './dto/permissions/change-map-permissions.dto';
import { MapPermissionEntity } from './entities/map-permissions.entity';
import { hoursToMilliseconds } from 'src/utils/hoursToMilliseconds';
import { MAP_STATUSES } from './types/map.types';
import { IPaginationOptions } from 'src/utils/types/pagination-options';
import { OMEActionsData } from './types/map-action.types';

@Injectable()
export class MapsService {
  USER_HASH_TO_MAP_PARTICIPANT_TTL = hoursToMilliseconds(24);

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectModel(MapAction.name)
    private readonly mapEventModel: Model<MapAction>,
    @InjectRepository(MapEntity)
    private readonly mapsRepository: Repository<MapEntity>,
    private readonly usersService: UsersService,
    private readonly permissionsService: MapsPermissionsService,
    private readonly participantsService: MapsParticipantsService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext('MapsService');
  }

  private getCachedParticipantHashFromUserHash(
    userHash: string,
    mapHash: string,
  ): Promise<string | null> {
    return this.cacheManager.get(
      `user-hash-to-map-participant-hash.${mapHash}.${userHash}`,
    );
  }

  private setCachedParticipantHashFromUserHash(
    userHash: string,
    mapHash: string,
    participantHash: string,
  ): Promise<void> {
    return this.cacheManager.set(
      `user-hash-to-map-participant-hash.${mapHash}.${userHash}`,
      participantHash,
      this.USER_HASH_TO_MAP_PARTICIPANT_TTL,
    );
  }

  async getMapParticipantFromUser(userHash: string, mapHash: string) {
    const cachedHash = await this.getCachedParticipantHashFromUserHash(
      userHash,
      mapHash,
    );

    if (cachedHash) {
      this.logger.log(`Get participant hash from cache to user ${userHash}`);
      return cachedHash;
    }

    const map = await this.findOneWithCache({ hash: mapHash });

    if (!map) {
      throw new HttpException(
        createResponseErrorBody(HttpStatus.NOT_FOUND, 'Map not found'),
        HttpStatus.NOT_FOUND,
      );
    }

    let dbParticipant = await this.participantsService.findOne({
      userHash,
      mapHash,
    });

    if (!dbParticipant) {
      this.logger.log(
        `Participant for user: ${userHash} not found in db for map: ${mapHash}`,
      );
      const participantData: Partial<MapParticipantEntity> = {
        mapHash,
      };

      const user = await this.usersService.findOne({
        hash: userHash,
      });

      if (!user) {
        throw new HttpException(
          createResponseErrorBody(HttpStatus.NOT_FOUND, 'Invalid userhash'),
          HttpStatus.NOT_FOUND,
        );
      }

      participantData.name = `${user.firstName} ${user.lastName}`;
      participantData.userHash = user.hash;

      if (map.creator.hash === userHash) {
        participantData.type = MAP_PARTICIPANT_TYPE.creator;
      }

      dbParticipant = await this.participantsService.createMapParticipant(
        map,
        participantData,
      );
    }

    await Promise.all([
      this.setCachedParticipantHashFromUserHash(
        userHash,
        mapHash,
        dbParticipant.participantHash,
      ),
      this.participantsService.setCachedParticipant(
        dbParticipant.participantHash,
        mapHash,
        dbParticipant,
      ),
    ]);

    this.logger.log(`Set participant hash to cache user ${userHash}`);

    return dbParticipant.participantHash;
  }

  findOne(fields: FindOptionsWhere<MapEntity>) {
    return this.mapsRepository.findOne({
      where: fields,
      relations: ['creator'],
    });
  }

  findOneWithCache(fields: FindOptionsWhere<MapEntity>) {
    return this.mapsRepository.findOne({
      where: fields,
      relations: ['creator'],
    });
  }

  async dropMap(userHash: string, mapHash: string) {
    const [, permissions, map] = await this.getMapParticipantWithPermissisons(
      { userHash },
      { mapHash },
    );

    if (!permissions.change_map_properties) {
      throw new HttpException(
        createResponseErrorBody(HttpStatus.FORBIDDEN, 'Access denied'),
        HttpStatus.FORBIDDEN,
      );
    }

    void this.mapsRepository.update(
      { hash: map.hash },
      { status: MAP_STATUSES.deleted },
    );

    return true;
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
    return await this.mapsRepository.find({
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
      where: { creator: { id: userId }, status: MoreThanOrEqual(0) },
      order: {
        createdAt: 'desc',
      },
      relations: ['creator'],
    });
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

  async changeMap(
    editorData: {
      userHash?: string | undefined;
      participantHash?: string | undefined;
    },
    mapHash: string,
    data: ChangeMapDto,
  ): Promise<MapEntity> {
    const [, permissions, map] = await this.getMapParticipantWithPermissisons(
      editorData,
      {
        mapHash: mapHash,
      },
    );

    if (!permissions.change_map_description) {
      throw new HttpException(
        createResponseErrorBody(HttpStatus.FORBIDDEN, 'Access denied'),
        HttpStatus.FORBIDDEN,
      );
    }

    void (await this.mapsRepository.update({ hash: map.hash }, data));

    return await this.findOne({ hash: map.hash });
  }

  async getMapLogined(user: User, hash: string) {
    return await this.findOne({
      creator: { id: user.id },
      hash,
    });
  }

  async createMapAction(
    participantData: {
      userHash?: string;
      participantHash?: string;
    },
    mapData: MapActionDto,
  ) {
    const [participant, permissions] =
      await this.getMapParticipantWithPermissisons(participantData, {
        mapHash: mapData.mapHash,
      });

    if (
      !permissions.add_actions ||
      participant.status === MAP_PARTICIPANT_STATUS.banned
    ) {
      throw new HttpException(
        createResponseErrorBody(
          HttpStatus.FORBIDDEN,
          'You do not have permission to create map actions',
        ),
        HttpStatus.FORBIDDEN,
      );
    }

    try {
      const { mapHash, type, coordinates, data } = mapData;

      const mapEventData: MapActionDB<OMEActionsData> = {
        creatorHash: participant.participantHash,
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

  async dropMapAction(userHash: User['hash'], mapData: DropMapActionDto) {
    try {
      // TO-DO Need to add permissions by user
      const { mapHash, hash } = mapData;

      const mapEventData: Partial<MapActionDB<OMEActionsData>> = {
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

  async changeMapAction(
    participantData: {
      userHash?: string;
      participantHash?: string;
    },
    mapData: ChangeMapActionDto,
  ) {
    const [participant, permissions] =
      await this.getMapParticipantWithPermissisons(participantData, {
        mapHash: mapData.mapHash,
      });

    if (
      !permissions.edit_actions ||
      participant.status === MAP_PARTICIPANT_STATUS.banned
    ) {
      throw new HttpException(
        createResponseErrorBody(
          HttpStatus.FORBIDDEN,
          'You do not have permission to create map actions',
        ),
        HttpStatus.FORBIDDEN,
      );
    }

    try {
      // Types of payload and necessary fields already checked
      const { mapHash, hash, coordinates, data } = mapData;
      const mapEventData: Partial<MapActionDB<OMEActionsData>> = {};

      if (mapData.coordinates && isLatLngAsObject(mapData.coordinates)) {
        mapEventData.lat = coordinates.lat;
        mapEventData.lng = coordinates.lng;
      }

      if (data) {
        mapEventData.data = data;
      }

      const result = await this.mapEventModel.findOneAndUpdate(
        {
          hash: hash,
          mapHash: mapHash,
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

  async getMapActions(mapHash: string) {
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

  async getSelfMapActions(user: User, hash: string) {
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

  async changeMapParticipant(
    participantHash: string,
    editorData: {
      userHash?: string | undefined;
      participantHash?: string | undefined;
    },
    data: ChangeMapParticipantDto,
  ) {
    const participant = await this.participantsService.findOne({
      participantHash,
    });

    if (!participant) {
      throw new HttpException(
        createResponseErrorBody(
          HttpStatus.NOT_FOUND,
          'Participant does not exist',
        ),
        HttpStatus.NOT_FOUND,
      );
    }

    const [editorParticipant, permissions, map] =
      await this.getMapParticipantWithPermissisons(editorData, {
        mapHash: data.mapHash,
      });

    let canChangeProperties = true;

    if (data.name) {
      if (
        !permissions.modify_participants &&
        editorParticipant.participantHash !== participant.participantHash
      ) {
        canChangeProperties = false;
      }
    }

    if (data.status) {
      if (!permissions.ban_participants) {
        canChangeProperties = false;
      } else if (
        participant.participantHash === editorParticipant.participantHash
      ) {
        canChangeProperties = false;
      }
    }

    if (data.type) {
      if (!permissions.set_permissions) {
        canChangeProperties = false;
      } else if (data.type >= editorParticipant.type) {
        canChangeProperties = false;
      } else if (
        participant.participantHash === editorParticipant.participantHash
      ) {
        canChangeProperties = false;
      }
    }

    if (data.special_permissions) {
      if (!permissions.set_permissions) {
        canChangeProperties = false;
      } else if (
        participant.participantHash === editorParticipant.participantHash
      ) {
        canChangeProperties = false;
      }
    }

    if (!canChangeProperties) {
      throw new HttpException(
        createResponseErrorBody(HttpStatus.FORBIDDEN, 'Access denied'),
        HttpStatus.FORBIDDEN,
      );
    }

    const result = await this.participantsService.changeMapParticpant(
      map,
      participant.participantHash,
      data,
    );

    return result;
  }

  async getMapPermissions(
    participantData: {
      userHash?: string;
      participantHash?: string;
    },
    mapHash: string,
  ) {
    const [, permissions, map] = await this.getMapParticipantWithPermissisons(
      participantData,
      {
        mapHash,
      },
    );

    if (!permissions.change_map_properties) {
      throw new HttpException(
        createResponseErrorBody(HttpStatus.FORBIDDEN, 'Access denied'),
        HttpStatus.FORBIDDEN,
      );
    }

    return await this.permissionsService.findOne({ map: { hash: map.hash } });
  }

  async changeMapPermissions(
    editorData: {
      userHash?: string | undefined;
      participantHash?: string | undefined;
    },
    mapHash: string,
    data: ChangeMapPermissionsDto,
  ): Promise<MapPermissionEntity> {
    const [, permissions, map] = await this.getMapParticipantWithPermissisons(
      editorData,
      {
        mapHash: mapHash,
      },
    );

    if (!permissions.change_map_properties) {
      throw new HttpException(
        createResponseErrorBody(HttpStatus.FORBIDDEN, 'Access denied'),
        HttpStatus.FORBIDDEN,
      );
    }

    return await this.permissionsService.changePermissions(map, data);
  }

  async getMapParticipantWithPermissisons(
    participantData: {
      userHash?: string;
      participantHash?: string;
    },
    data: CreateMapParticipantDto,
  ) {
    const [participant, map] = await this.getMapParticipant(
      participantData,
      data,
    );
    const permissions = await this.getParticipantPermissions(
      data.mapHash,
      participant,
    );
    return [participant, permissions, map] as const;
  }

  async getMapParticipant(
    participantData: {
      userHash?: string | undefined;
      participantHash?: string | undefined;
    },
    data: CreateMapParticipantDto,
  ) {
    // participantId - for unlogined users;
    const { mapHash } = data;

    const { userHash, participantHash } = participantData;

    if (!userHash && !participantHash) {
      throw new HttpException(
        createResponseErrorBody(HttpStatus.BAD_REQUEST, 'Provide data'),
        HttpStatus.BAD_REQUEST,
      );
    }

    let mapParticipantCached: MapParticipantEntity | undefined;

    if (participantHash) {
      mapParticipantCached = await this.cacheManager.get(
        `map-participant.${mapHash}.${participantHash}`,
      );
    }

    let mapParticipant: MapParticipantEntity | null = null;

    if (!mapParticipantCached) {
      const findOptions: FindOptionsWhere<MapParticipantEntity> = {
        mapHash: mapHash,
      };

      if (participantHash) {
        findOptions.participantHash = participantHash;
      }

      if (userHash) {
        findOptions.userHash = userHash;
      }

      mapParticipant = await this.participantsService.findOne(findOptions);

      if (mapParticipant) {
        void this.cacheManager.set(
          `map-participant.${mapHash}.${mapParticipant.participantHash}`,
          mapParticipant,
          60 * 60 * 1000,
        );
      }
    } else {
      mapParticipant = mapParticipantCached;
    }

    const map = await this.findOne({ hash: mapHash });

    if (!map) {
      throw new HttpException(
        createResponseErrorBody(HttpStatus.NOT_FOUND, 'Map does not exist'),
        HttpStatus.NOT_FOUND,
      );
    }

    if (!mapParticipant) {
      const participantData: Partial<MapParticipantEntity> = {
        mapHash: map.hash,
      };

      const user = userHash
        ? await this.usersService.findOne({
            hash: userHash,
          })
        : null;

      if (user) {
        participantData.name = `${user.firstName} ${user.lastName}`;
        participantData.userHash = user.hash;

        if (map.creator.hash === userHash) {
          participantData.type = MAP_PARTICIPANT_TYPE.creator;
        }
      } else {
        participantData.participantHash = participantHash;
        participantData.name = this.participantsService.getRandomName();
        participantData.avatar = this.participantsService.getRandomAvatar(
          participantData.name,
        );
      }

      const participant = await this.participantsService.createMapParticipant(
        map,
        participantData,
      );

      void this.cacheManager.set(
        `map-participant.${mapHash}.${participantHash}`,
        participant,
        60 * 60 * 1000,
      ); // async set to cache

      return [participant, map] as const;
    } else {
      if (
        userHash &&
        mapParticipant.userHash &&
        userHash !== mapParticipant.userHash
      ) {
        throw new HttpException(
          createResponseErrorBody(HttpStatus.FORBIDDEN, 'Access denied'),
          HttpStatus.FORBIDDEN,
        );
      }

      return [mapParticipant, map] as const;
    }
  }

  getMapParticipants(participantHashes: string | string[], mapHash: string) {
    return this.participantsService.findWithCache(participantHashes, mapHash);
  }

  async getParticipantPermissions(
    mapHash: string,
    participant: MapParticipantEntity,
  ) {
    let permissions = await this.permissionsService.findOne({
      map: { hash: mapHash },
    });

    if (!permissions) {
      const map = await this.findOne({ hash: mapHash });

      if (!map) {
        throw new WsException(
          createResponseErrorBody(HttpStatus.NOT_FOUND, 'Map not found'),
        );
      }

      permissions = await this.permissionsService.createMapPermissions(map);
    }

    let participantPermissions: MapParticipantPermissions = {
      view: false,
      edit_actions: false,
      drop_actions: false,
      add_actions: false,
      ban_participants: false,
      invite_participants: false,
      modify_participants: false,
      set_permissions: false,
      change_map_description: false,
      change_map_properties: false,
    };

    // Banned participant
    if (participant.status === -1) {
      return participantPermissions;
    }

    // Participants who can view map TO-DO add lists of allowed users
    if (permissions.anonymous_view) {
      participantPermissions.view = true;
    } else if (participant.userHash) {
      participantPermissions.view = true;
    }

    if (participant.type >= MAP_PARTICIPANT_TYPE.editor) {
      participantPermissions.add_actions = true;
      participantPermissions.drop_actions = true;
      participantPermissions.edit_actions = true;
    }

    if (participant.type >= MAP_PARTICIPANT_TYPE.moderator) {
      participantPermissions.ban_participants = true;
      participantPermissions.modify_participants = true;
      participantPermissions.invite_participants = true;
    }

    if (participant.type >= MAP_PARTICIPANT_TYPE.admin) {
      participantPermissions.change_map_description = true;
      participantPermissions.change_map_properties = true;
    }

    if (participant.type >= MAP_PARTICIPANT_TYPE.creator) {
      participantPermissions.set_permissions = true;
    }

    const specialPermissions =
      this.extractParticipantSpecialPermissions(participant);

    participantPermissions = {
      ...participantPermissions,
      ...specialPermissions,
    };

    return participantPermissions;
  }

  extractParticipantSpecialPermissions(participant: MapParticipantEntity) {
    let specialPermissions: Omit<
      Partial<MapParticipantPermissions>,
      'view'
    > = {};

    if (participant.special_permissions) {
      specialPermissions = participant.special_permissions;
    }

    return specialPermissions;
  }
}
