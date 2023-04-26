import { Card, Grid, Spacer, Switch, Text } from "@nextui-org/react";
import debug from "debug";
import React, { useState } from "react";
import { Eye, EyeOff } from "react-feather";
import { useAppState } from "../utils/app-state";
import { TransferTokensPublic } from "./TransferTokensPublic";
import { TransferTokensStealth } from "./TransferTokensStealth";
const log = debug("dsp:wallet:TransferTokens");

interface Props {}

export const TransferTokens: React.FC<Props> = ({ ...props }) => {
	const { userPreferStealthTransfers, setUserPreferStealthTransfers } = useAppState();

	return (
		<Card>
			<Card.Header>
				<Grid.Container justify="space-around">
					<Grid xs={6}>
						<Text>TRANSFER TOKENS</Text>
					</Grid>
					<Grid xs={6} justify="flex-end">
						<Text>{userPreferStealthTransfers ? "Incognito" : "Public"}</Text>
						<Spacer x={0.5}></Spacer>
						<Text>{userPreferStealthTransfers ? <EyeOff size={16}></EyeOff> : <Eye size={16}></Eye>}</Text>
						<Spacer x={0.5} />
						<Switch
							className="ncognito-transfer-switch"
							id="incognito-transfer-switch"
							checked={userPreferStealthTransfers}
							onChange={(e) => setUserPreferStealthTransfers(e.target.checked)}
						/>
						<Spacer y={0.5} />
					</Grid>
				</Grid.Container>
			</Card.Header>

			<Card.Body>
				{userPreferStealthTransfers ? (
					<TransferTokensStealth></TransferTokensStealth>
				) : (
					<TransferTokensPublic></TransferTokensPublic>
				)}
			</Card.Body>
			<Card.Footer></Card.Footer>
		</Card>
	);
};
