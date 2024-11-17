import { Inject, Injectable } from '@nestjs/common';
import { Kysely } from 'kysely';

@Injectable()
export class DbService {
    constructor(@Inject('Kysely') private readonly db: Kysely<any>) {}
}
