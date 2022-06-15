import {
  RegisterTargetProposal,
  TargetParams,
  TargetSource,
} from '@merlionzone/merlionjs/dist/proto/merlion/oracle/v1/oracle'

export const targetParams: TargetParams = {
  denom: '',
  source: TargetSource.TARGET_SOURCE_VALIDATORS,
  sourceDexContract: '',
}

export const registerOracleTargetProposal: RegisterTargetProposal = {
  title: 'Register Oracle Target Proposal',
  description: 'Proposal of registering a new oracle target',
  targetParams,
}
