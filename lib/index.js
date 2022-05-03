"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("hardhat/config");
const starknet_1 = require("starknet");
require("./type-extensions");
(0, config_1.extendEnvironment)((hre) => {
    hre.starknet = { provider: starknet_1.defaultProvider };
});
//# sourceMappingURL=index.js.map