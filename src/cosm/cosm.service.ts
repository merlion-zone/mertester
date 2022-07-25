import { Injectable } from '@nestjs/common'
import { MerlionClient, Coin } from '@merlionzone/merlionjs'
import { getClient, getQueryClient } from './client'
import { Account, getAccounts, getValidatorAccounts } from '../accounts'
import { assertIsDeliverTxSuccess } from '@cosmjs/stargate'

@Injectable()
export class CosmService {
  async getAccount(index: number, isValidator = false): Promise<Account> {
    const accounts = !isValidator
      ? getAccounts()
      : getValidatorAccounts(index + 1)
    return accounts[index]
  }

  async getClient(
    account: Account,
    isBridgingNet = false,
    manageSequence = false,
  ): Promise<MerlionClient> {
    return await getClient(account, isBridgingNet, manageSequence)
  }

  async getQueryClient(isBridgingNet = false) {
    return getQueryClient(isBridgingNet)
  }

  async transfer(opts: {
    from: Account
    to: Account
    amount: string
    isBridgingNet?: boolean
  }) {
    const amount = Coin.fromString(opts.amount)
    const client = await this.getClient(opts.from, opts.isBridgingNet)
    const receipt = await client.sendTokens(
      opts.from.merAddress(),
      opts.to.merAddress(),
      [amount.toProto()],
    )
    assertIsDeliverTxSuccess(receipt)
    console.log(
      `Transferred ${amount} from ${opts.from.merAddress()} to ${opts.to.merAddress()}, txHash ${
        receipt.transactionHash
      }`,
    )
  }
}
