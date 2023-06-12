import { config } from 'dotenv';
import { SeedingSource } from '@concepta/typeorm-seeding';
import { default as dataSource } from './orm.config';
import { AppSeeder } from './database.seeder';

config();

const source = new SeedingSource({
  dataSource,
  seeders: [AppSeeder],
  defaultSeeders: [AppSeeder],
});

console.log(source);

export default source;
