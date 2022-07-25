import { Injectable } from '@nestjs/common'
import { CosmService } from './cosm.service'
import {
  MsgSetOrchestratorAddressEncodeObject,
  typeUrls,
} from '@merlionzone/merlionjs'
import { assertIsDeliverTxSuccess } from '@cosmjs/stargate'

@Injectable()
export class CosmGravityService {
  constructor(private readonly cosmService: CosmService) {}

  async setOrchestratorAddressForAllValidators(numValidators = 4) {
    const promises = []
    for (let i = 0; i < numValidators; i++) {
      promises.push(async () => {
        const validator = await this.cosmService.getAccount(i, true)
        const client = await this.cosmService.getClient(validator)

        const setOrchestratorAddrMsg: MsgSetOrchestratorAddressEncodeObject = {
          typeUrl: typeUrls.MsgSetOrchestratorAddress,
          value: {
            validator: validator.mervaloperAddress(),
            orchestrator: validator.merAddress(),
            ethAddress: validator.ethAddress(),
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
}
