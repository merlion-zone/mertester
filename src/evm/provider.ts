import { ethers } from 'ethers'
import { getNetwork, Network } from '@ethersproject/networks'
import { ConnectionInfo } from '@ethersproject/web'
import { Logger } from '@ethersproject/logger'
import {
  JsonRpcProvider,
  WebSocketProvider,
  FallbackProvider,
  BaseProvider,
} from '@ethersproject/providers'
import { Networkish } from '@ethersproject/networks/src.ts/types'

const version = 'providers/5.4.5'
const logger = new Logger(version)

const defaultApiKey = '_gg7wSSi0KMBsdKnGVfHDueq6xMB9EkC'

export class AlchemyProvider extends ethers.providers.AlchemyProvider {
  static getNetwork(network: Networkish): Network {
    return getNet(network == null ? 'homestead' : network)
  }

  static getUrl(network: Network, apiKey: string): ConnectionInfo {
    let host = null
    switch (network.name) {
      case 'homestead':
        host = 'eth-mainnet.alchemyapi.io/v2/'
        break
      case 'ropsten':
        host = 'eth-ropsten.alchemyapi.io/v2/'
        break
      case 'rinkeby':
        host = 'eth-rinkeby.alchemyapi.io/v2/'
        break
      case 'goerli':
        host = 'eth-goerli.alchemyapi.io/v2/'
        break
      case 'kovan':
        host = 'eth-kovan.alchemyapi.io/v2/'
        break
      case 'matic':
        host = 'polygon-mainnet.g.alchemy.com/v2/'
        break
      case 'maticmum':
        host = 'polygon-mumbai.g.alchemy.com/v2/'
        break
      case 'optimism':
        host = 'opt-mainnet.g.alchemy.com/v2/'
        break
      case 'optimism-kovan':
        host = 'opt-kovan.g.alchemy.com/v2/'
        break
      case 'arbitrum':
        host = 'arb-mainnet.g.alchemy.com/v2/'
        break
      case 'arbitrum-rinkeby':
        host = 'arb-rinkeby.g.alchemy.com/v2/'
        break
      default:
        logger.throwArgumentError('unsupported network', 'network', network)
    }

    return {
      allowGzip: true,
      url: 'https:/' + '/' + host + apiKey,
      throttleCallback: (attempt: number, url: string) => {
        if (apiKey === defaultApiKey) {
          ethers.providers.showThrottleMessage()
        }
        return Promise.resolve(true)
      },
    }
  }
}

const defaultProjectId = '84842078b09946638c03157f83405213'

export class InfuraProvider extends ethers.providers.InfuraProvider {
  static getNetwork(network: Networkish): Network {
    return getNet(network == null ? 'homestead' : network)
  }

  static getUrl(network: Network, apiKey: any): ConnectionInfo {
    let host: string = null
    switch (network ? network.name : 'unknown') {
      case 'homestead':
        host = 'mainnet.infura.io'
        break
      case 'ropsten':
        host = 'ropsten.infura.io'
        break
      case 'rinkeby':
        host = 'rinkeby.infura.io'
        break
      case 'kovan':
        host = 'kovan.infura.io'
        break
      case 'goerli':
        host = 'goerli.infura.io'
        break
      case 'matic':
        host = 'polygon-mainnet.infura.io'
        break
      case 'maticmum':
        host = 'polygon-mumbai.infura.io'
        break
      case 'optimism':
        host = 'optimism-mainnet.infura.io'
        break
      case 'optimism-kovan':
        host = 'optimism-kovan.infura.io'
        break
      case 'arbitrum':
        host = 'arbitrum-mainnet.infura.io'
        break
      case 'arbitrum-rinkeby':
        host = 'arbitrum-rinkeby.infura.io'
        break
      default:
        logger.throwError(
          'unsupported network',
          Logger.errors.INVALID_ARGUMENT,
          {
            argument: 'network',
            value: network,
          },
        )
    }

    const connection: ConnectionInfo = {
      allowGzip: true,
      url: 'https:/' + '/' + host + '/v3/' + apiKey.projectId,
      throttleCallback: (attempt: number, url: string) => {
        if (apiKey.projectId === defaultProjectId) {
          ethers.providers.showThrottleMessage()
        }
        return Promise.resolve(true)
      },
    }

    if (apiKey.projectSecret != null) {
      connection.user = ''
      connection.password = apiKey.projectSecret
    }

    return connection
  }
}

function getNet(network: Networkish): Network {
  if (typeof network === 'string') {
    switch (network) {
      case 'optimism':
        network = {
          chainId: 10,
          name: 'optimism',
          _defaultProvider: ethDefaultProvider('optimism'),
        }
        break
      case 'optimism-kovan':
        network = {
          chainId: 69,
          name: 'optimism-kovan',
          _defaultProvider: ethDefaultProvider('optimism-kovan'),
        }
        break
      case 'arbitrum':
        network = {
          chainId: 42161,
          name: 'arbitrum',
          _defaultProvider: ethDefaultProvider('arbitrum'),
        }
        break
      case 'arbitrum-rinkeby':
        network = {
          chainId: 421611,
          name: 'arbitrum-rinkeby',
          _defaultProvider: ethDefaultProvider('arbitrum-rinkeby'),
        }
        break
      case 'matic':
        network = {
          chainId: 137,
          name: 'matic',
          _defaultProvider: ethDefaultProvider('matic'),
        }
        break
      default:
        break
    }
  }

  return getNetwork(network)
}

export function getDefaultProvider(
  network?: Network | string,
  options?: any,
): BaseProvider {
  if (network == null) {
    network = 'homestead'
  }

  // If passed a URL, figure out the right type of provider based on the scheme
  if (typeof network === 'string' && options.url) {
    // Handle http and ws (and their secure variants)
    const match = options.url.match(/^(ws|http)s?:/i)
    if (match) {
      switch (match[1]) {
        case 'http':
          return new JsonRpcProvider(options.url)
        case 'ws':
          return new WebSocketProvider(options.url)
        default:
          logger.throwArgumentError(
            'unsupported URL scheme',
            'network',
            options.url,
          )
      }
    }
  }

  const n = getNet(network)
  if (!n || !n._defaultProvider) {
    logger.throwError(
      'unsupported getDefaultProvider network',
      Logger.errors.NETWORK_ERROR,
      {
        operation: 'getDefaultProvider',
        network: network,
      },
    )
  }

  return n._defaultProvider(
    {
      FallbackProvider,
      AlchemyProvider,
      InfuraProvider,
    },
    options,
  )
}

type DefaultProviderFunc = (providers: any, options?: any) => any

interface Renetworkable extends DefaultProviderFunc {
  renetwork: (network: Network) => DefaultProviderFunc
}

function ethDefaultProvider(network: string | Network): Renetworkable {
  const func = function (providers: any, options?: any): any {
    if (options == null) {
      options = {}
    }
    const providerList: Array<any> = []

    if (providers.InfuraProvider) {
      try {
        providerList.push(new providers.InfuraProvider(network, options.infura))
      } catch (error) {
        console.error(`Build InfuraProvider: ${error}`)
      }
    }

    if (providers.EtherscanProvider) {
      try {
        providerList.push(
          new providers.EtherscanProvider(network, options.etherscan),
        )
      } catch (error) {}
    }

    if (providers.AlchemyProvider) {
      try {
        providerList.push(
          new providers.AlchemyProvider(network, options.alchemy),
        )
      } catch (error) {
        console.error(`Build AlchemyProvider: ${error}`)
      }
    }

    if (providers.PocketProvider) {
      // These networks are currently faulty on Pocket as their
      // network does not handle the Berlin hardfork, which is
      // live on these ones.
      // @TODO: This goes away once Pocket has upgraded their nodes
      const skip = ['goerli', 'ropsten', 'rinkeby']
      try {
        const provider = new providers.PocketProvider(network)
        if (provider.network && skip.indexOf(provider.network.name) === -1) {
          providerList.push(provider)
        }
      } catch (error) {}
    }

    if (providers.CloudflareProvider) {
      try {
        providerList.push(new providers.CloudflareProvider(network))
      } catch (error) {}
    }

    if (providerList.length === 0) {
      return null
    }

    if (providers.FallbackProvider) {
      let quorum = 1
      if (options.quorum != null) {
        quorum = options.quorum
      } else if (network === 'homestead') {
        quorum = 2
      }
      return new providers.FallbackProvider(providerList, quorum)
    }

    return providerList[0]
  }

  func.renetwork = function (network: Network) {
    return ethDefaultProvider(network)
  }

  return func
}
