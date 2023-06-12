import { Module, Global } from '@nestjs/common';
import { default as dataSource } from './orm.config';

import { DataSource } from 'typeorm';

@Global()
@Module({
  imports: [],
  providers: [
    {
      provide: DataSource,
      useFactory: async () => {
        await dataSource.initialize();
        return dataSource;
      },
    },
  ],
  exports: [DataSource],
})
export class DatabaseModule {}
