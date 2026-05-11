import { Controller, Post, Body, UnauthorizedException, UseGuards, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LoginDto, RefreshTokenDto } from './dto/auth.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  @ApiOperation({ summary: 'Login with email and password' })
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(loginDto.email, loginDto.password);
    return this.authService.login(user);
  }

  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @Post('refresh')
  async refresh(@Body() refreshDto: RefreshTokenDto) {
    try {
      const payload = this.jwtService.verify(refreshDto.refreshToken, {
        secret: process.env.JWT_SECRET || 'super-secret-key',
      });
      const userId = payload.sub;
      return await this.authService.refreshTokens(userId, refreshDto.refreshToken);
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  // Example protected route testing guards
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Test route for admin role' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('admin-only')
  getAdminData(@CurrentUser() user: any) {
    return { message: 'Welcome Admin', user };
  }
}
