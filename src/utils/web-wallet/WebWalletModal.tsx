import { Button, Grid, Loading, Modal, Text } from "@nextui-org/react";

import debug from "debug";
import { ethers } from "ethers";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useConnect, useDisconnect } from "wagmi";
import { useAppState } from "../app-state";
import { toastError } from "../toast";
import { SelectFile } from "./SelectFile";
import { presentVC, verifyVC } from "./shared";
import { EncryptedWalletMeta, useWebWalletState } from "./useWebWalletState";
import { WalletDetails } from "./WalletDetails";
const log = debug("dsp:wallet:WebWalletConnect");

interface Props {
	show: boolean;
	close: () => void;
}

export const WebWalletModal: React.FC<Props> = ({ ...props }) => {
	const { close, show } = props;
	const [encryptedWallets, setEncryptedWallets] = useState<EncryptedWalletMeta[]>([]);
	const { setSecret, saveWallet, wallets } = useWebWalletState();
	const { setStealthWallet, currentNetwork } = useAppState();
	const { connect, connectors } = useConnect();
	const { disconnect } = useDisconnect();
	const [busy, setBusy] = useState(false);

	// Continiously get wallets from storage
	useEffect(() => {
		setEncryptedWallets(wallets);
		const unsub = useWebWalletState.subscribe((state) => {
			if (encryptedWallets !== state.wallets) {
				setEncryptedWallets(state.wallets);
			}
		});
		return () => {
			unsub();
			setEncryptedWallets([]);
		};
	}, []);

	// disconnect current wallet when entering modal. This makes it possible to switch wallets.
	useEffect(() => {
		if (props.show) {
			disconnect();
		}
	}, [props.show]);

	// DEV - When developing, set a DEV wallet at once, without opening the modal.
	useEffect(() => {
		if (process.env.NODE_ENV === "development") {
			setSecret(process.env.NEXT_PUBLIC_DEV_PRIVATE_KEY!);
			const connector = connectors.find((connector) => connector.id === "web_wallet_connector");
			if (!connector) {
				return toastError("Could not find a Web Wallet Connector from WAGMI");
			}
			connect({ connector, chainId: parseInt(process.env.NEXT_PUBLIC_RPC_CHAIN_ID!) });
			setStealthWallet(process.env.NEXT_PUBLIC_DEV_PRIVATE_KEY!);
		}
	}, []);

	// DEV - Only available in dev enviroment to create new wallet with password 123.
	const onCreateNew = async () => {
		setBusy(true);
		const wallet = ethers.Wallet.createRandom();
		const encryptedWallet = await wallet.encrypt("123");
		saveWallet({
			address: wallet.address,
			encryptedWallet: encryptedWallet,
			name: "New Wallet",
			vcs: [],
		});
		setBusy(false);
	};

	// DEV - Set a wallet at page startup in DEV so you dont have to reconnect wallet all the time.
	const setDevWallet = async () => {
		try {
			setBusy(true);
			const decryptedWallet = new ethers.Wallet(process.env.NEXT_PUBLIC_DEV_PRIVATE_KEY!);
			let wallet: EncryptedWalletMeta | undefined = wallets.find((w) => w.address === decryptedWallet.address);
			if (!wallet) {
				const VCString =
					'{\n    "credentialSubject": {\n        "idNumber": "13835698240"\n    },\n    "issuer": {\n        "id": "did:ethr:1729:0x0200573f001338129fc62c1e1eb79505cc0830754e1ea2da7701654488dece85be"\n    },\n    "type": [\n        "VerifiableCredential",\n        "NorwegianIdNumber"\n    ],\n    "@context": [\n        "https://www.w3.org/2018/credentials/v1",\n        "https://www.symfoni.dev/credentials/v1"\n    ],\n    "issuanceDate": "2022-10-24T09:12:11.000Z",\n    "proof": {\n        "type": "JwtProof2020",\n        "jwt": "eyJhbGciOiJFUzI1NksiLCJ0eXAiOiJKV1QifQ.eyJ2YyI6eyJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvMjAxOC9jcmVkZW50aWFscy92MSIsImh0dHBzOi8vd3d3LnN5bWZvbmkuZGV2L2NyZWRlbnRpYWxzL3YxIl0sInR5cGUiOlsiVmVyaWZpYWJsZUNyZWRlbnRpYWwiLCJOb3J3ZWdpYW5JZE51bWJlciJdLCJjcmVkZW50aWFsU3ViamVjdCI6eyJpZE51bWJlciI6IjEzODM1Njk4MjQwIn19LCJuYmYiOjE2NjY2MDI3MzEsImlzcyI6ImRpZDpldGhyOjE3Mjk6MHgwMjAwNTczZjAwMTMzODEyOWZjNjJjMWUxZWI3OTUwNWNjMDgzMDc1NGUxZWEyZGE3NzAxNjU0NDg4ZGVjZTg1YmUifQ.2eA1o_9GUck6uuLULaSr8-Y1DZcaTzgUGfhw4NYDK90YnIhgTwIX8iZ6tO0rA9P-ymZ5wkRzcVEJBfb-9ZaSPg"\n    }\n}';
				const vc = JSON.parse(VCString);
				wallet = {
					address: decryptedWallet.address,
					encryptedWallet: await decryptedWallet.encrypt("123"),
					name: "DEV wallet",
					vcs: [vc],
				};
				saveWallet(wallet);
			}
			// Set wallet from ENV
			onSelectWallet(wallet, decryptedWallet);
		} catch (error) {
			toastError(error);
		}
		setBusy(false);
	};

	const onSelectWallet = async (wallet: EncryptedWalletMeta, decryptedWallet: ethers.Wallet) => {
		setBusy(true);
		try {
			if (wallet.vcs.length > 0) {
				try {
					const vp = await toast.promise(presentVC(decryptedWallet.privateKey, wallet.vcs), {
						pending: "Signing VC",
						success: "VC signed",
						error: "Could not sign VC",
					});

					const response = await toast.promise(verifyVC(vp.proof.jwt), {
						pending: "Verifying VC",
						success: "VC is verified",
						error: "Could not verify VC",
					});
					log("verifyVC response", response);
				} catch (error) {
					log("Error verifying VC", error);
				}
			}
			const connector = connectors.find((connector) => connector.id === "web_wallet_connector");
			setSecret(decryptedWallet.privateKey);
			connect({ connector, chainId: currentNetwork });
			setStealthWallet(decryptedWallet.privateKey!);
			close();
		} catch (error) {
			toastError(error);
		}
		setBusy(false);
	};

	// When users uploads a keystore from file
	const onReceiveKeystore = (text: string, filename?: string) => {
		try {
			const _parsedFile = JSON.parse(text);
			// remove file extention from filename
			const name = filename?.split(".")[0];

			log("Parsed onReceiveKeystore", _parsedFile.address);
			if (!_parsedFile.address) {
				throw new Error("Address field missing");
			}

			saveWallet({
				address: `0x${_parsedFile.address}`,
				encryptedWallet: text,
				name: name ? name : "Unnamed",
				vcs: [],
			});
		} catch (error) {
			toastError(error);
		}
	};

	return (
		<Modal width="40rem" closeButton={true} aria-labelledby="modal-title" open={show} onClose={() => close()}>
			<Modal.Header>
				<Text size={18}>Wallets</Text>
			</Modal.Header>
			<Modal.Body>
				{encryptedWallets.map((wallet) => (
					<WalletDetails wallet={wallet} key={wallet.address} onSelectWallet={onSelectWallet}></WalletDetails>
				))}
			</Modal.Body>
			<Modal.Footer>
				<Grid.Container gap={1} justify="center">
					<Grid xs={6}>
						<Button as={"a"} target="_blank" href={process.env.NEXT_PUBLIC_VC_ISSUER_URL!}>
							Get VC from ID Porten
						</Button>
					</Grid>
					<Grid xs={6}>
						<SelectFile onReceiveFile={onReceiveKeystore}>Select keystore file</SelectFile>
					</Grid>
					{process.env.NODE_ENV === "development" && (
						<>
							<Grid xs={6}>
								<Button onPress={() => setDevWallet()}>
									{" "}
									{busy ? <Loading color={"currentColor"}></Loading> : "DEV Wallet"}
								</Button>
							</Grid>
							<Grid xs={6}>
								<Button onClick={onCreateNew}>
									{busy ? <Loading color={"currentColor"}></Loading> : "Create new"}
								</Button>
							</Grid>
						</>
					)}
				</Grid.Container>
			</Modal.Footer>
		</Modal>
	);
};
