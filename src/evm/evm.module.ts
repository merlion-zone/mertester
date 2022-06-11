import { Module } from '@nestjs/common'
import { EvmCmdService } from './evm.cmd.service'
import { Erc20CmdService } from './erc20.cmd.service'

@Module({
  providers: [EvmCmdService, Erc20CmdService],
})
export class EvmModule {}
