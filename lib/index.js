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
    // TODO set selected network with arg or env var or hardhat config ts
    const network = process.env.STARKNETJS_NETWORK || "goerli-alpha";
    const networkConfig = hre.config.starknetjs.networks[network];
    if (networkConfig === undefined) {
        throw `network '${network}' not defined in config`; // TODO plugin error
    }
    hre.starknetjs = {
        provider: new starknet_1.Provider(networkConfig),
        getContractFactory: getContractFactory.bind(null, hre),
        getContractFactoryFromArtifact: getContractFactoryFromArtifact.bind(null, hre),
        getContractAt: getContractAt.bind(null, hre),
        getContractAtFromArtifact: getContractAtFromArtifact.bind(null, hre),
        readArtifact: readArtifact
    };
});
async function getContractFactory(hre, contractName, providerOrAccount, abi) {
    const artifact = await readArtifact(contractName);
    if (artifact) {
        return getContractFactoryFromArtifact(hre, artifact, providerOrAccount, abi);
    }
    throw `couldn't find artifact for '${contractName}'`; // TODO make this a plugin exception or whatever
}
function getContractFactoryFromArtifact(hre, artifact, providerOrAccount, abi) {
    return new starknet_1.ContractFactory(artifact, providerOrAccount || hre.starknetjs.provider, abi);
}
async function getContractAt(hre, contractName, address, providerOrAccount, abi) {
    const artifact = await readArtifact(contractName);
    if (artifact) {
        return getContractAtFromArtifact(hre, artifact, address, providerOrAccount, abi);
    }
    throw `couldn't find artifact for '${contractName}'`; // TODO make this a plugin exception or whatever
}
function getContractAtFromArtifact(hre, artifact, address, providerOrAccount, abi) {
    return new starknet_1.Contract(abi ? abi : artifact.abi, address, providerOrAccount || hre.starknetjs.provider);
}
function searchArtifacts(artifacts, searchPath) {
    const candidates = artifacts.filter((artifact) => {
        return artifact.endsWith(searchPath);
    });
    if (candidates.length > 1) {
        throw `'${searchPath}' is ambiguous, could be:\n${candidates.join("\n")}`; // TODO make thsia plugin exception or whatever
    }
    if (candidates.length == 1) {
        return candidates[0];
    }
    return null;
}
async function readArtifact(contractName) {
    // TODO cache allArtifacts so we don't scan the dir every time you want an artifact
    const allArtifacts = await getFilesInDirRecursively("artifacts-starknet"); // TODO read from config
    const cairoFilename = contractName.endsWith(".cairo") ? contractName : `${contractName}.cairo`;
    const jsonFilename = `${cairoFilename.substring(0, cairoFilename.length - 6)}.json`;
    // first try path/file.cairo/file.json
    let artifact = searchArtifacts(allArtifacts, `${cairoFilename}/${path_1.default.basename(jsonFilename)}`);
    // then try path/file.json
    if (!artifact) {
        artifact = searchArtifacts(allArtifacts, jsonFilename);
    }
    if (artifact) {
        return new Promise((resolve, reject) => {
            fs_1.default.readFile(artifact, (err, data) => {
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
//# sourceMappingURL=index.js.map