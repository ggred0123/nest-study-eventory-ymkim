import { Body, Controller, HttpCode, Post, Req, Res } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { TokenDto } from './dto/token.dto';
import { SignUpPayload } from './payload/sign-up.payload';
import { Response, Request } from 'express';
import { LoginPayload } from './payload/login.payload';

@Controller('auth')
@ApiTags('Auth API')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-up')
  @ApiOperation({ summary: '회원가입' })
  @ApiCreatedResponse({ type: TokenDto })
  async signUp(
    @Body() payload: SignUpPayload,
    @Res({ passthrough: true }) res: Response,
  ): Promise<TokenDto> {
    const tokens = await this.authService.signUp(payload);

    // refresh Token은 쿠키로
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      // 이후 실제 도메인으로 변경
      domain: 'localhost',
    });

    return TokenDto.from(tokens.accessToken);
  }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: '로그인' })
  @ApiOkResponse({ type: TokenDto })
  async login(
    @Body() payload: LoginPayload,
    @Res({ passthrough: true }) res: Response,
  ): Promise<TokenDto> {
    const tokens = await this.authService.login(payload);

    // refresh Token은 쿠키로
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      // 이후 실제 도메인으로 변경
      domain: 'localhost',
    });

    return TokenDto.from(tokens.accessToken);
  }

  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: '토큰 갱신' })
  @ApiOkResponse({ type: TokenDto })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<TokenDto> {
    const tokens = await this.authService.refresh(req.cookies['refreshToken']);

    // refresh Token은 쿠키로
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      // 이후 실제 도메인으로 변경
      domain: 'localhost',
    });

    return TokenDto.from(tokens.accessToken);
  }
}
