import { Card, Col, Grid, Text } from "@nextui-org/react";
import React, { useEffect } from "react";
import { useAccount, useProvider } from "wagmi";
import { WebWalletConnectButton } from "../utils/web-wallet/WebWalletConnectButton";
import { AccountBalanceWithStealth } from "./AccountBalanceWithStealth";
import { AccountVerified } from "./AccountVerified";

interface Props {}

export const Wallet: React.FC<Props> = ({ ...props }) => {
	const { address, isConnected, status } = useAccount();
	const provider = useProvider();
	useEffect(() => {
		let subscribed = true;
		const doAsync = async () => {
			if (subscribed) {
				console.log(provider);
			}
		};
		doAsync();
		return () => {
			subscribed = false;
		};
	}, [provider]);

	return (
		<Card>
			<Card.Body>
				<Grid.Container>
					<Grid xs={12} sm={6}>
						<Col>
							<Text size={12}>WALLET</Text>
							<WebWalletConnectButton></WebWalletConnectButton>
						</Col>
					</Grid>
					<Grid xs={12} sm={6}>
						<Col>
							<Text size={12}>IDENTITY</Text>
						</Col>
					</Grid>
					<Grid xs={6} sm={3}>
						<Col>
							<Text size={12}>BALANCE</Text>
							{address ? <AccountBalanceWithStealth address={address}></AccountBalanceWithStealth> : "-"}
						</Col>
					</Grid>
					<Grid xs={6} sm={3}>
						<Col>
							<Text size={12}>VERIFIED</Text>
							{address ? <AccountVerified address={address}></AccountVerified> : "-"}
						</Col>
					</Grid>
				</Grid.Container>
			</Card.Body>
		</Card>
	);
};
