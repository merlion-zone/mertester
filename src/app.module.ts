import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { ConfigModule } from '@nestjs/config'
import { ConsoleModule } from 'nestjs-console'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AppCmdService } from './app.cmd.service'
import { EvmModule } from './evm/evm.module'
import { CosmModule } from './cosm/cosm.module'
import { OrchestrateModule } from './orchestrate/orchestrate.module'

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
    EvmModule,
    CosmModule,
    OrchestrateModule,
  ],
  controllers: [AppController],
  providers: [AppService, AppCmdService],
})
export class AppModule {}
