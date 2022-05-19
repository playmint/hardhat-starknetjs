import "hardhat/types/config";
import "hardhat/types/runtime";
import { Provider, ContractFactory, Account, Abi, CompiledContract, Contract, KeyPair, SignerInterface } from "starknet";
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
            networkId: string;
            provider: Provider;
            getContractFactory(contractName: string, providerOrAccount?: Provider | Account | undefined, abi?: Abi | undefined): Promise<ContractFactory>;
            getContractFactoryFromArtifact(artifact: CompiledContract, providerOrAccount?: Provider | Account | undefined, abi?: Abi | undefined): ContractFactory;
            getContractAt(contractName: string, address: string, providerOrAccount?: Provider | Account | undefined, abi?: Abi | undefined): Promise<Contract>;
            getContractAtFromArtifact(artifact: CompiledContract, address: string, providerOrAccount?: Provider | Account | undefined, abi?: Abi | undefined): Contract;
            getAccount(address: string, keyPairOrSigner: KeyPair | SignerInterface, provider?: Provider): Account;
            readArtifact(searchPath: string): Promise<CompiledContract | null>;
        };
    }
}
export {};
//# sourceMappingURL=type-extensions.d.ts.map