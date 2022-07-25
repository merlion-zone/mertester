import { Injectable } from '@nestjs/common'
import { CosmService } from './cosm.service'
import { Params } from '@merlionzone/merlionjs/dist/proto/merlion/oracle/v1/oracle'
import * as Long from 'long'
import { sleep } from '../utils'
import { Dec, MerlionClient, typeUrls } from '@merlionzone/merlionjs'
import { sha256 } from '@cosmjs/crypto'
import { ethers } from 'ethers'
import { assertIsDeliverTxSuccess } from '@cosmjs/stargate'
import {
  MsgAggregateExchangeRatePrevoteEncodeObject,
  MsgAggregateExchangeRateVoteEncodeObject,
} from '@merlionzone/merlionjs'
import { TextEncoder } from 'util'

interface ExchangeRates {
  [denom: string]: Dec
}

export function toExchangeRatesStr(rates: ExchangeRates): string {
  return Object.entries(rates)
    .map(([key, value]) => `${key}:${value}`)
    .join(',')
}

export function toExchangeRates(ratesStr: string): ExchangeRates {
  const rates = {}
  const pairs = ratesStr.split(',')
  if (!pairs.length) {
    throw new Error('invalid exchange rates string')
  }
  pairs.forEach((rate) => {
    const [denom, amount, ...remain] = rate.split(':')
    if (!denom || !amount || remain.length) {
      throw new Error('invalid exchange rates string')
    }
    rates[denom] = new Dec(amount)
  })
  return rates
}

@Injectable()
export class OracleService {
  constructor(private readonly cosmService: CosmService) {}

  async queryParams(): Promise<Params> {
    const query = await this.cosmService.getQueryClient()
    return query.oracle.params()
  }

  async feedPriceByAllValidators(rates: ExchangeRates, numValidators = 4) {
    const promises = []
    for (let i = 0; i < numValidators; i++) {
      promises.push(this.feedPriceByValidator(rates, i))
    }
    await Promise.all(promises)
  }

  async feedPriceByValidator(rates: ExchangeRates, validatorIndex: number) {
    const validator = await this.cosmService.getAccount(validatorIndex, true)
    const client = await this.cosmService.getClient(validator)

    const exchangeRates = toExchangeRatesStr(rates)
    const salt = Math.random().toString(36).substring(2, 6)
    const sourceStr = `${salt};${exchangeRates};${validator.mervaloperAddress()}`
    const hash = ethers.utils
      .hexlify(sha256(new TextEncoder().encode(sourceStr)).slice(0, 20))
      .slice(2)

    const preVoteMsg: MsgAggregateExchangeRatePrevoteEncodeObject = {
      typeUrl: typeUrls.MsgAggregateExchangeRatePrevote,
      value: {
        hash,
        feeder: validator.merAddress(),
        validator: validator.mervaloperAddress(),
      },
    }
    const voteMsg: MsgAggregateExchangeRateVoteEncodeObject = {
      typeUrl: typeUrls.MsgAggregateExchangeRateVote,
      value: {
        salt,
        exchangeRates,
        feeder: validator.merAddress(),
        validator: validator.mervaloperAddress(),
      },
    }

    let receipt = await client.signAndBroadcastBlock(validator.merAddress(), [
      preVoteMsg,
    ])
    assertIsDeliverTxSuccess(receipt)

    const preBlockHeight = receipt.height
    const params = await this.queryParams()
    const periodForPreVote = Long.fromNumber(preBlockHeight).div(
      params.votePeriod,
    )
    const periodForVote = periodForPreVote.add(1)

    const period = await this.waitUntilPeriod(
      client,
      params.votePeriod,
      periodForVote,
    )
    if (period > periodForVote) {
      console.warn(`Failed to feed price to oracle`)
      return
    }

    receipt = await client.signAndBroadcastBlock(validator.merAddress(), [
      voteMsg,
    ])
    assertIsDeliverTxSuccess(receipt)
    console.log(
      `Fed price '${exchangeRates}' by validator ${validator.mervaloperAddress()}, prevote at block height ${preBlockHeight}, vote at block height ${
        receipt.height
      }`,
    )
  }

  async waitUntilPeriod(
    client: MerlionClient,
    votePeriod: Long,
    untilPeriod: Long,
  ): Promise<Long> {
    while (true) {
      const currentPeriod = Long.fromNumber(await client.getHeight()).div(
        votePeriod,
      )
      if (currentPeriod.gte(untilPeriod)) {
        return currentPeriod
      }
      await sleep(6000)
    }
  }
}
