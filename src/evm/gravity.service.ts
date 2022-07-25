import hre from './hardhat'
import { Gravity, Gravity__factory } from '../../typechain'
import { ERC20DeployedEventEvent } from '../../typechain/Gravity'
import { Injectable } from '@nestjs/common'
import { TextEncoder } from 'util'

@Injectable()
export class EvmGravityService {
  resetNetwork() {
    hre.changeNetwork(hre.config.defaultNetwork)
  }

  async deployGravity(opts: {
    gravityId: string
    validators: string[]
    powers: string[]
  }): Promise<{
    address: string
  }> {
    hre.changeNetwork('bridgingNet')

    const Gravity = await hre.ethers.getContractFactory('Gravity')

    const gravityId = new Uint8Array(32)
    gravityId.set(new TextEncoder().encode(opts.gravityId), 0)

    const gravity = (await Gravity.deploy(
      gravityId,
      opts.validators,
      opts.powers,
    )) as Gravity
    await gravity.deployed()
    const receipt = await gravity.deployTransaction.wait(1)
    console.log(
      `Deployed Gravity to ${gravity.address}, gravityId ${opts.gravityId}, validators ${opts.validators}, powers ${opts.powers}, txHash ${receipt.transactionHash}, at block ${receipt.blockNumber}`,
    )

    return {
      address: gravity.address,
    }
  }

  async deployCosmDenom(opts: {
    gravityAddress: string
    denom: string
    name: string
    symbol: string
    decimals: number
  }) {
    hre.changeNetwork('bridgingNet')

    const account0 = (await hre.ethers.getSigners())[0]

    const gravity = Gravity__factory.connect(opts.gravityAddress, account0)

    const receipt = await (
      await gravity.deployERC20(
        opts.denom,
        opts.name,
        opts.symbol,
        opts.decimals,
      )
    ).wait(1)

    const event = receipt.events?.find(
      (e) => e.event === 'ERC20DeployedEvent',
    ) as ERC20DeployedEventEvent

    console.log(
      `Deployed Cosm denom ${opts.denom} to ${event.args._tokenContract}, name ${opts.name}, symbol ${opts.symbol}, decimals ${opts.decimals}, txHash ${receipt.transactionHash}, at block ${receipt.blockNumber}`,
    )
  }
}
