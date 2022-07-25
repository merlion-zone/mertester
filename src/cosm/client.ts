import { ethers } from 'ethers'
import {
  GasPrice,
  QueryClient,
  setupAuthExtension,
  setupBankExtension,
  setupDistributionExtension,
} from '@cosmjs/stargate'
import {
  MerlionClient,
  setupGovExtension,
  setupStakingExtension,
  setupOracleExtension,
  setupGravityExtension,
} from '@merlionzone/merlionjs'
import { Account } from '../accounts'
import { Tendermint34Client } from '@cosmjs/tendermint-rpc'
import { DirectEthSecp256k1Wallet } from '@merlionzone/merlionjs'

export async function getClient(
  account: Account,
  isBridgingNet?: boolean,
  manageSequence?: boolean,
): Promise<MerlionClient> {
  const signer = await DirectEthSecp256k1Wallet.fromKey(
    ethers.utils.arrayify(account.privateKey),
    'mer',
  )
  const endpoint = !isBridgingNet
    ? process.env.RPC_ENDPOINT
    : process.env.BRIDGING_RPC_ENDPOINT
  return MerlionClient.connectWithSigner(endpoint, signer, {
    gasPrice: GasPrice.fromString('1alion'),
    manageSequence,
  })
}

export async function getQueryClient(isBridgingNet?: boolean) {
  const endpoint = !isBridgingNet
    ? process.env.RPC_ENDPOINT
    : process.env.BRIDGING_RPC_ENDPOINT
  const tmClient = await Tendermint34Client.connect(endpoint)
  return QueryClient.withExtensions(
    tmClient,
    setupAuthExtension,
    setupBankExtension,
    setupStakingExtension,
    setupDistributionExtension,
    setupGovExtension,
    setupOracleExtension,
    setupGravityExtension,
  )
}
