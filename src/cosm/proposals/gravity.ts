import { proto, Coin } from '@merlionzone/merlionjs'
import Long from 'long'
import { decUint8Array } from '../../utils'

export const evmChainParams: proto.gravityGenesis.Params = {
  gravityId: 'evm-testnet-1', // must be unique across all the bridging chains
  contractSourceHash: '',
  bridgeEthereumAddress: '0x0000000000000000000000000000000000000000', // included in some events
  bridgeChainId: Long.fromNumber(1), // included in some events
  signedValsetsWindow: Long.fromNumber(10000),
  signedBatchesWindow: Long.fromNumber(10000),
  signedLogicCallsWindow: Long.fromNumber(10000),
  targetBatchTimeout: Long.fromNumber(43200000),
  averageBlockTime: Long.fromNumber(5000),
  averageEthereumBlockTime: Long.fromNumber(5000),
  slashFractionValset: decUint8Array(0.001),
  slashFractionBatch: decUint8Array(0.001),
  slashFractionLogicCall: decUint8Array(0.001),
  unbondSlashingValsetsWindow: Long.fromNumber(10000),
  slashFractionBadEthSignature: decUint8Array(0.001),
  valsetReward: new Coin('', 0).toProto(),
  bridgeActive: true,
  ethereumBlacklist: [],
}

export const updateEvmChainParamsProposal: proto.mgravityTypes.UpdateChainParamsProposal =
  {
    title: 'Update EVM Chain Bridging Params Proposal',
    description: 'Proposal of updating EVM chain bridging params',
    chainIdentifier: 'evm-testnet-1',
    params: evmChainParams,
  }
