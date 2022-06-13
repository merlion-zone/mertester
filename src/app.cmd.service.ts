import { Console, Command } from 'nestjs-console'
import { Address } from '@merlionzone/merlionjs'
import { getAccounts, getValidatorAccounts } from './accounts'

@Console()
export class AppCmdService {
  @Command({
    command: 'accounts',
    description: 'List accounts used by mertester',
    options: [
      {
        flags: '--showPrivKey',
        defaultValue: false,
      },
      {
        flags: '--showValidatorAccounts',
        defaultValue: false,
      },
      {
        flags: '--validatorNum <validatorNum>',
        defaultValue: 4,
      },
    ],
  })
  async accounts(opts: {
    showPrivKey: boolean
    showValidatorAccounts: boolean
    validatorNum: number
  }): Promise<void> {
    console.log('User accounts:')
    const accounts = getAccounts()
    for (let i = 0; i < accounts.length; i++) {
      const account = accounts[i]
      const addr = new Address(account.address)
      console.log(
        `Index ${i}, evm address ${
          account.address
        }, cosmos address ${addr.mer()}`,
      )
      if (opts.showPrivKey) {
        console.log(`    private key: ${account.privateKey}`)
      }
    }

    if (!opts.showValidatorAccounts) {
      return
    }

    console.log('\nValidator accounts:')
    const validatorAccounts = getValidatorAccounts(opts.validatorNum)
    for (let i = 0; i < opts.validatorNum; i++) {
      const account = validatorAccounts[i]
      const addr = new Address(account.address)
      console.log(
        `Validator ${i}, evm address ${
          account.address
        }, cosmos address ${addr.mer()}, operator address ${addr.bech32(
          'mervaloper',
        )}`,
      )
      if (opts.showPrivKey) {
        console.log(`    private key: ${account.privateKey}`)
      }
    }
  }
}
