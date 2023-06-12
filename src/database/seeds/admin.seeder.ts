import { Seeder } from '@concepta/typeorm-seeding';
import { UserFactory } from '../factories/user.factory';
import { config } from 'dotenv';
import { RoleEnum } from 'src/roles/roles.enum';
import { RoleFactory } from '../factories/role.factory';
import { StatusFactory } from '../factories/status.factory';
import { StatusEnum } from 'src/statuses/statuses.enum';

config();

export class AdminSeeder extends Seeder {
  async run() {
    await this.factory(UserFactory).create({
      firstName: 'Neurocrush',
      lastName: 'Admin',
      email: process.env.ADMIN_LOGIN,
      password: process.env.ADMIN_PASSWORD,
      role: await this.factory(RoleFactory).create({
        id: RoleEnum.admin,
        name: 'admin',
      }),
      status: await this.factory(StatusFactory).create({
        id: StatusEnum.active,
        name: 'active',
      }),
    });
    await this.call();
  }
}
