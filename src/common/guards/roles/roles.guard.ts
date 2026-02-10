import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { ROLES_KEY } from '../../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {

  constructor(private reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
   const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [context.getHandler(), context.getClass()]);
   
   if (!requiredRoles) {
     return true;
   }

   const request = context.switchToHttp().getRequest();
   const user = request.user;

   if (!user) throw new UnauthorizedException();

   if(!requiredRoles.includes(user.role)) {
     throw new ForbiddenException("You do not have permission (Roles)");
   }
    return true;
  }

}
