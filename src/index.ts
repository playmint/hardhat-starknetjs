import {
    extendConfig,
    extendEnvironment,
    task
} from "hardhat/config";
import {
    Abi,
    Account,
    Provider,
    ContractFactory,
    CompiledContract,
    Contract,
    KeyPair,
    SignerInterface,
    json
} from "starknet";
import "./type-extensions";
import {
    HardhatConfig,
    HardhatRuntimeEnvironment,
    HardhatUserConfig
} from "hardhat/types";
import { HardhatPluginError } from "hardhat/plugins";
import fs from "fs";
import path from "path";


extendConfig((config: HardhatConfig, userConfig: Readonly<HardhatUserConfig>) => {
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

extendEnvironment((hre) => {

    const networkId = process.env.STARKNETJS_NETWORK || "goerli-alpha";
    const network = hre.config.starknetjs.networks[networkId];
    if (network === undefined) {
        throw new HardhatPluginError("hardhat-starknetjs", `network '${networkId}' not defined in config`);
    }

    hre.starknetjs = {
        networkId: networkId,
        provider: new Provider(network),

        getContractFactory: getContractFactory.bind(null, hre),
        getContractFactoryFromArtifact: getContractFactoryFromArtifact.bind(null, hre),
        getContractAt: getContractAt.bind(null, hre),
        getContractAtFromArtifact: getContractAtFromArtifact.bind(null, hre),
        getAccount: getAccount.bind(null, hre),
        readArtifact: readArtifact.bind(null, hre)
    };
});

async function getContractFactory(
    hre: HardhatRuntimeEnvironment,
    contractName: string,
    providerOrAccount?: Provider | Account | undefined,
    abi?: Abi | undefined): Promise<ContractFactory> {

    const artifact = await readArtifact(hre, contractName);
    return getContractFactoryFromArtifact(hre, artifact, providerOrAccount, abi);
}

function getContractFactoryFromArtifact(
    hre: HardhatRuntimeEnvironment,
    artifact: CompiledContract,
    providerOrAccount?: Provider | Account | undefined,
    abi?: Abi | undefined): ContractFactory {

    return new ContractFactory(artifact, providerOrAccount || hre.starknetjs.provider, abi);
}

async function getContractAt(
    hre: HardhatRuntimeEnvironment,
    contractName: string,
    address: string,
    providerOrAccount?: Provider | Account | undefined,
    abi?: Abi | undefined): Promise<Contract> {

    const artifact = await readArtifact(hre, contractName);
    return getContractAtFromArtifact(hre, artifact, address, providerOrAccount, abi);
}

function getContractAtFromArtifact(
    hre: HardhatRuntimeEnvironment,
    artifact: CompiledContract,
    address: string,
    providerOrAccount?: Provider | Account | undefined,
    abi?: Abi | undefined): Contract {

    return new Contract(abi ? abi : artifact.abi, address, providerOrAccount || hre.starknetjs.provider);
}

function searchArtifacts(artifacts: string[], searchPath: string): string | null {
    const candidates = artifacts.filter((artifact) => {
        return artifact.endsWith(searchPath);
    });

    if (candidates.length > 1) {
        throw new HardhatPluginError("hardhat-starknetjs", `'${searchPath}' is ambiguous, could be:\n${candidates.join("\n")}`);
    }

    if (candidates.length == 1) {
        return candidates[0];
    }

    return null;
}

function getAccount(
    hre: HardhatRuntimeEnvironment,
    address: string,
    keyPairOrSigner: KeyPair | SignerInterface,
    provider?: Provider): Account {

    return new Account(provider || hre.starknetjs.provider, address, keyPairOrSigner);
}

let artifactsCache: string[];
async function readArtifact(hre: HardhatRuntimeEnvironment, contractName: string): Promise<CompiledContract> {
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

        searchPaths.push(`${cairoFilename}/${path.basename(jsonFilename)}`);
        searchPaths.push(jsonFilename);
    }

    for (const searchPath of searchPaths) {
        const artifact = searchArtifacts(artifactsCache, `${searchPath}`);
        if (artifact !== null) {
            return new Promise<CompiledContract>((resolve, reject) => {
                fs.readFile(artifact!, (err, data) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(json.parse(data.toString("ascii")));
                    }
                });
            });
        }
    }

    throw new HardhatPluginError("hardhat-starknetjs", `couldn't find artifact for '${contractName}'`);
}

async function getFilesInDirRecursively(dir: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
        fs.readdir(dir, { withFileTypes: true }, async (err, files) => {
            if (err) {
                reject(err);
            }

            let paths: string[] = [];
            let promises: Promise<string[]>[] = [];

            for (const file of files) {
                const path = `${dir}/${file.name}`;

                if (file.isDirectory()) {
                    promises.push(getFilesInDirRecursively(path));
                } else {
                    paths.push(path);
                }
            }

            resolve(paths.concat(...await Promise.all(promises)));
        });
    });
}

const STARKNETJS_NETWORK_PARAM = "starknetjsNetwork";
const STARKNETJS_NETWORK_PARAM_DESC = "Network to use with StarkNet.js";

function setNetworkFromCmdLine(hre: HardhatRuntimeEnvironment, args: any) {
    const networkId = args[STARKNETJS_NETWORK_PARAM];
    if (networkId !== undefined) {
        process.env.STARKNETJS_NETWORK = networkId;
    }
}

task("test")
    .addOptionalParam(STARKNETJS_NETWORK_PARAM, STARKNETJS_NETWORK_PARAM_DESC)
    .setAction(async (args, hre, runSuper) => {
        setNetworkFromCmdLine(hre, args);
        await runSuper();
    });

task("run")
    .addOptionalParam(STARKNETJS_NETWORK_PARAM, STARKNETJS_NETWORK_PARAM_DESC)
    .setAction(async (args, hre, runSuper) => {
        setNetworkFromCmdLine(hre, args);
        await runSuper();
    });