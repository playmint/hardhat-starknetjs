import "hardhat/types/runtime";
import { Provider } from "starknet";
declare module "hardhat/types/runtime" {
    interface HardhatRuntimeEnvironment {
        starknet: {
            provider: Provider;
        };
    }
}
//# sourceMappingURL=type-extensions.d.ts.map