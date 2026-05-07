import { Controller, Post, Body, UnauthorizedException, UseGuards, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('login')
  async login(@Body() body: any) {
    if (!body.email || !body.password) {
      throw new UnauthorizedException('Email and password are required');
    }
    const user = await this.authService.validateUser(body.email, body.password);
    return this.authService.login(user);
  }

  @Post('refresh')
  async refresh(@Body() body: any) {
    if (!body.refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    try {
      const payload = this.jwtService.verify(body.refreshToken, {
        secret: process.env.JWT_SECRET || 'super-secret-key',
      });
      const userId = payload.sub;
      return await this.authService.refreshTokens(userId, body.refreshToken);
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  // Example protected route testing guards
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Platform Admin')
  @Get('admin-only')
  getAdminData(@CurrentUser() user: any) {
    return { message: 'Welcome Admin', user };
  }
}
