import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FindOptionsWhere } from 'typeorm/find-options/FindOptionsWhere';
import { AppLogger } from 'src/logger/app-logger.service';
import { MapEntity } from './entities/map.entity';
import { MapPermissionEntity } from './entities/map-permissions.entity';
import { ChangeMapPermissionsDto } from './dto/permissions/change-map-permissions.dto';

@Injectable()
export class MapsPermissionsService {
  constructor(
    @InjectRepository(MapPermissionEntity)
    private readonly mapsPermissionRepository: Repository<MapPermissionEntity>,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext('MapsService');
  }

  findOne(fields: FindOptionsWhere<MapPermissionEntity>) {
    return this.mapsPermissionRepository.findOne({
      where: fields,
      relations: ['map'],
    });
  }

  async createMapPermissions(map: MapEntity, data?: ChangeMapPermissionsDto) {
    const createMapPermissionsData: Partial<MapPermissionEntity> = {
      map,
      ...data,
    };

    const permissions = await this.mapsPermissionRepository.save(
      this.mapsPermissionRepository.create(createMapPermissionsData),
    );

    return permissions;
  }

  async changeMapPermissions(map: MapEntity, data: ChangeMapPermissionsDto) {
    const permissionEntity = await this.mapsPermissionRepository.findOne({
      where: {
        mapHash: map.hash,
      },
    });

    const dataToSave = { ...permissionEntity, ...data };

    return await this.mapsPermissionRepository.save(dataToSave);
  }
}
