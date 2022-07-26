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
import { MsgVoteEncodeObject } from '@cosmjs/stargate/build/modules/gov/messages'
import { VoteOption } from 'cosmjs-types/cosmos/gov/v1beta1/gov'
import {
  backingRiskParams,
  collateralRiskParams,
  evmChainParams,
  registerBackingProposal,
  registerCollateralProposal,
  registerOracleTargetProposal,
  targetParams,
  updateEvmChainParamsProposal,
} from './proposals'
import { GovParamsType } from '@cosmjs/stargate/build/modules/gov/queries'
import { QueryParamsResponse } from 'cosmjs-types/cosmos/gov/v1beta1/query'
import {
  RegisterBackingProposal,
  RegisterCollateralProposal,
} from '@merlionzone/merlionjs/dist/proto/merlion/maker/v1/maker'
import { OracleService } from './oracle.service'
import Long from 'long'
import { RegisterTargetProposal } from '@merlionzone/merlionjs/dist/proto/merlion/oracle/v1/oracle'
import { UpdateChainParamsProposal } from '@merlionzone/merlionjs/dist/proto/multigravity/v1/types'

@Injectable()
export class ProposalService {
  constructor(
    private readonly cosmService: CosmService,
    private readonly oracleService: OracleService,
  ) {}

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
    const receipt = await client.signAndBroadcastBlock(voter.merAddress(), [
      msg,
    ])
    assertIsDeliverTxSuccess(receipt)
  }

  async ensureProposal(content: Any, numValidators = 4) {
    const proposer = await this.cosmService.getAccount(0)

    const proposalId = await this.submitProposal(proposer, content)
    console.log(
      `Submitted proposal, id ${proposalId}, typeUrl: ${content.typeUrl}`,
    )

    const promises = []
    for (let i = 0; i < numValidators; i++) {
      promises.push(async () => {
        const voter = await this.cosmService.getAccount(i, true)
        await this.voteProposal(voter, proposalId)
        console.log(
          `Voted proposal with id ${proposalId} from validator ${i} address ${voter.mervaloperAddress()}`,
        )
      })
    }
    await Promise.all(promises.map((fn) => fn()))
  }

  async ensureRegisterOracleTarget(denom: string, numValidators = 4) {
    const proposal: RegisterTargetProposal = {
      ...registerOracleTargetProposal,
      targetParams: {
        ...targetParams,
        denom,
      },
    }
    const content = Any.fromPartial({
      typeUrl: '/merlion.oracle.v1.RegisterTargetProposal',
      value: RegisterTargetProposal.encode(proposal).finish(),
    })

    await this.ensureProposal(content, numValidators)
  }

  async ensureRegisterBacking(denom: string, numValidators = 4) {
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

    await this.ensureProposal(content, numValidators)
  }

  async ensureRegisterCollateral(denom: string, numValidators = 4) {
    const proposal: RegisterCollateralProposal = {
      ...registerCollateralProposal,
      riskParams: {
        ...collateralRiskParams,
        collateralDenom: denom,
      },
    }
    const content = Any.fromPartial({
      typeUrl: '/merlion.maker.v1.RegisterCollateralProposal',
      value: RegisterCollateralProposal.encode(proposal).finish(),
    })

    await this.ensureProposal(content, numValidators)
  }

  async ensureUpdateEvmChainParams(
    chainIdentifier: string,
    numValidators = 4,
    bridgeEthereumAddress?: string,
  ) {
    const proposal: UpdateChainParamsProposal = {
      ...updateEvmChainParamsProposal,
      chainIdentifier,
      params: {
        ...evmChainParams,
        gravityId: chainIdentifier,
        bridgeEthereumAddress:
          bridgeEthereumAddress ?? evmChainParams.bridgeEthereumAddress,
      },
    }
    const content = Any.fromPartial({
      typeUrl: '/multigravity.v1.UpdateChainParamsProposal',
      value: UpdateChainParamsProposal.encode(proposal).finish(),
    })

    await this.ensureProposal(content, numValidators)
  }
}
