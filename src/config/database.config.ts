import { registerAs } from '@nestjs/config';
import { ChatDialogEntity } from 'src/chat/entities/chat-dialog.entity';
import { ChatLastEntity } from 'src/chat/entities/chat-last.entity';
import { ChatMessageEntity } from 'src/chat/entities/chat-message.entity';
import { FileEntity } from 'src/files/entities/file.entity';
import { Role } from 'src/roles/entities/role.entity';
import { Status } from 'src/statuses/entities/status.entity';
import { User } from 'src/users/entities/user.entity';

import { DataSourceOptions } from 'typeorm';

export const ormConfigFactory = (): DataSourceOptions => {
  return {
    url: process.env.DATABASE_URL,
    type: process.env.DATABASE_TYPE as 'postgres', // Types issue fix
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    username: process.env.DATABASE_USERNAME,
    synchronize: process.env.DATABASE_SYNCHRONIZE === 'true',
    dropSchema: false,
    // keepConnectionAlive: true,
    logging: false, // configService.get('app.nodeEnv') !== 'production',
    // autoLoadEntities: true,
    entities: [
      User,
      FileEntity,
      ChatDialogEntity,
      ChatMessageEntity,
      ChatLastEntity,
      Role,
      Status,
    ], // for migrations
    extra: {
      max: parseInt(process.env.DATABASE_MAX_CONNECTIONS, 10) || 100,
      ssl:
        process.env.DATABASE_SSL_ENABLED === 'true'
          ? {
              rejectUnauthorized:
                process.env.DATABASE_REJECT_UNAUTHORIZED === 'true',
              ca: process.env.DATABASE_CA ? process.env.DATABASE_CA : undefined,
              key: process.env.DATABASE_KEY
                ? process.env.DATABASE_KEY
                : undefined,
              cert: process.env.DATABASE_CERT
                ? process.env.DATABASE_CERT
                : undefined,
            }
          : undefined,
    },
  };
};

export default registerAs('database', ormConfigFactory);
