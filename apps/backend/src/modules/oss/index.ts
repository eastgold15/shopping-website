import { Elysia } from 'elysia';
import { ossService } from './service';

export const ossController = new Elysia({ prefix: '/oss' })
  .decorate('ossService', ossService);

export { ossService };