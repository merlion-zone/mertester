import { Injectable } from '@nestjs/common'
import { MerlionClient, Coin } from '@merlionzone/merlionjs'
import { getClient, getQueryClient } from './client'
import { Account, getAccounts, getValidatorAccounts } from '../accounts'
import { assertIsDeliverTxSuccess } from '@cosmjs/stargate'

@Injectable()
export class CosmService {
  private clients: Map<string, MerlionClient> = new Map()

  async getAccount(index: number, isValidator = false): Promise<Account> {
    const accounts = !isValidator
      ? getAccounts()
      : getValidatorAccounts(index + 1)
    return accounts[index]
  }

  async getClient(
    account: Account,
    manageSequence = true,
  ): Promise<MerlionClient> {
    let clientCached = this.clients.get(account.merAddress())
    if (clientCached) {
      return clientCached
    }
    const client = await getClient(account, manageSequence)
    // Get cached again
    clientCached = this.clients.get(account.merAddress())
    if (clientCached) {
      return clientCached
    }
    this.clients.set(account.merAddress(), client)
    return client
  }

  async getQueryClient() {
    return getQueryClient()
  }

  async transfer(opts: { from: Account; to: Account; amount: string }) {
    const amount = Coin.fromString(opts.amount)
    const client = await this.getClient(opts.from)
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
