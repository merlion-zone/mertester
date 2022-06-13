import {
  BackingRiskParams,
  BatchSetBackingRiskParamsProposal,
  BatchSetCollateralRiskParamsProposal,
  CollateralRiskParams,
  RegisterBackingProposal,
  RegisterCollateralProposal,
  SetBackingRiskParamsProposal,
  SetCollateralRiskParamsProposal,
} from '@merlionzone/merlionjs/dist/proto/merlion/maker/v1/maker'
import { decInt, E18, E6 } from '../../utils'

export const backingRiskParams: BackingRiskParams = {
  backingDenom: 'ETH',
  enabled: true,
  maxBacking: E18.mul('10000').toString(),
  maxMerMint: E6.mul('10000000').toString(),
  mintFee: decInt('0.001'),
  burnFee: decInt('0.001'),
  buybackFee: decInt('0.005'),
  rebackFee: decInt('0'),
}

export const registerBackingProposal: RegisterBackingProposal = {
  title: 'Register Backing Proposal',
  description: 'Proposal of registering a new backing asset for stablecoin',
  riskParams: backingRiskParams,
}

export const collateralRiskParams: CollateralRiskParams = {
  collateralDenom: 'ETH',
  enabled: true,
  maxCollateral: E18.mul('10000').toString(),
  maxMerMint: E6.mul('10000000').toString(),
  liquidationThreshold: decInt('0.75'),
  loanToValue: decInt('0.60'),
  basicLoanToValue: decInt('0.45'),
  catalyticLionRatio: decInt('0.03'),
  liquidationFee: decInt('0.05'),
  mintFee: decInt('0.001'),
  interestFee: decInt('0.03'),
}

export const registerCollateralProposal: RegisterCollateralProposal = {
  title: 'Register Collateral Proposal',
  description: 'Proposal of registering a new collateral asset for stablecoin',
  riskParams: collateralRiskParams,
}

export const setBackingRiskParamsProposal: SetBackingRiskParamsProposal = {
  title: 'Set Backing Params Proposal',
  description: 'Proposal of setting params of a backing pool for stablecoin',
  riskParams: backingRiskParams,
}

export const setCollateralRiskParamsProposal: SetCollateralRiskParamsProposal =
  {
    title: 'Set Collateral Params Proposal',
    description:
      'Proposal of setting params of a collateral pool for stablecoin',
    riskParams: collateralRiskParams,
  }

export const batchSetBackingRiskParamsProposal: BatchSetBackingRiskParamsProposal =
  {
    title: 'Batch-set Backing Params Proposal',
    description:
      'Proposal of setting params of several backing pools for stablecoin',
    riskParams: [backingRiskParams],
  }

export const batchSetCollateralRiskParamsProposal: BatchSetCollateralRiskParamsProposal =
  {
    title: 'Batch-set Collateral Params Proposal',
    description:
      'Proposal of setting params of several collateral pools for stablecoin',
    riskParams: [collateralRiskParams],
  }
