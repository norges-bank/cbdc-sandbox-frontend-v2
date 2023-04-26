import React, { useCallback, useMemo } from "react";
import { Card, Container, Link, Spacer, Text } from "@nextui-org/react";
import { useAppState } from "../utils/app-state";
import { BLOCK_EXPLORER_URL } from "../constants";
import { FormatAddress } from "../utils/format/Address";
import { AccountBalance } from "./AccountBalance";

interface Props {}

export const IncognitoTransferList: React.FC<Props> = ({ ...props }) => {
	const { stealthTransfers } = useAppState();
	return (
		<Container>
			{stealthTransfers.map((transfer) => (
				<React.Fragment key={transfer.hash}>
					<Card>
						<Card.Body>
							<Text size={"small"} key={transfer.hash}>
								# {transfer.hash.slice(2, 6)}
							</Text>
							<FormatAddress copy address={transfer.address}></FormatAddress>
							<AccountBalance address={transfer.address}></AccountBalance>

							<Link target='_blank' rel='noopener noreferrer' href={`${BLOCK_EXPLORER_URL}/tx/${transfer.hash}`}>
								VIEW MORE
							</Link>
						</Card.Body>
					</Card>
					<Spacer></Spacer>
				</React.Fragment>
			))}
		</Container>
	);
};
