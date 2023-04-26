import { createTheme, NextUIProvider, Text } from "@nextui-org/react";

export const lightTheme = createTheme({
	type: "light", // it could be "light" or "dark"
	theme: {
		colors: {
			primary: "linear-gradient(1turn,#347a9e,#7ab2cd)",
			error: "radial-gradient(circle, rgba(255,133,133,1) 1%, rgba(244,128,128,0.7469362745098039) 99%)",
		},
		fonts: {
			sans: "Lato, sans-serif",
		},
		radii: {
			xs: "3px",
			sm: "3px",
			md: "3px",
			base: "3px",
			lg: "3px", // preferred value by NextUI components
			xl: "3px",
			"2xl": "3px",
			"3xl": "3px",
			squared: "3%",
			rounded: "50%",
			pill: "3px",
		},
	},
});
