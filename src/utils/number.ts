import { BigNumber } from 'ethers'
import { Dec } from '@merlionzone/merlionjs'
import { TextEncoder } from 'util'

export const E18 = BigNumber.from(10).pow(18)
export const E10 = BigNumber.from(10).pow(10)
export const E9 = BigNumber.from(10).pow(9)
export const E8 = BigNumber.from(10).pow(8)
export const E7 = BigNumber.from(10).pow(7)
export const E6 = BigNumber.from(10).pow(6)
export const E5 = BigNumber.from(10).pow(5)
export const E4 = BigNumber.from(10).pow(4)
export const E3 = BigNumber.from(10).pow(3)
export const E2 = BigNumber.from(10).pow(2)
export const E1 = BigNumber.from(10).pow(1)

export function decInt(d: number | string): string {
  return new Dec(d).mul(E18.toString()).toInt().toString()
}

export function decUint8Array(d: number | string): Uint8Array {
  return new TextEncoder().encode(decInt(d))
}
