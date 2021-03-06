import * as _ from 'lodash'
import { defaultHardhatNetworkHdAccountsConfigParams } from 'hardhat/internal/core/config/default-config'
import { ethers } from 'ethers'
import { entropyToMnemonic } from '@ethersproject/hdnode'
import { Address } from '@merlionzone/merlionjs'
import { ExternallyOwnedAccount } from '@ethersproject/abstract-signer'

export interface Account extends ExternallyOwnedAccount {
  ethAddress(): string

  merAddress(): string

  mervaloperAddress(): string
}

const accountFunctions = {
  ethAddress: function () {
    return new Address(this.address).eth()
  },

  merAddress: function () {
    return new Address(this.address).mer()
  },

  mervaloperAddress: function () {
    return new Address(this.address).mervaloper()
  },
}

export function getAccounts(): Account[] {
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
    accounts.push(Object.assign({}, account, accountFunctions))
  }
  return accounts
}

function getEntropy(index: number, forBridging = false) {
  if (index > 255) {
    throw new Error('Byte value overflow')
  }
  const entropy = ethers.utils.zeroPad([], 16)
  entropy.fill(index, -1)
  if (forBridging) {
    // for validator bridging account
    entropy.fill(1, -2, -1)
  }
  return entropy
}

export function getValidatorAccounts(
  num: number,
  forBridging = false,
): Account[] {
  const accounts = []
  for (let i = 0; i < num; i++) {
    const mnemonic = entropyToMnemonic(getEntropy(i, forBridging))
    const hdWallet = ethers.utils.HDNode.fromMnemonic(mnemonic)
    const account = hdWallet.derivePath("m/44'/60'/0'/0/0")
    accounts.push(Object.assign({}, account, accountFunctions))
  }
  return accounts
}
