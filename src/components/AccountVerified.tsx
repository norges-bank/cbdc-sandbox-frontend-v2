import React from "react";
import { Text, Grid } from "@nextui-org/react";
import { ethers } from "ethers";
import { Check, Square } from "react-feather";
import { Address, useAccount, useContractRead } from "wagmi";
import { AUTHENTICATED_POLICY_ADDRESS, CB_TOKEN_ADDRESS } from "../constants";
import { AuthenticatedPolicy__factory, CBToken__factory } from "@symfoni/cbdc-sandbox-contracts-shared";
interface Props {
	address: string;
}
const ONE_YEAR = 52 * 7 * 24 * 60 * 60;

export const AccountVerified: React.FC<Props> = ({ ...props }) => {
	const { data: verfiedOnce } = useContractRead({
		address: AUTHENTICATED_POLICY_ADDRESS,
		abi: AuthenticatedPolicy__factory.abi,
		functionName: "checkAuthenticatedOnce",
		args: [props.address as Address],
	});
	const { data: verfiedSend } = useContractRead({
		address: AUTHENTICATED_POLICY_ADDRESS,
		abi: AuthenticatedPolicy__factory.abi,
		functionName: "checkAuthenticated",
		args: [props.address as Address],
	});

	const ICON_SIZE = 16;
	const TRUE_ICON = <Check size={ICON_SIZE}></Check>;
	const FALSE_ICON = <Square size={ICON_SIZE}></Square>;
	return (
		<Grid.Container alignItems="center">
			<Grid xs={8}>
				<Text size={"$xs"}>Receive</Text>
			</Grid>
			<Grid xs={4}>{verfiedOnce ? TRUE_ICON : FALSE_ICON}</Grid>
			<Grid xs={8}>
				<Text size={"$xs"}>Send</Text>
			</Grid>
			<Grid xs={4}>{verfiedSend ? TRUE_ICON : FALSE_ICON}</Grid>
		</Grid.Container>
	);
};
