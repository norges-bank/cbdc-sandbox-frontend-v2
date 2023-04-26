import { Text } from "@nextui-org/react";
import React from "react";
import { Address, useBalance } from "wagmi";
import { CB_TOKEN_ADDRESS } from "../constants";
import { formatNOK } from "../utils/format/Currency";

interface Props {
	address: string;
}

export const AccountBalance: React.FC<Props> = ({ ...props }) => {
	const { data } = useBalance({
		address: props.address as Address,
		token: CB_TOKEN_ADDRESS!,
		watch: true,
	});

	return (
		<>
			<Text b size={20}>
				{data && formatNOK(data.formatted)}
			</Text>
		</>
	);
};
