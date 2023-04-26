import { toast } from "react-toastify";

export const toastError = (error: unknown) => {
	if (error instanceof Error) {
		toast(error.message, { type: "error" });
	} else {
		toast(JSON.stringify(error), { type: "error" });
	}
};
