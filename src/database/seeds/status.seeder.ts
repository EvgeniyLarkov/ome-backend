import { Seeder } from '@concepta/typeorm-seeding';
import { StatusEnum } from 'src/statuses/statuses.enum';
import { StatusFactory } from '../factories/status.factory';

export class StatusSeeder extends Seeder {
  async run() {
    for (const key in StatusEnum) {
      await this.factory(StatusFactory).create({
        id: StatusEnum[key],
        name: key,
      });
    }
  }
}
