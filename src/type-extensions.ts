import "hardhat/types/config"
import "hardhat/types/runtime";
import { Provider, ContractFactory, Account, Abi, CompiledContract, Contract } from "starknet";


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
{// TODO accounts
    interface HardhatRuntimeEnvironment {
        starknetjs: {
            networkId: string;
            provider: Provider;

            getContractFactory(
                contractName: string,
                providerOrAccount?: Provider | Account | undefined,
                abi?: Abi | undefined): Promise<ContractFactory>;

            getContractFactoryFromArtifact(
                artifact: CompiledContract,
                providerOrAccount?: Provider | Account | undefined,
                abi?: Abi | undefined): ContractFactory;

            getContractAt(
                contractName: string,
                address: string,
                providerOrAccount?: Provider | Account | undefined,
                abi?: Abi | undefined): Promise<Contract>;

            getContractAtFromArtifact(
                artifact: CompiledContract,
                address: string,
                providerOrAccount?: Provider | Account | undefined,
                abi?: Abi | undefined): Contract;

            readArtifact(searchPath: string): Promise<CompiledContract | null>;
        }
    }
}