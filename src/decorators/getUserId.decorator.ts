import { createParamDecorator, ExecutionContext, BadRequestException } from '@nestjs/common';

export const GetUserId = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const userId = request.user?.user_id;
    if (!userId) {
        throw new BadRequestException('User ID not found in request');
    }
    return userId;
});
