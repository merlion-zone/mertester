import { Module } from '@nestjs/common'
import { OrchestrateCmdService } from './orchestrate.cmd.service'
import { EvmModule } from '../evm/evm.module'
import { CosmModule } from '../cosm/cosm.module'

@Module({
  imports: [EvmModule, CosmModule],
  providers: [OrchestrateCmdService],
})
export class OrchestrateModule {}
