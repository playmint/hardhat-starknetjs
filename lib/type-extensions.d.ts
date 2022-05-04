import "hardhat/types/config";
import "hardhat/types/runtime";
import { Provider } from "starknet";
declare type StarknetNetworkConfig = {
    network: 'mainnet-alpha' | 'goerli-alpha';
} | {
    baseUrl: string;
};
declare type StarknetNetworksConfig = {
    [id: string]: StarknetNetworkConfig;
};
declare type StarknetUserConfig = {
    network?: string;
    networks?: StarknetNetworksConfig;
};
declare type StarknetConfig = {
    network: string;
    networks: StarknetNetworksConfig;
};
declare module "hardhat/types/config" {
    interface HardhatConfig {
        starknet: StarknetConfig;
    }
    interface HardhatUserConfig {
        starknet?: StarknetUserConfig;
    }
}
declare module "hardhat/types/runtime" {
    interface HardhatRuntimeEnvironment {
        starknet: {
            provider: Provider;
        };
    }
}
export {};
//# sourceMappingURL=type-extensions.d.ts.map