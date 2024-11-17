import { jwtVerify, KeyLike } from 'jose';

interface JwtVerificationOptions {
    token: string;
    publicKey: KeyLike;
    appId: string;
}

export const verifyTestJwt = async ({ token, publicKey, appId }: JwtVerificationOptions): Promise<boolean> => {
    try {
        const { payload } = await jwtVerify(token, publicKey, {
            issuer: 'privy.io',
            audience: appId,
        });
        console.log('JWT verified successfully:', payload);
        return true;
    } catch (error) {
        console.error('JWT verification failed:', error);
        return false;
    }
};
