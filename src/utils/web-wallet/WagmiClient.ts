import { Chain, configureChains, createClient } from "wagmi";
import { getProvider } from "../../constants";
import { WebWalletConnector } from "./WebWalletConnector";
import { localhost, hardhat } from "wagmi/chains";
import { publicProvider } from "wagmi/providers/public";

const norgesBankChain: Chain = {
	id: 1729,
	name: "NorwegianCentralBank",
	network: "ncb",
	nativeCurrency: {
		decimals: 18,
		name: "NCB",
		symbol: "ETH",
	},
	rpcUrls: {
		public: {
			http: ["https://rpc.bergen.nahmii.io"],
		},
		default: {
			http: ["https://rpc.bergen.nahmii.io"],
		}, // Wagmi does not support basic auth for RPC, so we configure this directly in the configureChains
	},
	blockExplorers: {
		default: { name: "Blockscout", url: "https://blockscout.bergen.nahmii.io" },
	},
	testnet: false,
};

const { provider } = configureChains(
	[hardhat, norgesBankChain],
	[
		// publicProvider(),
		(chain: Chain) => {
			return {
				chain: chain,
				provider: () => {
					// We need to configure this "fallback" provider manually because we need to use ethers basic auth for provider functionality which Wagmi do not expose.
					return getProvider(true);
				},
			};
		},
	],
);

const webWalletConnector = new WebWalletConnector({
	chains: [norgesBankChain, hardhat],
	options: { secret: process.env.NEXT_PUBLIC_DEV_PRIVATE_KEY! },
});

export const client = createClient({
	connectors: [webWalletConnector],
	provider,
});
