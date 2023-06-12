import { Seeder } from '@concepta/typeorm-seeding';
import { AdminSeeder } from './seeds/admin.seeder';
import { RoleSeeder } from './seeds/role.seeder';
import { StatusSeeder } from './seeds/status.seeder';
import { UserSeeder } from './seeds/user.seeder';

export class AppSeeder extends Seeder {
  async run() {
    const roleSeeder = new RoleSeeder();
    const statusSeeder = new StatusSeeder();
    const userSeeder = new UserSeeder();
    const adminSeeder = new AdminSeeder();

    await this.call([roleSeeder, statusSeeder, userSeeder, adminSeeder]);
  }
}
