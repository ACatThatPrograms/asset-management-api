import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Kysely } from 'kysely';
import * as jwt from 'jsonwebtoken';
import { generateKeyPair, KeyLike } from 'jose';

jest.mock('jwks-rsa');

describe('AuthService', () => {
    let authService: AuthService;
    let jwtService: JwtService;
    let configService: ConfigService;
    let dbMock: jest.Mocked<Kysely<any>>;
    //   let privateKey: KeyLike;
    let publicKey: KeyLike;

    beforeAll(async () => {
        const keys = await generateKeyPair('ES256');
        // privateKey = keys.privateKey;
        publicKey = keys.publicKey;
    });

    beforeEach(async () => {
        dbMock = {
            selectFrom: jest.fn(),
            insertInto: jest.fn(),
        } as any;

        const module: TestingModule = await Test.createTestingModule({
            providers: [AuthService, JwtService, ConfigService, { provide: 'Kysely', useValue: dbMock }],
        }).compile();

        authService = module.get<AuthService>(AuthService);
        jwtService = module.get<JwtService>(JwtService);
        configService = module.get<ConfigService>(ConfigService);

        jest.spyOn(configService, 'get').mockReturnValue('mockAppId');

        jest.spyOn(authService, 'getKey').mockImplementation(async (header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) => {
            const signingKey = publicKey;
            callback(null, signingKey);
        });
    });

    it('should be defined', () => {
        expect(authService).toBeDefined();
    });

    describe('validateUser', () => {
        it('should create a new user if user does not exist', async () => {
            const mockPrivyToken = 'validToken';
            const privyDid = 'mockPrivyDid';
            const mockPayload = { sub: privyDid }; // Payload with valid Privy DID

            // Mock getKey to return a valid signing key
            jest.spyOn(authService, 'getKey').mockImplementation(async (header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) => {
                const signingKey = publicKey; // Mock public key
                callback(null, signingKey);
            });

            // Mock jwt.verify to resolve a valid payload
            jest.spyOn(jwt, 'verify').mockImplementation((token, getKey, options, callback) => {
                callback(null, mockPayload);
            });

            // Mock database to simulate no existing user
            dbMock.selectFrom.mockReturnValue({
                select: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                executeTakeFirst: jest.fn().mockResolvedValue(undefined),
            } as any);

            // Mock database insert to simulate adding a new user
            dbMock.insertInto.mockReturnValue({
                values: jest.fn().mockReturnThis(),
                returning: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue([{ id: 1 }]),
            } as any);

            // Mock jwtService.sign to return a mock JWT
            jest.spyOn(jwtService, 'sign').mockReturnValue('signedJwtToken');

            // Call validateUser
            const result = await authService.validateUser(mockPrivyToken);

            // Assertions
            expect(result).toEqual('signedJwtToken');
            expect(dbMock.insertInto).toHaveBeenCalledWith('users');
            expect(dbMock.insertInto('users').values).toHaveBeenCalledWith({
                privy_did: privyDid,
                created_at: expect.any(Date),
                updated_at: expect.any(Date),
            });
            expect(jwtService.sign).toHaveBeenCalledWith({
                sub: privyDid,
                user_id: 1,
            });
        });
    });
});
