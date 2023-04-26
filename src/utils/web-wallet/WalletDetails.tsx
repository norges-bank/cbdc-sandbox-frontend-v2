import { Button, Card, Col, Grid, Text } from "@nextui-org/react";
import { VerifiableCredential } from "@veramo/core";
import debug from "debug";
import { ethers } from "ethers";
import React, { useState } from "react";
import { Delete } from "react-feather";
import { useConnect } from "wagmi";
import { FormatAddress } from "../format/Address";
import { toastError } from "../toast";
import { RenameWalletModal } from "./RenameWalletModal";
import { RequestPasswordModal } from "./RequestPasswordModal";
import { SelectFile } from "./SelectFile";
import { EncryptedWalletMeta, useWebWalletState } from "./useWebWalletState";
import { VerfiableCredential } from "./VerfiableCredential";
const log = debug("dsp:wallet:WalletDetails");

interface Props {
	wallet: EncryptedWalletMeta;
	onSelectWallet: (wallet: EncryptedWalletMeta, decryptedWallet: ethers.Wallet) => void;
}

export const WalletDetails: React.FC<Props> = ({ ...props }) => {
	const { wallet, onSelectWallet } = props;
	const [requestUnlock, setRequestUnlock] = useState<boolean>(false);
	const [requestRename, setRequestRename] = useState<boolean>(false);
	const { removeWallet, updateWallet } = useWebWalletState();

	const onReceiveVC = (text: string, wallet: EncryptedWalletMeta) => {
		try {
			const _parsedFile = JSON.parse(text) as VerifiableCredential;
			log("Parsed onReceiveVC", _parsedFile);
			updateWallet({
				...wallet,
				vcs: [...wallet.vcs, _parsedFile],
			});
		} catch (error: unknown) {
			toastError(error);
		}
	};

	const onDecryptWallet = async (decryptedWallet: ethers.Wallet) => {
		onSelectWallet(wallet, decryptedWallet);
	};

	const onRename = async (newName: string) => {
		updateWallet({
			...wallet,
			name: newName,
		});
		setRequestRename(false);
	};

	const hasVerifiableCredentials = (wallet: EncryptedWalletMeta) => Array.isArray(wallet.vcs) && wallet.vcs.length > 0;

	return (
		<Card
			className='wallet-card'
			id={`wallet-${wallet.address}`}
			key={wallet.address}
			isHoverable
			isPressable
			onPress={() => setRequestUnlock(true)}
		>
			<Grid.Container gap={1} alignItems="flex-end" justify="flex-end">
				<Grid xs={12}>
					<Col>
						<Text size={12}>{wallet.name}</Text>
						<FormatAddress address={wallet.address}></FormatAddress>
					</Col>
				</Grid>
				<Grid sm={3}>
					<Button size={"xs"} onPress={() => setRequestUnlock(true)}>
						Unlock
					</Button>
				</Grid>
				<Grid sm={3}>
					<SelectFile onReceiveFile={(blob) => onReceiveVC(blob, wallet)} button={{ size: "xs" }}>
						Add credential
					</SelectFile>
				</Grid>
				<Grid sm={3}>
					<Button size={"xs"} onPress={() => setRequestRename(true)}>
						Rename
					</Button>
				</Grid>
				<Grid sm={3}>
					<Button
						size={"xs"}
						className='remove-wallet'
						color={"error"}
						icon={<Delete size={16}></Delete>}
						style={{ width: "1rem" }}
						onPress={() => removeWallet(wallet.address)}
					></Button>
				</Grid>
				{hasVerifiableCredentials(wallet) && (
					<Card style={{ margin: "1rem" }}>
						<Card.Header>Verifiable Credentials</Card.Header>
						<Card.Body style={{ padding: "0" }}>
							{wallet.vcs.map((vc) => (
								<React.Fragment key={`${vc.issuanceDate}`}>
									<VerfiableCredential vc={vc}></VerfiableCredential>
								</React.Fragment>
							))}
						</Card.Body>
					</Card>
				)}
			</Grid.Container>
			<RequestPasswordModal
				wallet={wallet}
				show={requestUnlock}
				close={() => setRequestUnlock(false)}
				onDecryptWallet={onDecryptWallet}
			></RequestPasswordModal>
			<RenameWalletModal
				show={requestRename}
				close={() => setRequestRename(false)}
				onRename={onRename}
			></RenameWalletModal>
		</Card>
	);
};
