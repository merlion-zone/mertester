import { Console } from 'nestjs-console'

@Console({
  command: 'cosm',
  description: 'Cosm commands',
})
export class CosmCmdService {}
