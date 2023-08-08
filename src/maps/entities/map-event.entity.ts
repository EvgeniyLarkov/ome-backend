import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MapEventDocument = HydratedDocument<MapEvent>;

@Schema()
export class MapEvent {
  @Prop({ index: true, unique: true })
  hash: string;

  @Prop({ index: true, default: 0 })
  type: number;

  @Prop({ required: true, default: 0 })
  status: number;

  @Prop([Number])
  coordinates: number[];

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

export const MapEventSchema = SchemaFactory.createForClass(MapEvent);
