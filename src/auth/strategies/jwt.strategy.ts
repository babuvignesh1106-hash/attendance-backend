// src/auth/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: 'YOUR_SECRET_KEY', // use env variable in production
    });
  }

  async validate(payload: any) {
    // payload is decoded JWT
    return { id: payload.sub, email: payload.email, name: payload.name };
  }
}
