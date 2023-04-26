import React, { useState } from "react";
import { Button, Text, Grid, Input, Loading, Modal, Progress } from "@nextui-org/react";
import { Eye, EyeOff } from "react-feather";
import { EncryptedWalletMeta } from "./useWebWalletState";
import { ethers } from "ethers";
import { toastError } from "../toast";

interface Props {
	wallet: EncryptedWalletMeta;
	show: boolean;
	close: () => void;
	onDecryptWallet: (decryptedWallet: ethers.Wallet) => void;
}

export const RequestPasswordModal: React.FC<Props> = ({ ...props }) => {
	const { show, close, onDecryptWallet, wallet } = props;
	const [password, setPassword] = useState<string>("");
	const [unlocking, setUnlocking] = useState(false);
	const [unlockMessage, setUnlockMessage] = useState("");
	const [decryptPercentage, setdecryptPercentage] = useState(0);

	const unlockWallet = async (wallet: EncryptedWalletMeta) => {
		setUnlocking(true);
		try {
			const progress = (float: number) => {
				const percentage = float * 100;
				if (Math.round(percentage) % 10 === 0) {
					setdecryptPercentage(percentage); // fix, because it lags
					// log("Decrypting %", percentage);
				}
			};
			setUnlockMessage("Decrypting wallet");
			const decryptedWallet = await ethers.Wallet.fromEncryptedJson(wallet.encryptedWallet, password, progress);
			onDecryptWallet(decryptedWallet);
		} catch (error) {
			toastError(error);
		}
		setdecryptPercentage(0);
		setUnlocking(false);
		close();
	};

	return (
		<Modal
			width="30rem"
			closeButton={true}
			aria-labelledby="modal-title"
			open={show}
			onClose={() => close()}
			blur={true}
		>
			<Grid.Container alignItems="center" gap={2} direction="column">
				<Grid xs={12}>
					<Input.Password
						autoFocus={true}
						tabIndex={1}
						autoComplete={"off"}
						labelPlaceholder="Enter keystore password"
						visibleIcon={<Eye fill="currentColor" />}
						hiddenIcon={<EyeOff fill="currentColor" />}
						onChange={(e) => setPassword(e.target.value)}
					/>
				</Grid>

				<Grid xs={12} style={{ display: "contents" }}>
					{decryptPercentage > 0 && <Progress animated={false} color="success" value={decryptPercentage} />}
				</Grid>
				<Grid xs={12} style={{ display: "contents" }}>
					<Text size={"$xs"}>{unlockMessage}</Text>
				</Grid>
				<Grid xs={12}>
					<Button tabIndex={2} onPress={() => unlockWallet(wallet)}>
						{unlocking ? <Loading color={"currentColor"} type="points-opacity" /> : "Unlock wallet"}
					</Button>
				</Grid>
			</Grid.Container>
		</Modal>
	);
};
