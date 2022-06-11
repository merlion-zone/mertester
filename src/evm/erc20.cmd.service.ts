import { Command, Console } from 'nestjs-console'
import hre from './hardhat'
import {
  ERC20MinterBurnerDecimals,
  ERC20MinterBurnerDecimals__factory,
} from '../../typechain'
import { getAccounts } from './accounts'
import { BigNumber, ethers } from 'ethers'
import { Address } from '@merlionzone/merlionjs'
import { E18, E8 } from '../utils'

@Console({
  command: 'evm.erc20',
  description: 'ERC20 commands',
})
export class Erc20CmdService {
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
    if (!opts.name) {
      opts.name = opts.symbol
    }
    await this.deployErc20(
      opts.name,
      opts.symbol,
      opts.decimals,
      BigNumber.from(opts.supply),
    )
  }

  async deployErc20(
    name: string,
    symbol: string,
    decimals: number,
    supply: BigNumber,
  ) {
    const account0 = (await hre.ethers.getSigners())[0].address
    const account1 = (await hre.ethers.getSigners())[1].address

    const ERC20 = await hre.ethers.getContractFactory(
      'ERC20MinterBurnerDecimals',
    )

    const erc20 = (await ERC20.deploy(
      name,
      symbol,
      decimals,
    )) as ERC20MinterBurnerDecimals
    await erc20.deployed()
    let receipt = await erc20.deployTransaction.wait(1)
    console.log(
      `Deployed ERC20MinterBurnerDecimals to ${
        erc20.address
      }, name ${await erc20.name()}, symbol ${await erc20.symbol()}, decimals ${await erc20.decimals()}, txHash ${
        receipt.transactionHash
      }, at block ${receipt.blockNumber}`,
    )

    if (supply) {
      receipt = await (await erc20.mint(account0, supply)).wait(1)
      console.log(
        `Minted ${supply} ${symbol} to ${account0}, txHash ${receipt.transactionHash}, at block ${receipt.blockNumber}`,
      )

      const amount = E18.mul(100)
      receipt = await (await erc20.transfer(account1, amount)).wait(1)
      console.log(
        `Transferred ${amount} ${symbol} to ${account1}, txHash ${receipt.transactionHash}, at block ${receipt.blockNumber}`,
      )
    }
  }
}
