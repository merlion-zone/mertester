import { Injectable } from '@nestjs/common'
import { CosmService } from './cosm.service'
import {
  MsgSetOrchestratorAddressEncodeObject,
  typeUrls,
} from '@merlionzone/merlionjs'
import { assertIsDeliverTxSuccess } from '@cosmjs/stargate'
import { ethers } from 'ethers'

@Injectable()
export class CosmGravityService {
  constructor(private readonly cosmService: CosmService) {}

  async setOrchestratorAddressForAllValidators(numValidators = 4) {
    const promises = []
    for (let i = 0; i < numValidators; i++) {
      promises.push(async () => {
        const validator = await this.cosmService.getAccount(i, true)
        const orchestrator = await this.cosmService.getAccount(i, true, true)
        const client = await this.cosmService.getClient(validator)

        const setOrchestratorAddrMsg: MsgSetOrchestratorAddressEncodeObject = {
          typeUrl: typeUrls.MsgSetOrchestratorAddress,
          value: {
            validator: validator.mervaloperAddress(),
            orchestrator: orchestrator.merAddress(),
            ethAddress: orchestrator.ethAddress(),
          },
        }

        const receipt = await client.signAndBroadcastBlock(
          validator.merAddress(),
          [setOrchestratorAddrMsg],
        )
        assertIsDeliverTxSuccess(receipt)
        console.log(
          `SetOrchestratorAddress by validator ${validator.mervaloperAddress()}, orchestratorAddress ${validator.merAddress()}, ethAddress ${validator.ethAddress()}, at block height ${
            receipt.height
          }`,
        )
      })
    }
    await Promise.all(promises.map((fn) => fn()))
  }

  async info(chainIdentifier: string) {
    const query = await this.cosmService.getQueryClient()

    const { params } = await query.gravity.params(chainIdentifier)
    console.log(`params: ${JSON.stringify(params, undefined, 1)}`)

    const { valset } = await query.gravity.currentValset(chainIdentifier)
    console.log(`currentValset: ${JSON.stringify(valset, undefined, 1)}`)

    const { valsets: lastValsetRequests } =
      await query.gravity.lastValsetRequests(chainIdentifier)
    console.log(
      `lastValsetRequests: ${JSON.stringify(lastValsetRequests, undefined, 1)}`,
    )

    const { batchFees } = await query.gravity.batchFees(chainIdentifier)
    console.log(`batchFees: ${JSON.stringify(batchFees, undefined, 1)}`)

    const { batches } = await query.gravity.outgoingTxBatches(chainIdentifier)
    console.log(`outgoingTxBatches: ${JSON.stringify(batches, undefined, 1)}`)
  }

  async showToken(chainIdentifier: string, token: string) {
    const query = await this.cosmService.getQueryClient()

    if (ethers.utils.isAddress(token)) {
      const { denom, cosmosOriginated } = await query.gravity.erc20ToDenom(
        ethers.utils.getAddress(token),
        chainIdentifier,
      )
      console.log(
        `Denom: ${denom}, token address: ${ethers.utils.getAddress(
          token,
        )}, cosmos native: ${cosmosOriginated}`,
      )
    } else {
      const { erc20, cosmosOriginated } = await query.gravity.denomToERC20(
        token,
        chainIdentifier,
      )
      console.log(
        `Denom: ${token}, token address: ${ethers.utils.getAddress(
          erc20,
        )}, cosmos native: ${cosmosOriginated}`,
      )
    }
  }
}
