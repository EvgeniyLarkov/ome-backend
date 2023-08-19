import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import getShortId from 'src/utils/short-id-generator';
import {
  MAP_PARTICIPANT_STATUS,
  MAP_PARTICIPANT_TYPE,
  mapParticipantStatuses,
  mapParticipantTypes,
} from '../types/map-participant.types';

export type MapParticipantDocument = HydratedDocument<MapParticipantEntity>;

@Schema()
export class MapParticipantEntity {
  @Prop({ index: true, unique: true, default: () => getShortId() })
  hash: string;

  @Prop({ required: true, index: true })
  mapHash: string;

  @Prop({ index: true, default: () => getShortId() })
  participantHash: string;

  @Prop({ index: true, default: null })
  userHash: string | null;

  @Prop({ required: false, default: () => `Map user ${new Date().toString()}` })
  name: string;

  @Prop({ default: null })
  avatar: string | null;

  @Prop({ index: true, default: MAP_PARTICIPANT_TYPE.viewer })
  type: mapParticipantTypes;

  @Prop({ index: true, default: MAP_PARTICIPANT_STATUS.default })
  status: mapParticipantStatuses;

  @Prop({ type: 'Mixed', default: null })
  special_permissions: Record<string, unknown> | null;

  @Prop({ required: false, default: () => 1 })
  version: number;

  @Prop({ required: false, default: () => new Date() })
  createdAt: Date;

  @Prop()
  deletedAt?: Date;
}

const MPSchema = SchemaFactory.createForClass(MapParticipantEntity);

MPSchema.index({ mapHash: 1, participantHash: 1 }, { unique: true });
MPSchema.index({ mapHash: 1, userHash: 1 }, { unique: true });

export const MapParticipantSchema = MPSchema;
