import { Console } from 'nestjs-console'

@Console({
  command: 'evm',
  description: 'EVM commands',
})
export class EvmCmdService {}
