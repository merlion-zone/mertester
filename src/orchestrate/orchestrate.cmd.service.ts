import { Command, Console } from 'nestjs-console'
import { Erc20Service } from '../evm/erc20.service'
import { CosmService } from '../cosm/cosm.service'
import { ProposalService } from '../cosm/proposal.service'
import { Coin } from '@merlionzone/merlionjs'
import { E18 } from '../utils'
import { OracleService, toExchangeRates } from '../cosm/oracle.service'

@Console({
  command: 'orchestrate',
  description: 'Orchestrate commands',
})
export class OrchestrateCmdService {
  constructor(
    private readonly erc20Service: Erc20Service,
    private readonly cosmService: CosmService,
    private readonly proposalService: ProposalService,
    private readonly oracleService: OracleService,
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
      await this.proposalService.ensureRegisterCollateral(denom)
    }
  }

  @Command({
    command: 'register-oracle-targets',
    options: [
      {
        flags: '--denoms <denoms...>',
        description: 'Specify denoms of oracle targets',
        defaultValue: ['alion', 'uusd'],
      },
    ],
  })
  async registerOracleTargets(opts: { denoms: string[] }) {
    for (const denom of opts.denoms) {
      await this.proposalService.ensureRegisterOracleTarget(denom)
    }
  }

  @Command({
    command: 'feed-price-loop',
    options: [
      {
        flags: '--rates <rates>',
        description:
          'Specify exchange rates string, e.g., "alion:1.234,uusd:0.99"',
        required: true,
      },
    ],
  })
  async feedPriceLoop(opts: { rates: string }) {
    const rates = toExchangeRates(opts.rates)
    for (let i = 0; ; i++) {
      try {
        console.log(`#${i + 1} Feed price at ${new Date()}`)
        await this.oracleService.feedPriceByAllValidators(rates)
      } catch (e) {
        console.error(e)
      }
    }
  }
}
