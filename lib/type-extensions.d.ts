import "hardhat/types/config";
import "hardhat/types/runtime";
import { Provider, ContractFactory } from "starknet";
declare type StarknetNetworkConfig = {
    network: 'mainnet-alpha' | 'goerli-alpha';
} | {
    baseUrl: string;
};
declare type StarknetNetworksConfig = {
    [id: string]: StarknetNetworkConfig;
};
declare module "hardhat/types/config" {
    interface HardhatUserConfig {
        starknetjs?: {
            networks?: StarknetNetworksConfig;
        };
    }
    interface HardhatConfig {
        starknetjs: {
            networks: StarknetNetworksConfig;
        };
    }
}
declare module "hardhat/types/runtime" {
    interface HardhatRuntimeEnvironment {
        starknetjs: {
            provider: Provider;
            getContractFactory(contractName: string): Promise<ContractFactory>;
        };
    }
}
export {};
//# sourceMappingURL=type-extensions.d.ts.map