import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { createHash } from 'crypto';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { TenantsService } from '../tenants/tenants.service';
import { UserDocument } from '../users/schemas/user.schema';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly tenantsService: TenantsService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginDto): Promise<{ user: AuthUser } & AuthTokens> {
    const user = await this.resolveUser(dto);
    if (!user || !user.isActive) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return this.issueSession(user);
  }

  async refresh(refreshToken: string): Promise<{ user: AuthUser } & AuthTokens> {
    let payload: { sub: string };
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.config.get<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.usersService.findByIdWithSecrets(payload.sub);
    if (!user || !user.isActive || !user.refreshTokenHash) {
      throw new UnauthorizedException('Session expired');
    }
    if (this.hash(refreshToken) !== user.refreshTokenHash) {
      // Possible token reuse — revoke the session entirely.
      await this.usersService.setRefreshTokenHash(user._id.toString(), null);
      throw new UnauthorizedException('Session expired');
    }

    return this.issueSession(user);
  }

  async logout(userId: string): Promise<void> {
    await this.usersService.setRefreshTokenHash(userId, null);
  }

  me(user: AuthUser): AuthUser {
    return user;
  }

  // ── internals ───────────────────────────────────────────────────

  private async resolveUser(dto: LoginDto): Promise<UserDocument | null> {
    if (dto.tenantCode) {
      const tenant = await this.tenantsService.findByCode(dto.tenantCode);
      if (!tenant || !tenant.isActive) throw new UnauthorizedException('Invalid credentials');
      return this.usersService.findByEmailWithSecrets(dto.email, tenant._id.toString());
    }
    const count = await this.usersService.countByEmail(dto.email);
    if (count > 1) {
      throw new BadRequestException('This email exists in multiple hospitals — provide tenantCode');
    }
    return this.usersService.findOneByEmailAnyTenant(dto.email);
  }

  private async issueSession(user: UserDocument): Promise<{ user: AuthUser } & AuthTokens> {
    const authUser = await this.usersService.buildAuthUser(user._id.toString());
    const tokens = await this.signTokens(authUser);
    await this.usersService.setRefreshTokenHash(authUser.userId, this.hash(tokens.refreshToken));
    return { user: authUser, ...tokens };
  }

  private async signTokens(user: AuthUser): Promise<AuthTokens> {
    const accessToken = await this.jwtService.signAsync(
      { sub: user.userId, tenantId: user.tenantId, role: user.role },
      {
        secret: this.config.get<string>('jwt.accessSecret'),
        expiresIn: this.config.get<string>('jwt.accessExpires'),
      },
    );
    const refreshToken = await this.jwtService.signAsync(
      { sub: user.userId },
      {
        secret: this.config.get<string>('jwt.refreshSecret'),
        expiresIn: this.config.get<string>('jwt.refreshExpires'),
      },
    );
    return { accessToken, refreshToken };
  }

  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
