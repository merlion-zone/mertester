import { Module } from '@nestjs/common'
import { EvmCmdService } from './evm.cmd.service'
import { Erc20CmdService } from './erc20.cmd.service'
import { Erc20Service } from './erc20.service'

@Module({
  providers: [EvmCmdService, Erc20CmdService, Erc20Service],
  exports: [Erc20Service],
})
export class EvmModule {}
