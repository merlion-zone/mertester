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
  async registerBackingCollateral(opts: {
    symbols: string[]
  }): Promise<string[]> {
    const denoms = []
    for (const symbol of opts.symbols) {
      const { address: erc20Address } = await this.erc20Service.deployErc20({
        symbol,
      })

      const denom = `erc20/${erc20Address}`
      denoms.push(denom)

      await this.proposalService.ensureRegisterBacking(denom)
      await this.proposalService.ensureRegisterCollateral(denom)
    }
    return denoms
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
    command: 'prepare-all',
    options: [
      {
        flags: '--numAccounts <numAccounts>',
        defaultValue: 4,
      },
      {
        flags: '--symbols <symbols...>',
        description:
          'Specify symbols of ERC20 tokens which will be deployed and registered',
        required: true,
      },
      {
        flags: '--prices <prices>',
        description:
          'Specify prices of tokens which will be fed to oracle, e.g., "LION:0.000000000001234,USM:0.995,BTC:0.00000001,USDT:0.000000000001"',
        required: true,
      },
    ],
  })
  async prepareAll(opts: {
    numAccounts: number
    symbols: string[]
    prices: string
  }) {
    await this.prepareAccounts({ numAccounts: opts.numAccounts })

    let denoms = await this.registerBackingCollateral({
      symbols: opts.symbols,
    })

    denoms = ['alion', 'uusd'].concat(denoms)
    const symbols = ['LION', 'USM'].concat(opts.symbols)
    const pricesMap = new Map()
    opts.prices.split(',').forEach((part) => {
      const [symbol, price] = part.split(':')
      pricesMap.set(symbol, price)
    })

    await this.registerOracleTargets({
      denoms,
    })

    const rates = denoms
      .map((denom, i) => `${denom}:${pricesMap.get(symbols[i])}`)
      .join(',')
    await this.feedPriceLoop({ rates })
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
