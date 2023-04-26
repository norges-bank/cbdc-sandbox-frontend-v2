import { AuthenticatedPolicy__factory, CBToken__factory } from "@symfoni/cbdc-sandbox-contracts-shared";
import { ethers } from "ethers";
import { AUTHENTICATED_POLICY_ADDRESS, CB_TOKEN_ADDRESS, getProvider, USE_LOCAL_BLOCKCHAIN } from "../../constants";
import { TX_OVERRIDE } from "../blockchain-utils";

export async function setAuthenticatedPerson(address: string) {
	try {
		const wallet = new ethers.Wallet(process.env.ISSUER_PRIVATE_KEY!).connect(getProvider(true));
		const contract = AuthenticatedPolicy__factory.connect(AUTHENTICATED_POLICY_ADDRESS, wallet);
		if (USE_LOCAL_BLOCKCHAIN) {
			const tx = await contract.setAuthenticatedPerson(address);
			const receipt = await tx.wait();
			return receipt;
		} else {
			const tx = await contract.setAuthenticatedPerson(address, TX_OVERRIDE);
			const receipt = await tx.wait();
			return receipt;
		}
	} catch (error) {
		console.log("error on setAuthenticatedPerson", error);
		return false;
	}
}

export async function checkAuthenticatedOnce(address: string): Promise<boolean> {
	try {
		const wallet = new ethers.Wallet(process.env.ISSUER_PRIVATE_KEY!).connect(getProvider(true));
		const contract = AuthenticatedPolicy__factory.connect(AUTHENTICATED_POLICY_ADDRESS, wallet);
		const res = await contract.checkAuthenticatedOnce(address, USE_LOCAL_BLOCKCHAIN ? undefined : TX_OVERRIDE);
		return res;
	} catch (error) {
		console.log(error);
		return false;
	}
}
