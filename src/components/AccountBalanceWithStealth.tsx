import { Text } from "@nextui-org/react";
import { ethers } from "ethers";
import React from "react";
import { Eye, EyeOff } from "react-feather";
import { Address, useBalance } from "wagmi";
import { CB_TOKEN_ADDRESS } from "../constants";
import { useAppState } from "../utils/app-state";
import { formatNOK } from "../utils/format/Currency";

interface Props {
	address: string;
}

export const AccountBalanceWithStealth: React.FC<Props> = ({ ...props }) => {
	const { data } = useBalance({
		address: props.address as Address,
		token: CB_TOKEN_ADDRESS!,
		watch: true,
	});
	const { stealthBalance } = useAppState();
	const total = data ? ethers.utils.formatUnits(ethers.BigNumber.from(data.value).add(stealthBalance), 4) : "-";

	// useEffect(() => {
	// 	setStealthBalance(stealthBalance);
	// 	const unsub = useAppState.subscribe((state) => {
	// 		if (stealthBalance !== state.stealthBalance) {
	// 			setStealthBalance(state.stealthBalance);
	// 		}
	// 	});
	// 	return () => {
	// 		unsub();
	// 		setStealthBalance(ethers.constants.Zero);
	// 	};
	// }, []);

	return (
		<>
			<Text b size={20}>
				{data && formatNOK(total)}
			</Text>
			<Text size={14}>
				<Eye size={14}></Eye>
				{` ${data && formatNOK(data.formatted)}`}
			</Text>
			<Text size={14} className={"stealth-balance"}>
				<EyeOff size={14}></EyeOff>
				{` ${formatNOK(ethers.utils.formatUnits(stealthBalance, 4))}`}
			</Text>
		</>
	);
};
