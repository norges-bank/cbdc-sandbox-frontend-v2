import { ethers } from "ethers";

export const TX_OVERRIDE = {
	gasPrice: ethers.utils.parseUnits("0.0", "gwei"),
	gasLimit: ethers.BigNumber.from(800_000),
};

export const validAndPostiveBN = (value: string) => {
	try {
		const bn = ethers.utils.parseUnits(value, 4);
		if (bn._isBigNumber && bn.gt(0)) {
			return true;
		}
	} catch (error) {}
	return false;
};
