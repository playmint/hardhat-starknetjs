"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("hardhat/config");
const starknet_1 = require("starknet");
require("./type-extensions");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
(0, config_1.extendConfig)((config, userConfig) => {
    config.starknetjs = { networks: { "goerli-alpha": { network: "goerli-alpha" } } }; // TODO add mainnet to here
    if (userConfig.starknetjs && userConfig.starknetjs.networks) {
        for (const networkId in userConfig.starknetjs.networks) {
            config.starknetjs.networks[networkId] = userConfig.starknetjs.networks[networkId];
        }
    }
});
(0, config_1.extendEnvironment)((hre) => {
    const network = "goerli-alpha";
    // TODO set selected network with arg or env var or hardhat config ts
    const networkConfig = hre.config.starknetjs.networks[network];
    hre.starknetjs = {
        provider: new starknet_1.Provider(networkConfig),
        getContractFactory: async (contractName) => {
            const cairoFilename = contractName.endsWith(".cairo") ? contractName : `${contractName}.cairo`;
            const jsonFilename = `${cairoFilename.substring(0, cairoFilename.length - 6)}.json`;
            // first try path/file.cairo/file.json
            let artifact = await readArtifact(`${cairoFilename}/${path_1.default.basename(jsonFilename)}`);
            if (artifact) {
                return new starknet_1.ContractFactory(artifact);
            }
            // then try path/file.json
            artifact = await readArtifact(jsonFilename);
            if (artifact) {
                return new starknet_1.ContractFactory(artifact);
            }
            throw `couldn't find artifact for '${contractName}'`; // TODO make this a plugin exception or whatever
        }
    };
});
async function getFilesInDirRecursively(dir) {
    return new Promise((resolve, reject) => {
        fs_1.default.readdir(dir, { withFileTypes: true }, async (err, files) => {
            if (err) {
                reject(err);
            }
            let paths = [];
            let promises = [];
            for (const file of files) {
                const path = `${dir}/${file.name}`;
                if (file.isDirectory()) {
                    promises.push(getFilesInDirRecursively(path));
                }
                else {
                    paths.push(path);
                }
            }
            resolve(paths.concat(...await Promise.all(promises)));
        });
    });
}
async function readArtifact(searchPath) {
    const allArtifacts = await getFilesInDirRecursively("artifacts-starknet"); // TODO read from config
    const candidates = allArtifacts.filter((artifact) => {
        return artifact.endsWith(searchPath);
    });
    if (candidates.length > 1) {
        throw `'${searchPath}' is ambiguous, could be:\n${candidates.join("\n")}`; // TODO make thsia plugin exception or whatever
    }
    if (candidates.length > 0) {
        return new Promise((resolve, reject) => {
            fs_1.default.readFile(candidates[0], (err, data) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(JSON.parse(data.toString()));
                }
            });
        });
    }
    return null;
}
//# sourceMappingURL=index.js.map