import { Module } from '@nestjs/common'
import { CosmService } from './cosm.service'
import { CosmCmdService } from './cosm.cmd.service'
import { ProposalService } from './proposal.service'

@Module({
  providers: [CosmService, CosmCmdService, ProposalService],
  exports: [CosmService, ProposalService],
})
export class CosmModule {}
