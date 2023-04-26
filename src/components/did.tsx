import React from "react";
import { Grid, Image, Justify, Text } from "@nextui-org/react";
import { Copy } from "../utils/Copy";

export const shortenDID = (address: string, start = 4, end = 4) => {
	return `${address.slice(0, start + 2)}...${address.slice(-Math.abs(end))}`;
};

interface Props {
	did: string;
	copy?: boolean;
	image?: boolean;
	justify?: Justify;
	prefix?: string;
}

export const FormatDID: React.FC<Props> = ({ ...props }) => {
	const imageURL = `https://avatars.dicebear.com/api/jdenticon/${props.did}.svg?r=50`;

	const Content = () => (
		<>
			<Grid.Container direction="row" gap={1} justify={props.justify}>
				<Grid>
					<Image style={{ paddingTop: "2px" }} height={25} width={20} src={imageURL} objectFit="contain" alt="DID" />
				</Grid>
				<Grid justify="center">
					<Text size={12} weight={"bold"}>
						{props.prefix ? `${props.prefix} ${shortenDID(props.did, 18, 4)}` : `${shortenDID(props.did, 18, 4)}`}
					</Text>
				</Grid>
			</Grid.Container>
		</>
	);

	if (props.copy) {
		return (
			<Copy text={props.did}>
				<Content />
			</Copy>
		);
	}
	return <Content />;
};
