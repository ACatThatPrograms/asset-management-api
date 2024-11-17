import { KeyLike } from 'jose';
import { generateTestKeys } from './utils/keyGen';

let privateKey: KeyLike;
let publicKey: KeyLike;

beforeAll(async () => {
    const keys = await generateTestKeys();
    privateKey = keys.privateKey;
    publicKey = keys.publicKey;
});

export { privateKey, publicKey };
