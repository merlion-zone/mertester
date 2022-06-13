import { Command, Console } from 'nestjs-console'
import { BigNumber } from 'ethers'
import { E18, E8 } from '../utils'
import { Erc20Service } from './erc20.service'

@Console({
  command: 'evm.erc20',
  description: 'ERC20 commands',
})
export class Erc20CmdService {
  constructor(private readonly erc20Service: Erc20Service) {}

  @Command({
    command: 'deploy',
    options: [
      {
        flags: '--symbol <symbol>',
        required: true,
      },
      {
        flags: '--name <name>',
        required: false,
      },
      {
        flags: '--decimals <decimals>',
        defaultValue: 18,
      },
      {
        flags: '--supply <supply>',
        defaultValue: E18.mul(E8).toString(),
      },
    ],
  })
  async deploy(opts: {
    symbol: string
    name?: string
    decimals: number
    supply: string
  }) {
    await this.erc20Service.deployErc20({
      name: opts.name,
      symbol: opts.symbol,
      decimals: opts.decimals,
      supply: BigNumber.from(opts.supply),
    })
  }
}
