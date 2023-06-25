import { registerAs } from '@nestjs/config';

export default registerAs('mongo', () => ({
  port: process.env.MONGO_PORT,
  user: process.env.MONGO_USER,
  host: process.env.MONGO_HOST,
  password: process.env.MONGO_PASSWORD,
}));
