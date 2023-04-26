import { Button, ButtonProps } from "@nextui-org/react";
import React, { useRef } from "react";

interface Props {
	onReceiveFile: (text: string, filename?: string) => void;
	button?: ButtonProps;
	children: string;
}

export const SelectFile: React.FC<Props> = ({ ...props }) => {
	const { onReceiveFile } = props;
	const fileRef = useRef<HTMLInputElement>(null);

	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (!event.target.files) {
			return;
		}
		const fileUploaded = event.target.files[0];
		if (!fileUploaded) {
			return;
		}
		fileUploaded.text().then((text) => {
			onReceiveFile(text, fileUploaded.name ? fileUploaded.name : undefined);
		});
	};

	const handleKeystoreFileClick = () => {
		if (!fileRef.current) {
			return;
		}
		fileRef.current.click();
	};

	return (
		<>
			<Button onClick={handleKeystoreFileClick} {...props.button}>
				{props.children}
			</Button>
			<input type="file" ref={fileRef} onChange={handleFileChange} style={{ display: "none" }} />
		</>
	);
};
