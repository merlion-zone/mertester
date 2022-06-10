import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { ConfigModule } from '@nestjs/config'
import { ConsoleModule } from 'nestjs-console'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AppCmdService } from './app.cmd.service'

@Module({
  imports: [
    ConsoleModule,
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
    }),
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: './sqlite.db',
      statementCacheSize: 100,
      autoLoadEntities: true,
      synchronize: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService, AppCmdService],
})
export class AppModule {}
