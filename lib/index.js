"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("hardhat/config");
const starknet_1 = require("starknet");
require("./type-extensions");
(0, config_1.extendConfig)((config, userConfig) => {
    config.starknet = { network: "goerli-alpha", networks: { "goerli-alpha": { network: "goerli-alpha" } } };
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
(0, config_1.extendEnvironment)((hre) => {
    const networkConfig = hre.config.starknet.networks[hre.config.starknet.network];
    hre.starknet = { provider: new starknet_1.Provider(networkConfig) };
});
//# sourceMappingURL=index.js.map