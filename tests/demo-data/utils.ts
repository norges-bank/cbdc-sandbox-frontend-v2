import { expect, Page } from "@playwright/test";
import { ValueOf } from "next/dist/shared/lib/constants";

export type Wallets = [];

export const useWallet = async (
	page: Page,
	walletName: "beskjeden" | "minkende" | "jon" | "deployer" | "random" | "brosme" | "sentral" | "bestemt",
	keystorePassword: string,
	useVC = true,
) => {
	await page.locator("#web-wallet-connect-button-change").click();
	await page.setInputFiles(
		"xpath=/html/body/div[3]/div/div[2]/section/div[4]/div/div[2]/input",
		`tests/demo-data/${walletName}-keystore.json`,
	);
	if (useVC) {
		await page.locator('button:has-text("Add credential")').click();

		await page.setInputFiles(
			"xpath=/html/body/div[3]/div/div[2]/section/div[3]/div[1]/div/div[3]/input",
			`tests/demo-data/${walletName}-vc.json`,
		);
		await expect(page.locator("text=Verifiable Credential")).toBeVisible();
	}
	await page.locator('button:has-text("Unlock")').click();
	await page.getByLabel("Enter keystore password").fill(keystorePassword); // TODO Bruk annet passord
	await page.locator('button:has-text("Unlock wallet")').click();
	await expect(await page.locator("text=VC is verified")).toBeVisible();
};

export const stealthBalanceChanged = async (
	page: Page,
	currentBalance: number,
	secondsToWait: number,
): Promise<number> => {
	let newBalance = currentBalance;
	let balanceChanged = false;
	let waitedSeconds = 0;
	while (waitedSeconds < secondsToWait && !balanceChanged) {
		await page.waitForTimeout(1000);
		waitedSeconds = waitedSeconds + 1;
		newBalance = await getStealthBalance(page);
		if (newBalance !== currentBalance) {
			balanceChanged = true;
		}
	}
	expect(balanceChanged, `Stealth balance did not change within ${secondsToWait} seconds`).toBe(true);
	return newBalance - currentBalance;
};
export const getStealthBalance = async (page: Page) => {
	await page.waitForSelector(".stealth-balance");
	const stealthBalanceText = await page.$eval(".stealth-balance", (el: HTMLLinkElement) => el.innerText);
	const balance = parseInt(stealthBalanceText);
	expect(balance, "Stealth balance was not greather or equal to 0").toBeGreaterThanOrEqual(0);
	return balance;
};
