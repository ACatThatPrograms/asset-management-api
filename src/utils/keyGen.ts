import { generateKeyPair, KeyLike } from 'jose';

export const generateTestKeys = async (): Promise<{
    publicKey: KeyLike;
    privateKey: KeyLike;
}> => {
    const { publicKey, privateKey } = await generateKeyPair('ES256');
    return { publicKey, privateKey };
};
