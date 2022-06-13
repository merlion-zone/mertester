import { Command, Console } from 'nestjs-console'
import { Erc20Service } from '../evm/erc20.service'
import { CosmService } from '../cosm/cosm.service'
import { ProposalService } from '../cosm/proposal.service'
import { Coin } from '@merlionzone/merlionjs'
import { E18, sleep } from '../utils'

@Console({
  command: 'orchestrate',
  description: 'Orchestrate commands',
})
export class OrchestrateCmdService {
  constructor(
    private readonly erc20Service: Erc20Service,
    private readonly cosmService: CosmService,
    private readonly proposalService: ProposalService,
  ) {}

  @Command({
    command: 'prepare-accounts',
    options: [
      {
        flags: '--numAccounts <numAccounts>',
        defaultValue: 4,
      },
    ],
  })
  async prepareAccounts(opts: { numAccounts: number }) {
    const validator = await this.cosmService.getAccount(0, true)
    for (let i = 0; i < opts.numAccounts; i++) {
      const account = await this.cosmService.getAccount(i)
      await this.cosmService.transfer({
        from: validator,
        to: account,
        amount: new Coin('alion', E18.mul(10).toString()).toString(),
      })
    }
  }

  @Command({
    command: 'register-backing-collateral',
    options: [
      {
        flags: '--symbols <symbols...>',
        description:
          'Specify symbols of ERC20 tokens which will be deployed and registered',
        required: true,
      },
    ],
  })
  async registerBackingCollateral(opts: { symbols: string[] }) {
    for (const symbol of opts.symbols) {
      const { address: erc20Address } = await this.erc20Service.deployErc20({
        symbol,
      })

      const denom = `erc20/${erc20Address}`

      await this.proposalService.ensureRegisterBacking(denom)
    }
  }
}
