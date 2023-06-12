import { Seeder } from '@concepta/typeorm-seeding';
import { UserFactory } from '../factories/user.factory';
import { RoleSeeder } from './role.seeder';
import { StatusSeeder } from './status.seeder';
import { faker } from '@faker-js/faker';

export class UserSeeder extends Seeder {
  protected options: {
    seeders: [RoleSeeder, StatusSeeder];
  };

  async run() {
    await this.factory(UserFactory).createMany(1, {
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
      email: faker.internet.email(),
      password: faker.internet.password(10),
      description: faker.random.words(parseInt(faker.random.numeric(2), 10)),
    });
    await this.call();
  }
}
