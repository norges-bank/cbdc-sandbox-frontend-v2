/**
 * Formats a timestamp into a locale based datetime.
 *
 * @param {number} seconds The number of seconds from unix time since the timestamp has been generated.
 * @returns A string containing the formatted timestamp.
 */
export const timestampToDateTime = (seconds: number) => {
	let date = new Date(0);
	date.setSeconds(seconds, 0);
	return new Intl.DateTimeFormat("default", { dateStyle: "short", timeStyle: "short" }).format(date);
};
