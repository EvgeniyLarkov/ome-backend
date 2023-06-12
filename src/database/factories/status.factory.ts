import { Factory } from '@concepta/typeorm-seeding';
import { Status } from 'src/statuses/entities/status.entity';
import { StatusEnum } from 'src/statuses/statuses.enum';

export class StatusFactory extends Factory<Status> {
  protected options = {
    entity: Status,
  };

  protected entity(status: Status): Promise<Status> {
    status.id = StatusEnum.active;
    status.name = 'Active';
    return new Promise((res) => res(status));
  }
}
