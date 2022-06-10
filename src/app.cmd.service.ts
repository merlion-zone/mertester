import { Console, Command } from 'nestjs-console'

@Console()
export class AppCmdService {
  @Command({
    command: 'hello',
    description: 'Say hello',
  })
  async hello(): Promise<void> {
    console.log('Hello!')
  }
}
