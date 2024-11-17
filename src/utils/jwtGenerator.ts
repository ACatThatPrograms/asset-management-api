import { SignJWT, KeyLike } from 'jose';

interface JwtClaims {
    sessionId: string;
    subject: string;
    appId: string;
    expirationTime: string;
}

export const createTestJwt = async (privateKey: KeyLike, { sessionId, subject, appId, expirationTime }: JwtClaims): Promise<string> => {
    const issuer = 'privy.io';

    const token = await new SignJWT({ sid: sessionId })
        .setProtectedHeader({ alg: 'ES256', typ: 'JWT' })
        .setIssuer(issuer)
        .setIssuedAt()
        .setAudience(appId)
        .setSubject(subject)
        .setExpirationTime(expirationTime)
        .sign(privateKey);

    return token;
};
