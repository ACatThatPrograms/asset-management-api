import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
    helloWorld(): string {
        return 'Welcome to the Asset Explorer API';
    }
}
