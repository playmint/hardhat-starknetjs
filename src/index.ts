import { extendConfig, extendEnvironment } from "hardhat/config";
import { Provider, ContractFactory, CompiledContract } from "starknet";
import "./type-extensions";
import { HardhatConfig, HardhatUserConfig } from "hardhat/types";
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
    const network = "goerli-alpha";
    // TODO set selected network with arg or env var or hardhat config ts
    const networkConfig = hre.config.starknetjs.networks[network];
    hre.starknetjs = {
        provider: new Provider(networkConfig),
        getContractFactory: async (contractName: string) => {
            const cairoFilename = contractName.endsWith(".cairo") ? contractName : `${contractName}.cairo`;
            const jsonFilename = `${cairoFilename.substring(0, cairoFilename.length - 6)}.json`;

            // first try path/file.cairo/file.json
            let artifact = await readArtifact(`${cairoFilename}/${path.basename(jsonFilename)}`);
            if (artifact) {
                return new ContractFactory(artifact);
            }

            // then try path/file.json
            artifact = await readArtifact(jsonFilename);
            if (artifact) {
                return new ContractFactory(artifact);
            }

            throw `couldn't find artifact for '${contractName}'`; // TODO make this a plugin exception or whatever
        }
    };
});

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

async function readArtifact(searchPath: string): Promise<CompiledContract | null> {
    const allArtifacts = await getFilesInDirRecursively("artifacts-starknet"); // TODO read from config
    const candidates = allArtifacts.filter((artifact) => {
        return artifact.endsWith(searchPath);
    })

    if (candidates.length > 1) {
        throw `'${searchPath}' is ambiguous, could be:\n${candidates.join("\n")}`; // TODO make thsia plugin exception or whatever
    }

    if (candidates.length > 0) {
        return new Promise<CompiledContract>((resolve, reject) => {
            fs.readFile(candidates[0], (err, data) => {
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