import { Injectable } from '@nestjs/common'
import { Coin } from '@merlionzone/merlionjs'
import { Any } from 'cosmjs-types/google/protobuf/any'
import {
  assertIsDeliverTxSuccess,
  MsgSubmitProposalEncodeObject,
} from '@cosmjs/stargate'
import { CosmService } from './cosm.service'
import { Account } from '../accounts'
import { MsgSubmitProposalResponse } from 'cosmjs-types/cosmos/gov/v1beta1/tx'
import { Long } from 'long'
import { MsgVoteEncodeObject } from '@cosmjs/stargate/build/modules/gov/messages'
import { VoteOption } from 'cosmjs-types/cosmos/gov/v1beta1/gov'
import { backingRiskParams, registerBackingProposal } from './proposals'
import { RegisterBackingProposal } from '../../../merlionjs/dist/proto/merlion/maker/v1/maker'
import { GovParamsType } from '@cosmjs/stargate/build/modules/gov/queries'
import { QueryParamsResponse } from 'cosmjs-types/cosmos/gov/v1beta1/query'

@Injectable()
export class ProposalService {
  constructor(private readonly cosmService: CosmService) {}

  async queryParams(paramsType: GovParamsType): Promise<QueryParamsResponse> {
    const query = await this.cosmService.getQueryClient()
    return query.gov.params(paramsType)
  }

  async submitProposal(
    proposer: Account,
    content: Any,
    deposit?: Coin,
  ): Promise<Long> {
    if (!deposit) {
      const params = await this.queryParams('deposit')
      deposit = Coin.fromProto(params.depositParams.minDeposit[0])
    }

    const msg: MsgSubmitProposalEncodeObject = {
      typeUrl: '/cosmos.gov.v1beta1.MsgSubmitProposal',
      value: {
        proposer: proposer.merAddress(),
        initialDeposit: [deposit.toProto()],
        content: content,
      },
    }
    const client = await this.cosmService.getClient(proposer)
    const receipt = await client.signAndBroadcastBlock(proposer.merAddress(), [
      msg,
    ])
    assertIsDeliverTxSuccess(receipt)
    const res = MsgSubmitProposalResponse.decode(receipt.data![0].data)
    return res.proposalId
  }

  async voteProposal(
    voter: Account,
    proposalId: Long,
    option: VoteOption = VoteOption.VOTE_OPTION_YES,
  ) {
    const msg: MsgVoteEncodeObject = {
      typeUrl: '/cosmos.gov.v1beta1.MsgVote',
      value: {
        proposalId,
        voter: voter.merAddress(),
        option,
      },
    }
    const client = await this.cosmService.getClient(voter)
    const receipt = await client.signAndBroadcast(voter.merAddress(), [msg])
    assertIsDeliverTxSuccess(receipt)
  }

  async ensureRegisterBacking(denom: string, numValidators = 4) {
    const proposer = await this.cosmService.getAccount(0)

    const proposal: RegisterBackingProposal = {
      ...registerBackingProposal,
      riskParams: {
        ...backingRiskParams,
        backingDenom: denom,
      },
    }
    const content = Any.fromPartial({
      typeUrl: '/merlion.maker.v1.RegisterBackingProposal',
      value: RegisterBackingProposal.encode(proposal).finish(),
    })
    const proposalId = await this.submitProposal(proposer, content)
    console.log(`Submitted proposal, id ${proposalId}`)

    for (let i = 0; i < numValidators; i++) {
      const voter = await this.cosmService.getAccount(i, true)
      await this.voteProposal(voter, proposalId)
      console.log(
        `Voted proposal with id ${proposalId} from validator ${i} address ${voter.mervaloperAddress()}`,
      )
    }
  }
}
