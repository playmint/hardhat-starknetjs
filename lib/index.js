"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("hardhat/config");
const starknet_1 = require("starknet");
require("./type-extensions");
const plugins_1 = require("hardhat/plugins");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
(0, config_1.extendConfig)((config, userConfig) => {
    config.paths.starknetArtifacts = userConfig.paths?.starknetArtifacts || "artifacts-starknet";
    config.starknetjs = {
        networks: {
            "goerli-alpha": { network: "goerli-alpha" },
            "mainnet-alpha": { network: "mainnet-alpha" }
        }
    };
    if (userConfig.starknetjs?.networks) {
        for (const networkId in userConfig.starknetjs.networks) {
            config.starknetjs.networks[networkId] = userConfig.starknetjs.networks[networkId];
        }
    }
});
(0, config_1.extendEnvironment)((hre) => {
    const networkId = process.env.STARKNETJS_NETWORK || "goerli-alpha";
    const network = hre.config.starknetjs.networks[networkId];
    if (network === undefined) {
        throw new plugins_1.HardhatPluginError("hardhat-starknetjs", `network '${networkId}' not defined in config`);
    }
    hre.starknetjs = {
        networkId: networkId,
        provider: new starknet_1.Provider(network),
        getContractFactory: getContractFactory.bind(null, hre),
        getContractFactoryFromArtifact: getContractFactoryFromArtifact.bind(null, hre),
        getContractAt: getContractAt.bind(null, hre),
        getContractAtFromArtifact: getContractAtFromArtifact.bind(null, hre),
        getAccount: getAccount.bind(null, hre),
        readArtifact: readArtifact.bind(null, hre)
    };
});
async function getContractFactory(hre, contractName, providerOrAccount, abi) {
    const artifact = await readArtifact(hre, contractName);
    return getContractFactoryFromArtifact(hre, artifact, providerOrAccount, abi);
}
function getContractFactoryFromArtifact(hre, artifact, providerOrAccount, abi) {
    return new starknet_1.ContractFactory(artifact, providerOrAccount || hre.starknetjs.provider, abi);
}
async function getContractAt(hre, contractName, address, providerOrAccount, abi) {
    const artifact = await readArtifact(hre, contractName);
    return getContractAtFromArtifact(hre, artifact, address, providerOrAccount, abi);
}
function getContractAtFromArtifact(hre, artifact, address, providerOrAccount, abi) {
    return new starknet_1.Contract(abi ? abi : artifact.abi, address, providerOrAccount || hre.starknetjs.provider);
}
function searchArtifacts(artifacts, searchPath) {
    const candidates = artifacts.filter((artifact) => {
        return artifact.endsWith(searchPath);
    });
    if (candidates.length > 1) {
        throw new plugins_1.HardhatPluginError("hardhat-starknetjs", `'${searchPath}' is ambiguous, could be:\n${candidates.join("\n")}`);
    }
    if (candidates.length == 1) {
        return candidates[0];
    }
    return null;
}
function getAccount(hre, address, keyPairOrSigner, provider) {
    return new starknet_1.Account(provider || hre.starknetjs.provider, address, keyPairOrSigner);
}
let artifactsCache;
async function readArtifact(hre, contractName) {
    if (artifactsCache === undefined) {
        artifactsCache = await getFilesInDirRecursively(hre.config.paths.starknetArtifacts);
    }
    let searchPaths = [];
    if (contractName.endsWith(".json")) // already full path to json file
     {
        searchPaths.push(contractName);
    }
    else {
        // attempt to look in path/contractName.cairo/contractName.json
        const cairoFilename = contractName.endsWith(".cairo") ? contractName : `${contractName}.cairo`;
        // if that fails we just try path/contractName.json
        const jsonFilename = `${cairoFilename.substring(0, cairoFilename.length - 6)}.json`;
        searchPaths.push(`${cairoFilename}/${path_1.default.basename(jsonFilename)}`);
        searchPaths.push(jsonFilename);
    }
    for (const searchPath of searchPaths) {
        const artifact = searchArtifacts(artifactsCache, `${searchPath}`);
        if (artifact !== null) {
            return new Promise((resolve, reject) => {
                fs_1.default.readFile(artifact, (err, data) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(starknet_1.json.parse(data.toString("ascii")));
                    }
                });
            });
        }
    }
    throw new plugins_1.HardhatPluginError("hardhat-starknetjs", `couldn't find artifact for '${contractName}'`);
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
const STARKNETJS_NETWORK_PARAM = "starknetjsNetwork";
const STARKNETJS_NETWORK_PARAM_DESC = "Network to use with StarkNet.js";
function setNetworkFromCmdLine(hre, args) {
    const networkId = args[STARKNETJS_NETWORK_PARAM];
    if (networkId !== undefined) {
        process.env.STARKNETJS_NETWORK = networkId;
    }
}
(0, config_1.task)("test")
    .addOptionalParam(STARKNETJS_NETWORK_PARAM, STARKNETJS_NETWORK_PARAM_DESC)
    .setAction(async (args, hre, runSuper) => {
    setNetworkFromCmdLine(hre, args);
    await runSuper();
});
(0, config_1.task)("run")
    .addOptionalParam(STARKNETJS_NETWORK_PARAM, STARKNETJS_NETWORK_PARAM_DESC)
    .setAction(async (args, hre, runSuper) => {
    setNetworkFromCmdLine(hre, args);
    await runSuper();
});
//# sourceMappingURL=index.js.map