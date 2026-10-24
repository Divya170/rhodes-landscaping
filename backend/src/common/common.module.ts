import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotifierService } from './notifier.service';
import { HistoryService } from './history.service';
import { StatusEvent } from './status-event.entity';
import { SessionGuard, sessionHours } from './session';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([StatusEvent]),
    // Async so values from .env (loaded by ConfigModule) are available
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.SESSION_SECRET || 'dev-only-session-secret-change-me',
        signOptions: { expiresIn: `${sessionHours()}h` },
      }),
    }),
  ],
  providers: [SessionGuard, NotifierService, HistoryService],
  exports: [JwtModule, SessionGuard, NotifierService, HistoryService],
})
export class CommonModule {}
