import { Exclude } from 'class-transformer';
import { EntityHelper } from 'src/utils/entity-helper';
import getShortId from 'src/utils/short-id-generator';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { MapEntity } from './map.entity';
import {
  MAP_EDIT_PERMISSIONS,
  mapsEditPermissions,
} from '../types/map-permissions.types';

@Entity({ name: 'map-permission' })
export class MapPermissionEntity extends EntityHelper {
  @Exclude({ toPlainOnly: true })
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index()
  hash: string;

  @OneToOne(() => MapEntity, (entity: MapEntity) => entity.hash)
  @JoinColumn({ name: 'map_hash' })
  map: MapEntity;

  @Column({ name: 'map_hash', type: 'string' })
  mapHash: string;

  @Column({ nullable: false, type: 'boolean', default: false })
  anonymous_view: boolean;

  @Column({
    nullable: false,
    type: 'smallint',
    default: MAP_EDIT_PERMISSIONS.logined,
  })
  edit_rules: mapsEditPermissions;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @Exclude()
  @BeforeInsert()
  uuidUpdater() {
    this.hash = getShortId();
  }
}
