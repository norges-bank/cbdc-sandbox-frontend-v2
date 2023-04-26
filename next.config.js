/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	swcMinify: false,
	env: {
		PASSWORD_PROTECT: true,
	},
	webpack: (config) => {
		config.resolve.fallback = { fs: false };

		return config;
	},
};

module.exports = nextConfig;
