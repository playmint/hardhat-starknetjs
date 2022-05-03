import { extendEnvironment } from "hardhat/config";
import { defaultProvider } from "starknet";
import "./type-extensions";

extendEnvironment((hre) => {
    hre.starknet = { provider: defaultProvider };
});