import { Card, Text } from "@nextui-org/react";
import React, { useEffect } from "react";
import { useToken } from "wagmi";
import { CB_TOKEN_ADDRESS } from "../constants";
import { formatNOK } from "../utils/format/Currency";

interface Props {}

export const TotalSupply: React.FC<Props> = ({ ...props }) => {
	const { data, refetch } = useToken({
		address: CB_TOKEN_ADDRESS,
		formatUnits: 4,
	});
	useEffect(() => {
		const timer = setInterval(() => {
			refetch();
		}, 5000);
		return () => {
			clearInterval(timer);
		};
	}, []);

	return (
		<Card>
			<Card.Body>
				<Text size={12}>SUPPLY</Text>
				{data ? (
					<Text b size={20}>
						{formatNOK(data.totalSupply.formatted)}
					</Text>
				) : (
					"-"
				)}
			</Card.Body>
		</Card>
	);
};
