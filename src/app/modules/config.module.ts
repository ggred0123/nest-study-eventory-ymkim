import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
export const configModule = ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: `.${process.env.NODE_ENV}.env`,
  validationSchema: Joi.object({
    NODE_ENV: Joi.string().valid('dev'),
    JWT_ACCESS_TOKEN_SECRET: Joi.string().required(),
    JWT_ACCESS_TOKEN_EXPIRE_TIME: Joi.string().required(),
    JWT_REFRESH_TOKEN_SECRET: Joi.string().required(),
    JWT_REFRESH_TOKEN_EXPIRE_TIME: Joi.string().required(),
  }),
});
