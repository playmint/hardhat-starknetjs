import "hardhat/types/config"
import "hardhat/types/runtime";
import { Provider } from "starknet";


type StarknetNetworkConfig = {
    network: 'mainnet-alpha' | 'goerli-alpha';
} | {
    baseUrl: string;
};

type StarknetNetworksConfig = {
    [id: string]: StarknetNetworkConfig
};

type StarknetUserConfig = {
    network?: string;
    networks?: StarknetNetworksConfig
};

type StarknetConfig = {
    network: string;
    networks: StarknetNetworksConfig;
}

declare module "hardhat/types/config" {
    export interface HardhatConfig {
        starknet: StarknetConfig;
    }

    export interface HardhatUserConfig {
        starknet?: StarknetUserConfig;
    }
}

declare module "hardhat/types/runtime"
{
    interface HardhatRuntimeEnvironment {
        starknet: { provider: Provider };

        getContractFactory(contractName: string): void;
    }
}