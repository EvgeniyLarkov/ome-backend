import { MapParticipantEntity } from 'src/maps/entities/map-participants.entity';

export type ParticipantJoinResponseDTO = {
  mapHash: string;
  participant: MapParticipantEntity;
};
