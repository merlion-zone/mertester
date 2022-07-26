import { Command, Console } from 'nestjs-console'
import { CosmGravityService } from './gravity.service'

@Console({
  command: 'cosm',
  description: 'Cosm commands',
})
export class CosmCmdService {
  constructor(private readonly gravityService: CosmGravityService) {}

  @Command({
    command: 'gravity-info <chainIdentifier>',
    description: 'Show gravity info',
    options: [],
  })
  async gravityInfo(chainIdentifier: string) {
    await this.gravityService.info(chainIdentifier)
  }

  @Command({
    command: 'gravity-token <chainIdentifier> <token>',
    description: 'Show gravity token',
    options: [],
  })
  async gravityToken(chainIdentifier: string, token: string) {
    await this.gravityService.showToken(chainIdentifier, token)
  }
}
