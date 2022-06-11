import { Console, Command } from 'nestjs-console'
import { Address } from '@merlionzone/merlionjs'
import { getAccounts } from './evm/accounts'

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
    ],
  })
  async accounts(opts: { showPrivKey: boolean }): Promise<void> {
    const accounts = getAccounts()
    for (const account of accounts) {
      const addr = new Address(account.address)
      console.log(
        `Index ${account.index}, evm address ${
          account.address
        }, cosmos address ${addr.mer()}`,
      )
      if (opts.showPrivKey) {
        console.log(`    private key: ${account.privateKey}`)
      }
    }
  }
}
