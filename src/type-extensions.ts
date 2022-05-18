import "hardhat/types/config"
import "hardhat/types/runtime";
import { Provider, ContractFactory } from "starknet";


type StarknetNetworkConfig = {
    network: 'mainnet-alpha' | 'goerli-alpha';
} | {
    baseUrl: string;
};

type StarknetNetworksConfig = {
    [id: string]: StarknetNetworkConfig
};

declare module "hardhat/types/config" {
    export interface HardhatUserConfig {
        starknetjs?: {
            networks?: StarknetNetworksConfig;
        }
    }

    export interface HardhatConfig {
        starknetjs: {
            networks: StarknetNetworksConfig;
        }
    }
}

declare module "hardhat/types/runtime"
{
    interface HardhatRuntimeEnvironment {
        starknetjs: {
            provider: Provider;
            getContractFactory(contractName: string): Promise<ContractFactory>;
        }
    }
}