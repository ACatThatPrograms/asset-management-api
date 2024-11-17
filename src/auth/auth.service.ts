import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Kysely } from 'kysely';
import * as jwt from 'jsonwebtoken';
import * as jwksClient from 'jwks-rsa';

@Injectable()
export class AuthService {
    private readonly client: jwksClient.JwksClient;

    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        @Inject('Kysely') private readonly db: Kysely<any>,
    ) {
        this.client = jwksClient({
            jwksUri: `https://auth.privy.io/api/v1/apps/${this.configService.get<string>('PRIVY_APP_ID')}/jwks.json`,
        });
    }

    async getKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) {
        this.client.getSigningKey(header.kid, (err, key) => {
            if (err) return callback(err);
            const signingKey = key.getPublicKey();
            callback(null, signingKey);
        });
    }

    async validateUser(privyToken: string): Promise<string> {
        try {
            const payload = await new Promise<any>((resolve, reject) => {
                jwt.verify(privyToken, this.getKey.bind(this), { algorithms: ['ES256'] }, (err, decoded) => {
                    if (err) return reject(new UnauthorizedException('Invalid Privy token'));
                    resolve(decoded);
                });
            });

            const privyDid = payload.sub;
            if (!privyDid) throw new UnauthorizedException('Invalid Privy token');

            // user exists?
            const existingUser = await this.db
                .selectFrom('users')
                .select(['privy_did', 'id'])
                .where('privy_did', '=', privyDid)
                .executeTakeFirst();

            // !exists
            if (!existingUser) {
                const [newUser] = await this.db
                    .insertInto('users')
                    .values({
                        privy_did: privyDid,
                        created_at: new Date(),
                        updated_at: new Date(),
                    })
                    .returning(['id'])
                    .execute();

                return this.jwtService.sign({ sub: privyDid, user_id: newUser.id });
            }

            // Sign JWT with privy_did (sub) and user_id ofr use in requests later
            return this.jwtService.sign({ sub: privyDid, user_id: existingUser.id });
        } catch (error) {
            throw new UnauthorizedException('Invalid Privy token');
        }
    }
}
