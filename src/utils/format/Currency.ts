import { getLang } from "./intl";

const moneyFormatter = () => {
	return new Intl.NumberFormat(getLang(), {
		style: "currency",
		currency: "NOK",
		currencyDisplay: "code",
	});
};

export const formatNOK = (amount: number | string, options?: { postfix: boolean }) => {
	const amountFormatted = moneyFormatter()
		.format(amount as number)
		.replace("NOK", "")
		.trim();
	if (options) {
		if (options.postfix) return `${amountFormatted} NOK`;
	}
	return amountFormatted;
};
