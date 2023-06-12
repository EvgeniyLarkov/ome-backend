import { config } from 'dotenv';
import { ormConfigFactory } from 'src/config/database.config';
import { DataSource } from 'typeorm';

config();

const options = {
  ...ormConfigFactory(),
  keepConnectionAlive: true,
  autoLoadEntities: true,
  migrations: [`${__dirname}/database/migrations/**/*{.ts,.js}`],
};

export default new DataSource(options);
