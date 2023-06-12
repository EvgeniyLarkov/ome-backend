import { Factory } from '@concepta/typeorm-seeding';
import { Role } from 'src/roles/entities/role.entity';
import { RoleEnum } from 'src/roles/roles.enum';

export class RoleFactory extends Factory<Role> {
  protected options = {
    entity: Role,
  };

  protected entity(role: Role): Promise<Role> {
    role.id = RoleEnum.user;
    role.name = 'User';
    return new Promise((res) => res(role));
  }
}
