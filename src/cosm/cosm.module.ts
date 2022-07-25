import { Module } from '@nestjs/common'
import { CosmService } from './cosm.service'
import { CosmCmdService } from './cosm.cmd.service'
import { ProposalService } from './proposal.service'
import { OracleService } from './oracle.service'
import { CosmGravityService } from './gravity.service'

@Module({
  providers: [
    CosmService,
    CosmCmdService,
    ProposalService,
    OracleService,
    CosmGravityService,
  ],
  exports: [CosmService, ProposalService, OracleService, CosmGravityService],
})
export class CosmModule {}
