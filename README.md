<img src="https://raw.githubusercontent.com/playmint/hardhat-starknetjs/main/hardhat-starknetjs.png" width="300" height="300"/>

[![NPM Package](https://img.shields.io/npm/v/@playmint/hardhat-starknetjs.svg?style=flat-square)](https://www.npmjs.com/package/@playmint/hardhat-starknetjs)
---
#hardhat-starknetjs
[Hardhat](https://hardhat.org/) plugin for integration with [StarkNet.js](https://www.starknetjs.com/).

## What
This plugin brings to Hardhat the StarkNet library `StarkNet.js`, which allows you to interact with StarkNet via javascript in a simple way.

NOTE: This plugin doesn't compile your StarkNet contracts or manage artifacts, it's intended to be used in conjunction with another plugin such as [hardhat-starknet-compile](https://github.com/playmint/hardhat-starknet-compile).

## Installation
`npm install --save-dev @playmint/hardhat-starknetjs starknet`

And add the following to your `hardhat.config.ts`:
```ts
import "@playmint/hardhat-starknetjs";
```

Or if you're using Javascript, add this to `hardhat.config.js`:
```js
require("@playmint/hardhat-starknetjs");
```
## Config extensions
This plugin adds a field `starknetArtifacts` to `ProjectPathsConfig` which contains the path to where the plugin should look for artifacts (compiled StarkNet contracts). This defaults to `artifacts-starknet`.

It also adds a `starknetjs` object to `HardhatConfig` which contains `networks`, a mapping of network name to network config (as defined by the constructor of StarkNet.js's `Provider` object). The default networks populated are `goerli-alpha` and `mainnet-alpha`, you can add any additional ones you need or change the default networks as you see fit.
```ts
const config: HardhatUserConfig = {
    paths: {
        starknetArtifacts: "artifacts-starknet"
    },
    starknetjs: {
        networks: {
            "goerli-alpha": { network: "goerli-alpha" },
            "mainnet-alpha": { network: "mainnet-alpha" },
            "devnet": { baseUrl: "http://localhost:5000" }
        }
    }
};
```

## Selecting a network
You can select the network you want by either:
* setting the environment variable `STARKNETJS_NETWORK`, or
* using the `--starknetjs-network` argument when running a script or test, e.g. `npx hardhat run scripts/deploy.ts --starknetjs-network devnet`

## Environment extensions
This plugin adds an object called `starknetjs` to the Hardhat Runtime Environment.

### NetworkId
A `networkId` field is added to `starknetjs` which is a string, and contains the key of the selected network from `hre.config.starknetjs.networks`.

### Provider object
A `provider` field is added to `starknetjs`, which is a StarkNet.js `Provider` automatically connected to the selected network.

### Helpers
```ts
function getContractFactory(
    contractName: string,
    providerOrAccount?: Provider | Account | undefined,
    abi?: Abi | undefined): Promise<ContractFactory>;

function getContractFactoryFromArtifact(
    artifact: CompiledContract,
    providerOrAccount?: Provider | Account | undefined,
    abi?: Abi | undefined): ContractFactory;

function getContractAt(
    contractName: string,
    address: string,
    providerOrAccount?: Provider | Account | undefined,
    abi?: Abi | undefined): Promise<Contract>;

function getContractAtFromArtifact(
    artifact: CompiledContract,
    address: string,
    providerOrAccount?: Provider | Account | undefined,
    abi?: Abi | undefined): Contract;

function getAccount(
    address: string,
    keyPairOrSigner: KeyPair | SignerInterface,
    provider?: Provider): Account;

function readArtifact(searchPath: string): Promise<CompiledContract>;
```

## Usage
Example deploy.ts:
```ts
import hre from "hardhat";


async function main() {
    // these paths will all resolve to the same artifact
    let factory = await hre.starknetjs.getContractFactory("test");
    factory = await hre.starknetjs.getContractFactory("artifacts-starknet/test");
    factory = await hre.starknetjs.getContractFactory("test.cairo");
    factory = await hre.starknetjs.getContractFactory("test.cairo/test.json");

    const instance = await factory.deploy();

    await instance.invoke_some_func(42);

    console.log(await instance.get_some_value());
}

main().catch(err => console.error(err));
```
