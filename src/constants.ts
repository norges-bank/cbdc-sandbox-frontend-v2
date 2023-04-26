import { ethers } from "ethers";
import { localhostContracts, mainnetContracts } from "@symfoni/cbdc-sandbox-contracts-shared";

export const BURNER_ROLE = ethers.utils.id("BURNER_ROLE");
export const MINTER_ROLE = ethers.utils.id("MINTER_ROLE");
export const BANK_ROLE = ethers.utils.id("BANK_ROLE");

const currentContracts = process.env.NODE_ENV === "development" ? localhostContracts : mainnetContracts;

export const BLOCK_EXPLORER_URL = process.env.NEXT_PUBLIC_BLOCK_EXPLORER_URL!;
export const CB_TOKEN_ADDRESS = currentContracts.cbToken;
export const ERC5564_REGISTRY_ADDRESS = currentContracts.ERC5564Registry;
export const SECP_256K1_GENERATOR_ADDRESS = currentContracts.Secp256k1Generator;
export const ERC5564_MESSENGER_ADDRESS = currentContracts.ERC5564Messenger;
export const DID_REGISTRY_ADDRESS = currentContracts.didRegistry;
export const AUTHENTICATED_POLICY_ADDRESS = currentContracts.authenticatedPolicy;
export const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
export const NAHMII_BASIC_AUTH = process.env.NEXT_PUBLIC_NAHMII_BASIC_AUTH!;
export const MESSAGE_FOR_SIGNATURE = "ONLY FOR DEMO PURPOSES! CB Token private transfer setup. ONLY FOR DEMO PURPOSES!";
export const USE_LOCAL_BLOCKCHAIN = process.env.NODE_ENV === "development" ? true : false;
export const IS_GASSLESS = process.env.NODE_ENV !== "development" ? true : false;
export const START_BLOCK = USE_LOCAL_BLOCKCHAIN ? 0 : 5074309;

declare global {
	var provider: ethers.providers.JsonRpcProvider;
}
// export function getProvider(withNetwork = false) {
// 	if ("provider" in window && window.provider) {
// 		return window.provider;
// 	}
// 	const provider = new ethers.providers.JsonRpcProvider({
// 		url: process.env.NEXT_PUBLIC_RPC_URL!,
// 		user: process.env.NEXT_PUBLIC_RPC_USER,
// 		password: process.env.NEXT_PUBLIC_RPC_PASSWORD,
// 	});
// 	window.provider = provider;
// 	return window.provider;
// }
export function getProvider(withNetwork = false) {
	return new ethers.providers.JsonRpcProvider(
		{
			url: process.env.NEXT_PUBLIC_RPC_URL!,
			user: USE_LOCAL_BLOCKCHAIN ? undefined : process.env.NEXT_PUBLIC_RPC_USER,
			password: USE_LOCAL_BLOCKCHAIN ? undefined : process.env.NEXT_PUBLIC_RPC_PASSWORD,
		},
		withNetwork
			? {
					chainId: parseInt(process.env.NEXT_PUBLIC_RPC_CHAIN_ID!),
					name: process.env.NEXT_PUBLIC_RPC_CHAIN_NAME!,
			  }
			: undefined,
	);
}
