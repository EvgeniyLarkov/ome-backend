import { Factory } from '@concepta/typeorm-seeding';
import { User } from 'src/users/entities/user.entity';
import { RoleFactory } from './role.factory';
import { StatusFactory } from './status.factory';

export class UserFactory extends Factory<User> {
  protected options = {
    entity: User,
  };

  protected async entity(user: User): Promise<User> {
    user.firstName = 'John';
    user.lastName = 'Doe';
    user.password = 'qwerty';
    user.email = 'example@example.com';
    user.role = await this.factory(RoleFactory).create();
    user.status = await this.factory(StatusFactory).create();

    return user;
  }
}
