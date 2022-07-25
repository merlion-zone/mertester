import { Module } from '@nestjs/common'
import { EvmCmdService } from './evm.cmd.service'
import { Erc20CmdService } from './erc20.cmd.service'
import { Erc20Service } from './erc20.service'
import { EvmGravityService } from './gravity.service'

@Module({
  providers: [EvmCmdService, Erc20CmdService, Erc20Service, EvmGravityService],
  exports: [Erc20Service, EvmGravityService],
})
export class EvmModule {}
