import { Module } from '@nestjs/common'
import { CosmService } from './cosm.service'
import { CosmCmdService } from './cosm.cmd.service'
import { ProposalService } from './proposal.service'
import { OracleService } from './oracle.service'

@Module({
  providers: [CosmService, CosmCmdService, ProposalService, OracleService],
  exports: [CosmService, ProposalService, OracleService],
})
export class CosmModule {}
