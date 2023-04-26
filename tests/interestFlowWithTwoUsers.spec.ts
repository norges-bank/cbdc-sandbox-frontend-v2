import { test, expect, Page, chromium } from "@playwright/test";
import { useWallet } from "./demo-data/utils";

test.setTimeout(86400000); // 24 hours

const openSite = async (page: Page) => {
	await page.goto("/");
	await page.getByPlaceholder("Enter password...").fill("123");
	await page.getByRole("button", { name: "Login" }).click();
};

test.skip("Scenario: Test Interest Accrual on Two Accounts", async ({ browser }) => {
	const windowWidth = 1147;
	const viewport = { width: windowWidth, height: 1250 };

	const CBBrowser = await chromium.launch({ args: ["--window-position=0,0"] });
	const beskjedenBrowser = await chromium.launch({ args: [`--window-position=${windowWidth},0`] });
	const minkendeBrowser = await chromium.launch({ args: [`--window-position=${windowWidth * 2},0`] });

	const CBContext = await CBBrowser.newContext({ viewport: viewport });
	const beskjedenContext = await beskjedenBrowser.newContext({ viewport: viewport });
	const minkendeContext = await minkendeBrowser.newContext({ viewport: viewport });

	// Create pages and interact with contexts independently
	const cbPage = await CBContext.newPage();
	const beskjedenPage = await beskjedenContext.newPage();
	const minkendePage = await minkendeContext.newPage();

	// Open site
	await openSite(cbPage);
	await openSite(beskjedenPage);
	await openSite(minkendePage);

	// CB is deployer/admin as default
	await useWallet(beskjedenPage, "beskjeden", "12345", false);
	await useWallet(minkendePage, "minkende", "12345", false);

	// Uncomment the following line if needed.
	await minkendePage.waitForTimeout(86400000);
});
