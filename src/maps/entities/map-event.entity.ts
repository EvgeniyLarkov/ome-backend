import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import getShortId from 'src/utils/short-id-generator';

export type MapActionDocument = HydratedDocument<MapAction>;

@Schema()
export class MapAction {
  @Prop({ index: true, unique: true, default: () => getShortId() })
  hash: string;

  @Prop({ index: true, default: 0 })
  type: number;

  @Prop({ required: true, default: 0 })
  status: number;

  @Prop()
  lat: number | null;

  @Prop()
  lng: number | null;

  @Prop({ type: 'Mixed' })
  data: Record<string, unknown>;

  @Prop({ required: true })
  creatorHash: string;

  @Prop({ required: true, index: true })
  mapHash: string;

  @Prop({ required: true, default: () => 1 })
  version: number;

  @Prop({ required: true, default: () => new Date() })
  createdAt: Date;

  @Prop()
  deletedAt?: Date;
}

export const MapActionSchema = SchemaFactory.createForClass(MapAction);
