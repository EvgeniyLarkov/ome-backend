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
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { FileEntity } from '../../files/entities/file.entity';
import { IsNotEmpty } from 'class-validator';
import { User } from 'src/users/entities/user.entity';

@Entity({ name: 'map' })
export class MapEntity extends EntityHelper {
  @Exclude({ toPlainOnly: true })
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index()
  hash: string;

  @Column({ nullable: false, type: 'text' })
  name: string;

  @Column({ nullable: true, type: 'text' })
  description: string | null;

  @ManyToOne(() => FileEntity, {
    eager: true,
  })
  photo?: FileEntity | null;

  @Column({ nullable: false, type: 'boolean', default: false })
  public: boolean;

  @Column({ nullable: false, type: 'boolean', default: false })
  hidden: boolean;

  @Column({ nullable: false, type: 'smallint', default: 0 })
  status: 0;

  @ManyToOne(() => User) // TO-DO
  @JoinColumn()
  @IsNotEmpty()
  @Index()
  creator: User;

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
