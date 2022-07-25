import { BigNumber, ethers } from 'ethers'
import hre from './hardhat'
import { ERC20__factory, ERC20MinterBurnerDecimals } from '../../typechain'
import { E18, E8 } from '../utils'
import { Account } from '../accounts'
import { Injectable } from '@nestjs/common'

@Injectable()
export class Erc20Service {
  async deployErc20(opts: {
    name?: string
    symbol: string
    decimals?: number
    supply?: BigNumber
  }): Promise<{
    address: string
  }> {
    if (!opts.name) {
      opts.name = opts.symbol
    }
    if (!opts.decimals) {
      opts.decimals = 18
    }
    if (!opts.supply) {
      opts.supply = E18.mul(E8)
    }

    const account0 = (await hre.ethers.getSigners())[0].address

    const ERC20 = await hre.ethers.getContractFactory(
      'ERC20MinterBurnerDecimals',
    )

    const erc20 = (await ERC20.deploy(
      opts.name,
      opts.symbol,
      opts.decimals,
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

    if (opts.supply) {
      receipt = await (await erc20.mint(account0, opts.supply)).wait(1)
      console.log(
        `Minted ${opts.supply} ${opts.symbol} to ${account0}, txHash ${receipt.transactionHash}, at block ${receipt.blockNumber}`,
      )
    }

    return {
      address: erc20.address,
    }
  }

  async transfer(opts: {
    from: Account
    to: Account
    tokenAddress: string
    amount: BigNumber
  }) {
    const provider = new ethers.providers.JsonRpcProvider(
      process.env.WEB3_RPC_ENDPOINT,
    )
    const signer = new ethers.Wallet(opts.from.privateKey, provider)

    const erc20 = ERC20__factory.connect(opts.tokenAddress, signer)

    const symbol = await erc20.symbol()

    const receipt = await (
      await erc20.transfer(opts.to.ethAddress(), opts.amount)
    ).wait(1)
    console.log(
      `Transferred ${
        opts.amount
      } ${symbol} from ${opts.from.ethAddress()} to ${opts.to.ethAddress()}, txHash ${
        receipt.transactionHash
      }, at block ${receipt.blockNumber}`,
    )
  }
}
