import { Command, Console } from 'nestjs-console'
import { Erc20Service } from '../evm/erc20.service'
import { CosmService } from '../cosm/cosm.service'
import { ProposalService } from '../cosm/proposal.service'
import { Coin } from '@merlionzone/merlionjs'
import { E18, sleep } from '../utils'
import { OracleService, toExchangeRates } from '../cosm/oracle.service'
import { EvmGravityService } from '../evm/gravity.service'
import assert from 'assert'
import { CosmGravityService } from '../cosm/gravity.service'

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
    private readonly evmGravityService: EvmGravityService,
    private readonly cosmGravityService: CosmGravityService,
  ) {}

  @Command({
    command: 'prepare-accounts',
    options: [
      {
        flags: '--numAccounts <numAccounts>',
        defaultValue: 4,
      },
      {
        flags: '--isBridgingNet',
        defaultValue: false,
      },
    ],
  })
  async prepareAccounts(opts: {
    numAccounts: number
    isBridgingNet?: boolean
    forBridging?: boolean
    oneMore?: boolean
  }) {
    const promises = []
    for (let i = 0; i < opts.numAccounts; i++) {
      promises.push(async () => {
        const validator = await this.cosmService.getAccount(i, true)
        const account = await this.cosmService.getAccount(
          i,
          opts.forBridging,
          opts.forBridging,
        )
        await this.cosmService.transfer({
          from: validator,
          to: account,
          amount: new Coin('alion', E18.mul(10).toString()).toString(),
          isBridgingNet: opts.isBridgingNet,
        })

        if (opts.oneMore && i + 1 === opts.numAccounts) {
          const account = await this.cosmService.getAccount(
            i + 1, // one more account
            opts.forBridging,
            opts.forBridging,
          )
          console.log(
            `One more account: ${account.merAddress()}, ${account.ethAddress()}`,
          )
          await this.cosmService.transfer({
            from: validator,
            to: account,
            amount: new Coin('alion', E18.mul(10).toString()).toString(),
            isBridgingNet: opts.isBridgingNet,
          })
        }
      })
    }
    await Promise.all(promises.map((fn) => fn()))
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
        defaultValue: ['alion', 'uusm'],
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
        defaultValue: [],
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

    denoms = ['alion', 'uusm'].concat(denoms)
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
          'Specify exchange rates string, e.g., "alion:1.234,uusm:0.99"',
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

  @Command({
    command: 'deploy-gravity',
    options: [
      {
        flags: '--numAccounts <numAccounts>',
        defaultValue: 4,
      },
      {
        flags: '--gravityId <gravityId>',
        required: true,
      },
    ],
  })
  async deployGravity(opts: { numAccounts: number; gravityId: string }) {
    // Here use gravityId as the chainIdentifier
    const chainIdentifier = opts.gravityId

    const query = await this.cosmService.getQueryClient()

    console.log(`Prepare accounts on Merlion network...`)
    await this.prepareAccounts({ numAccounts: opts.numAccounts })
    console.log(
      `Prepare accounts for validator orchestrator on Merlion network...`,
    )
    await this.prepareAccounts({
      numAccounts: opts.numAccounts,
      isBridgingNet: false,
      forBridging: true,
      oneMore: true,
    })
    console.log(`Prepare accounts or on EVM bridging network...`)
    await this.prepareAccounts({
      numAccounts: opts.numAccounts,
      isBridgingNet: true,
      forBridging: false,
    })
    console.log(
      `Prepare accounts for validator orchestrator on EVM bridging network...`,
    )
    await this.prepareAccounts({
      numAccounts: opts.numAccounts,
      isBridgingNet: true,
      forBridging: true,
      oneMore: true,
    })

    await this.proposalService.ensureUpdateEvmChainParams(
      chainIdentifier,
      opts.numAccounts,
    )

    console.log(`EVM chain '${chainIdentifier}' is being registered...`)
    while (true) {
      await sleep(6000)
      const { chainIdentifiers } = await query.gravity.chains()
      if (chainIdentifiers.indexOf(chainIdentifier) >= 0) {
        break
      }
    }
    console.log(`EVM chain '${chainIdentifier}' has been registered`)

    await this.cosmGravityService.setOrchestratorAddressForAllValidators(
      opts.numAccounts,
    )

    const { valset } = await query.gravity.currentValset(chainIdentifier)

    const { address: gravityAddress } =
      await this.evmGravityService.deployGravity({
        gravityId: opts.gravityId,
        validators: valset.members.map((v) => v.ethereumAddress),
        powers: valset.members.map((v) => v.power.toString()),
      })

    const denoms = ['alion', 'uusm']
    for (const denom of denoms) {
      await this.deployCosmDenomForGravity({ gravityAddress, denom })
    }

    this.evmGravityService.resetNetwork()

    console.log(
      `Update gravity params bridgeEthereumAddress to ${gravityAddress}...`,
    )
    await this.proposalService.ensureUpdateEvmChainParams(
      chainIdentifier,
      opts.numAccounts,
      gravityAddress,
    )

    console.log(`EVM chain '${chainIdentifier}' is being updated...`)
    while (true) {
      await sleep(6000)
      const { params } = await query.gravity.params(chainIdentifier)
      if (params.bridgeEthereumAddress === gravityAddress) {
        break
      }
    }
    console.log(`EVM chain '${chainIdentifier}' has been updated`)
  }

  @Command({
    command: 'deploy-gravity-denom',
    options: [
      {
        flags: '--gravityAddress <gravityAddress>',
        required: true,
      },
      {
        flags: '--denom <denom>',
        required: true,
      },
    ],
  })
  async deployCosmDenomForGravity(opts: {
    gravityAddress: string
    denom: string
  }) {
    const query = await this.cosmService.getQueryClient()
    let metadata, decimals
    if (opts.denom === 'alion') {
      metadata = {
        name: 'LION',
        symbol: 'LION',
      }
      decimals = 18
    } else {
      metadata = await query.bank.denomMetadata(opts.denom)
      decimals = metadata.denomUnits.find(
        (unit) => unit.denom === metadata.display,
      )?.exponent
      assert(decimals, 'cannot get decimals')
    }

    await this.evmGravityService.deployCosmDenom({
      gravityAddress: opts.gravityAddress,
      denom: opts.denom,
      name: metadata.name,
      symbol: metadata.symbol,
      decimals,
    })
  }
}
