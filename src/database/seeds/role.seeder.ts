import { Seeder } from '@concepta/typeorm-seeding';
import { RoleEnum } from 'src/roles/roles.enum';
import { RoleFactory } from '../factories/role.factory';

export class RoleSeeder extends Seeder {
  async run() {
    for (const key in RoleEnum) {
      await this.factory(RoleFactory).create({
        id: RoleEnum[key],
        name: key,
      });
    }
  }
}
