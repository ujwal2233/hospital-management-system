import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthUser } from '../../../common/interfaces/auth-user.interface';
import { UsersService } from '../../users/users.service';

export interface AccessTokenPayload {
  sub: string;
  tenantId: string | null;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.accessSecret') as string,
      passReqToCallback: true,
    });
  }

  /** Loads a fresh user + permissions on every request so deactivation/role edits apply immediately. */
  async validate(req: Request, payload: AccessTokenPayload): Promise<AuthUser> {
    const tenantOverride = req.headers['x-tenant-id'];
    return this.usersService.buildAuthUser(
      payload.sub,
      typeof tenantOverride === 'string' ? tenantOverride : undefined,
    );
  }
}
