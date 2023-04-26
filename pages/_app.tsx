import { NextUIProvider } from "@nextui-org/react";
import { AppProps } from "next/app";
import { WagmiConfig } from "wagmi";
import { client } from "../src/utils/web-wallet/WagmiClient";
import { withPasswordProtect } from "next-password-protect";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { lightTheme } from "../src/theme";

function MyApp({ Component, pageProps }: AppProps) {
	return (
		// 2. Use at the root of your app
		<WagmiConfig client={client}>
			<ToastContainer position="bottom-left"></ToastContainer>
			<NextUIProvider theme={lightTheme}>
				<Component {...pageProps} />
			</NextUIProvider>
		</WagmiConfig>
	);
}

export default process.env.PASSWORD_PROTECT!
	? withPasswordProtect(MyApp, {
			// Options go here (optional)
			loginApiUrl: "/api/login",
	  })
	: MyApp;
