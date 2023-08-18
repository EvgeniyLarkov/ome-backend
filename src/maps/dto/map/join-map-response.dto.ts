import { MapAction } from 'src/maps/entities/map-event.entity';
import { MapParticipantEntity } from 'src/maps/entities/map-participants.entity';
import { MapEntity } from 'src/maps/entities/map.entity';
import { ParticipantMapPermissions } from 'src/maps/types/map-permissions.types';

export type JoinMapResponseDTO = {
  mapHash: string;
  actions: MapAction[];
  participants: MapParticipantEntity[];
};

export type connectToMapDTO = {
  map: MapEntity;
  participant: MapParticipantEntity;
  permissions: ParticipantMapPermissions;
};
