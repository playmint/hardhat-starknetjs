import { extendConfig, extendEnvironment } from "hardhat/config";
import { Abi, Account, Provider, ContractFactory, CompiledContract, Contract } from "starknet";
import "./type-extensions";
import { HardhatConfig, HardhatRuntimeEnvironment, HardhatUserConfig } from "hardhat/types";
import fs from "fs";
import path from "path";


extendConfig((config: HardhatConfig, userConfig: Readonly<HardhatUserConfig>) => {
    config.starknetjs = { networks: { "goerli-alpha": { network: "goerli-alpha" } } }; // TODO add mainnet to here

    if (userConfig.starknetjs && userConfig.starknetjs.networks) {
        for (const networkId in userConfig.starknetjs.networks) {
            config.starknetjs.networks[networkId] = userConfig.starknetjs.networks[networkId];
        }
    }
});

extendEnvironment((hre) => {
    // TODO set selected network with arg or env var or hardhat config ts
    const network = process.env.STARKNETJS_NETWORK || "goerli-alpha";
    const networkConfig = hre.config.starknetjs.networks[network];
    if (networkConfig === undefined) {
        throw `network '${network}' not defined in config`; // TODO plugin error
    }
    hre.starknetjs = {
        provider: new Provider(networkConfig),

        getContractFactory: getContractFactory.bind(null, hre),
        getContractFactoryFromArtifact: getContractFactoryFromArtifact.bind(null, hre),
        getContractAt: getContractAt.bind(null, hre),
        getContractAtFromArtifact: getContractAtFromArtifact.bind(null, hre),
        readArtifact: readArtifact
    };
});

async function getContractFactory(
    hre: HardhatRuntimeEnvironment,
    contractName: string,
    providerOrAccount?: Provider | Account | undefined,
    abi?: Abi | undefined): Promise<ContractFactory> {

    const artifact = await readArtifact(contractName);
    if (artifact) {
        return getContractFactoryFromArtifact(hre, artifact, providerOrAccount, abi);
    }

    throw `couldn't find artifact for '${contractName}'`; // TODO make this a plugin exception or whatever
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

    const artifact = await readArtifact(contractName);
    if (artifact) {
        return getContractAtFromArtifact(hre, artifact, address, providerOrAccount, abi);
    }

    throw `couldn't find artifact for '${contractName}'`; // TODO make this a plugin exception or whatever
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
        throw `'${searchPath}' is ambiguous, could be:\n${candidates.join("\n")}`; // TODO make thsia plugin exception or whatever
    }

    if (candidates.length == 1) {
        return candidates[0];
    }

    return null;
}

async function readArtifact(contractName: string): Promise<CompiledContract | null> {
    // TODO cache allArtifacts so we don't scan the dir every time you want an artifact
    const allArtifacts = await getFilesInDirRecursively("artifacts-starknet"); // TODO read from config

    const cairoFilename = contractName.endsWith(".cairo") ? contractName : `${contractName}.cairo`;
    const jsonFilename = `${cairoFilename.substring(0, cairoFilename.length - 6)}.json`;

    // first try path/file.cairo/file.json
    let artifact = searchArtifacts(allArtifacts, `${cairoFilename}/${path.basename(jsonFilename)}`);

    // then try path/file.json
    if (!artifact) {
        artifact = searchArtifacts(allArtifacts, jsonFilename);
    }

    if (artifact) {
        return new Promise<CompiledContract>((resolve, reject) => {
            fs.readFile(artifact!, (err, data) => {
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