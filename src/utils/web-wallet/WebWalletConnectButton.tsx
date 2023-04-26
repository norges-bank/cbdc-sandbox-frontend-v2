import { Button, Row } from "@nextui-org/react";

import debug from "debug";
import React, { useEffect, useState } from "react";
import { Edit2 } from "react-feather";
import { useAccount } from "wagmi";
import { FormatAddress } from "../format/Address";
import { useWebWalletState } from "./useWebWalletState";
import { WebWalletModal } from "./WebWalletModal";
const log = debug("dsp:wallet:WebWalletConnectButton");

interface Props {}

export const WebWalletConnectButton: React.FC<Props> = ({ ...props }) => {
	const [walletModalVisible, setWalletModalVisible] = useState(false);
	const { address, isConnected } = useAccount();
	const { wallets } = useWebWalletState();

	useEffect(() => {
		log(wallets);
	}, [wallets]);

	const ConnectButton = () => (
		<Button auto={true} onPress={() => setWalletModalVisible(true)} id="web-wallet-connect-button">
			Connect Wallet
		</Button>
	);

	const WalletInfo = () => (
		<Row align="center">
			{address && (
				<FormatAddress
					copy={true}
					address={address}
					alias={wallets.find((w) => w.address.toLowerCase() === address.toLowerCase())?.name}
				></FormatAddress>
			)}
			<Button
				style={{ minWidth: "2rem" }}
				size={"xs"}
				onPress={() => setWalletModalVisible(true)}
				id="web-wallet-connect-button-change"
				icon={<Edit2 size={16} />}
			/>
		</Row>
	);
	return (
		<>
			{isConnected ? <WalletInfo></WalletInfo> : <ConnectButton></ConnectButton>}
			<div>
				<WebWalletModal show={walletModalVisible} close={() => setWalletModalVisible(false)}></WebWalletModal>
			</div>
		</>
	);
};
