import { extendConfig, extendEnvironment } from "hardhat/config";
import { Provider } from "starknet";
import "./type-extensions";
import { HardhatConfig, HardhatUserConfig } from "hardhat/types";


extendConfig((config: HardhatConfig, userConfig: Readonly<HardhatUserConfig>) => {
    config.starknet = { network: "goerli-alpha", networks: { "goerli-alpha": { network: "goerli-alpha" } } }

    if (userConfig.starknet) {
        if (userConfig.starknet.network) {
            config.starknet.network = userConfig.starknet.network;
        }
        if (userConfig.starknet.networks) {
            for (const id in userConfig.starknet.networks) {
                config.starknet.networks[id] = userConfig.starknet.networks[id];
            }
        }
    }
});

extendEnvironment((hre) => {
    const networkConfig = hre.config.starknet.networks[hre.config.starknet.network];
    hre.starknet = { provider: new Provider(networkConfig) };
});