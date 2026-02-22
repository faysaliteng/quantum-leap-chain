import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from './decorators';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) throw new ForbiddenException();

    // Super-admin bypass
    if (user.role === 'admin') {
      const assignment = await this.prisma.adminUserRole.findUnique({
        where: { admin_user_id: user.sub },
        include: { role: true },
      });

      if (assignment) {
        const hasAll = required.every((p) => assignment.role.permissions.includes(p));
        if (!hasAll) throw new ForbiddenException('Missing permission');
      }
    }

    return true;
  }
}
