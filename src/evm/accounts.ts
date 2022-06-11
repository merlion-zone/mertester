import * as _ from 'lodash'
import { defaultHardhatNetworkHdAccountsConfigParams } from 'hardhat/internal/core/config/default-config'
import { ethers } from 'ethers'

export function getAccounts(): ethers.utils.HDNode[] {
  const params = _.cloneDeep(defaultHardhatNetworkHdAccountsConfigParams)
  const hdWallet = ethers.utils.HDNode.fromMnemonic(
    params.mnemonic,
    params.passphrase || undefined,
  )
  if (!params.path.endsWith('/')) {
    params.path += '/'
  }
  const accounts = []
  for (let i = 0; i < params.count; i++) {
    const index = params.initialIndex + i
    const account = hdWallet.derivePath(params.path + index.toString())
    accounts.push(account)
  }
  return accounts
}
