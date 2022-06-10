export function sleep(milliSeconds) {
  return new Promise((resolve) => setTimeout(resolve, milliSeconds))
}

const txInterval = 50

export function sleepForTx() {
  return sleep(txInterval)
}
