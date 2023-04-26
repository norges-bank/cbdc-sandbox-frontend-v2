import { Connector, Chain, ConnectorData, Address } from "wagmi";
import { ethers } from "ethers";
import { useWebWalletState } from "./useWebWalletState";
import { getProvider } from "../../constants";
import debug from "debug";
const log = debug("dsp:WebWalletConnector");

type WebWalletConnectorOptions = {
	secret: string;
};

export class WebWalletConnector extends Connector<
	ethers.providers.JsonRpcProvider,
	WebWalletConnectorOptions,
	ethers.Wallet
> {
	readonly id = "web_wallet_connector";
	readonly name = "Web Wallet";

	ready = false;

	secret?: string;
	provider?: ethers.providers.JsonRpcProvider;
	wallet?: ethers.Wallet;

	// rome-ignore lint/suspicious/noExplicitAny: Because this is WAGMI interface
	constructor(config: { chains?: Chain[]; options: WebWalletConnectorOptions }) {
		super(config);
		if (!config.chains) {
			throw Error("No chains provided");
		}

		useWebWalletState.subscribe((state) => {
			if (state.secret) {
				log("Secret changed, updating wallet");
				this.secret = state.secret;
			}
		});
	}

	// rome-ignore lint/suspicious/noExplicitAny: Because this is WAGMI interface
	async connect(config?: { chainId?: number | undefined } | undefined): Promise<Required<ConnectorData<any>>> {
		const chain = this.chains.find((chain) => chain.id === config?.chainId);
		if (!chain) {
			throw Error(
				`SelectedChainId: ${config?.chainId}, but configured chains only contains: ${this.chains
					.map((chain) => chain.id)
					.join(", ")}`,
			);
		}
		this.provider = getProvider(true);
		if (!this.provider) {
			throw Error("Provider should have been defined at this point");
		}
		if (this.secret) {
			this.wallet = new ethers.Wallet(this.secret).connect(this.provider);
			if (this.ready) {
				this.onAccountsChanged([this.wallet.address]);
			}
		} else {
			// TODO - Support connecting without wallet
			throw Error("Secret should have been defined at this point");
		}

		this.ready = true;
		const account = await this.getAccount();
		return {
			account,
			chain: {
				id: chain.id,
				unsupported: false,
			},
			provider: this.provider,
		};
	}

	async switchChain?(chainId: number): Promise<Chain> {
		const chain = this.chains.find((chain) => chain.id === chainId);
		if (!chain) {
			throw Error("Chain not found. Maybe you forgot to configure it in Wagmi client?");
		}
		log("Switching chain to: ", chain);
		this.wallet = undefined;
		this.ready = false;
		await this.connect({ chainId: chain.id });
		log("Done switching");
		return chain;
	}

	async getProvider() {
		if (!this.provider) {
			throw new Error("Provider not set");
		}
		return this.provider;
	}
	async getWallet(): Promise<ethers.Wallet> {
		if (!this.wallet) {
			throw Error("No wallet set");
		}
		return this.wallet;
	}

	async getAccount(): Promise<Address> {
		if (this.wallet && ethers.utils.isAddress(this.wallet.address)) {
			return this.wallet.address;
		}
		throw Error("Couldt not get a account with valid address for the wallet");
	}
	async getChainId(): Promise<number> {
		const chainId = this.provider?.network.chainId;
		if (!chainId) {
			throw Error("Could not get chainId from provider, maybe provider not initialized yet");
		}
		return chainId;
	}
	async getSigner(config?: { chainId?: number | undefined } | undefined): Promise<ethers.Wallet> {
		return this.getWallet();
	}

	async isAuthorized(): Promise<boolean> {
		return this.ready;
	}

	async disconnect(): Promise<void> {
		this.wallet = undefined;
		this.ready = false;
	}

	protected onAccountsChanged(accounts: string[]): void {
		log("Accounts changed", accounts);
	}
	protected onChainChanged(chain: number | string): void {
		throw new Error("Method not implemented.");
	}
	protected onDisconnect(error: Error): void {
		throw new Error("Method not implemented.");
	}
	// Implement other methods
	// connect, disconnect, getAccount, etc.
}
