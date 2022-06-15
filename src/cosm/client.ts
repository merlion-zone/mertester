import { ethers } from 'ethers'
import {
  GasPrice,
  QueryClient,
  setupAuthExtension,
  setupBankExtension,
  setupDistributionExtension,
  setupGovExtension,
  setupStakingExtension,
} from '@cosmjs/stargate'
import { MerlionClient, setupOracleExtension } from '@merlionzone/merlionjs'
import { Account } from '../accounts'
import { Tendermint34Client } from '@cosmjs/tendermint-rpc'
import { DirectEthSecp256k1Wallet } from '@merlionzone/merlionjs/dist/proto-signing/directethsecp256k1wallet'

export async function getClient(
  account: Account,
  manageSequence?: boolean,
): Promise<MerlionClient> {
  const signer = await DirectEthSecp256k1Wallet.fromKey(
    ethers.utils.arrayify(account.privateKey),
    'mer',
  )
  return MerlionClient.connectWithSigner(process.env.RPC_ENDPOINT, signer, {
    gasPrice: GasPrice.fromString('1alion'),
    manageSequence,
  })
}

export async function getQueryClient() {
  const tmClient = await Tendermint34Client.connect(process.env.RPC_ENDPOINT)
  return QueryClient.withExtensions(
    tmClient,
    setupAuthExtension,
    setupBankExtension,
    setupStakingExtension,
    setupDistributionExtension,
    setupGovExtension,
    setupOracleExtension,
  )
}
