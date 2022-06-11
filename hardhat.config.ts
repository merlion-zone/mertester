import * as dotenv from 'dotenv'
import * as path from 'path'
import { HardhatUserConfig, task } from 'hardhat/config'
import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-etherscan'
import '@nomiclabs/hardhat-waffle'
import '@typechain/hardhat'
import 'hardhat-gas-reporter'
import 'solidity-coverage'

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

dotenv.config({
  path: path.resolve(process.cwd(), '.env.local'),
})

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task('accounts', 'Prints the list of accounts', async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners()

  for (const account of accounts) {
    console.log(account.address)
  }
})

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const config: HardhatUserConfig = {
  solidity: '0.8.4',
  defaultNetwork: 'merlionlocalnet',
  networks: {
    merlionlocalnet: {
      url: process.env.WEB3_RPC_ENDPOINT || 'http://127.0.0.1:8545',
      accounts:
        process.env.PRIVATE_KEY !== undefined
          ? [process.env.PRIVATE_KEY]
          : getAccounts().map((account) => account.privateKey),
    },
  },
}

export default config
