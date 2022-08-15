#!/usr/bin/env bash

set -o errexit
set -o pipefail
set -o nounset
set -o xtrace

__dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
__file="${__dir}/$(basename "${BASH_SOURCE[0]}")"
__root="$(cd "$(dirname "${__dir}")" && pwd)"

ABI_DIR=src/evm/abi
OPENZEPPELIN_ABI=${ABI_DIR}/openzeppelin
UNISWAP_V2_ABI=${ABI_DIR}/uniswap-v2
UNISWAP_V3_ABI=${ABI_DIR}/uniswap-v3
mkdir -p ${OPENZEPPELIN_ABI} ${UNISWAP_V2_ABI} ${UNISWAP_V3_ABI}

OPENZEPPELIN_CONTRACTS=node_modules/@openzeppelin/contracts/build/contracts
cp ${OPENZEPPELIN_CONTRACTS}/ERC20.json ${OPENZEPPELIN_ABI}/ERC20.json
cp ${OPENZEPPELIN_CONTRACTS}/ERC20Permit.json ${OPENZEPPELIN_ABI}/ERC20Permit.json

UNISWAP_V2_CORE_CONTRACTS=node_modules/@uniswap/v2-core/build
cp ${UNISWAP_V2_CORE_CONTRACTS}/UniswapV2Factory.json ${UNISWAP_V2_ABI}/UniswapV2Factory.json
cp ${UNISWAP_V2_CORE_CONTRACTS}/UniswapV2Pair.json ${UNISWAP_V2_ABI}/UniswapV2Pair.json

UNISWAP_V2_PERIPHERY_CONTRACTS=node_modules/@uniswap/v2-periphery/build
cp ${UNISWAP_V2_PERIPHERY_CONTRACTS}/UniswapV2Router02.json ${UNISWAP_V2_ABI}/UniswapV2Router02.json

UNISWAP_V3_CORE_CONTRACTS=node_modules/@uniswap/v3-core/artifacts/contracts
cp ${UNISWAP_V3_CORE_CONTRACTS}/UniswapV3Factory.sol/UniswapV3Factory.json ${UNISWAP_V3_ABI}/UniswapV3Factory.json
cp ${UNISWAP_V3_CORE_CONTRACTS}/UniswapV3Pool.sol/UniswapV3Pool.json ${UNISWAP_V3_ABI}/UniswapV3Pool.json

UNISWAP_V3_PERIPHERY_CONTRACTS=node_modules/@uniswap/v3-periphery/artifacts/contracts
cp ${UNISWAP_V3_PERIPHERY_CONTRACTS}/lens/Quoter.sol/Quoter.json ${UNISWAP_V3_ABI}/UniswapV3Quoter.json
cp ${UNISWAP_V3_PERIPHERY_CONTRACTS}/SwapRouter.sol/SwapRouter.json ${UNISWAP_V3_ABI}/UniswapV3SwapRouter.json

typechain --target ethers-v5 --out-dir src/evm/abi/ src/evm/abi/*/*.json
