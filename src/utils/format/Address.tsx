import { ethers } from "ethers";
import React from "react";
import { Grid, Image, Text } from "@nextui-org/react";
import { Copy } from "../Copy";
import { toast } from "react-toastify";

export const shortenAddress = (address: string, start = 4, end = 4) => {
	return `${address.slice(0, start + 2)}...${address.slice(-Math.abs(end))}`;
};

interface Props {
	address: string;
	copy?: boolean;
	image?: boolean;
	alias?: string;
	onlyIcon?: boolean;
}

export const FormatAddress: React.FC<Props> = ({ ...props }) => {
	let parsed = props.address;
	try {
		parsed = ethers.utils.getAddress(props.address);
	} catch (error) {
		console.log(`Invalid address: ${props.address}`);
	}
	const imageURL = `https://avatars.dicebear.com/api/jdenticon/${props.address}.svg?r=50`;

	const Content = () => (
		<>
			<Grid.Container direction="row" gap={1}>
				<Grid>
					<Image
						style={{ paddingTop: "2px" }}
						height={25}
						width={20}
						src={imageURL}
						objectFit="contain"
						alt="Address"
					></Image>
				</Grid>
				{!props.onlyIcon && (
					<Grid justify="center">
						<Text size={20} weight={"bold"}>
							{props.alias ? props.alias : shortenAddress(props.address)}
						</Text>
					</Grid>
				)}
			</Grid.Container>
		</>
	);

	if (props.copy) {
		return (
			<Copy text={parsed}>
				<Content></Content>
			</Copy>
		);
	}
	return <Content></Content>;
};
