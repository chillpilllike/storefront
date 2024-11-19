/** @type {import('next').NextConfig} */
const config = {
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "secretgreen9.s3.ap-southeast-2.amazonaws.com", // S3 bucket
				pathname: "/**", // Allow all paths
			},
			{
				protocol: "https",
				hostname: "secretgreen-secretgreen-backend.g5edov.easypanel.host", // Backend hostname
				pathname: "/**", // Allow all paths
			},
		],
	},
	experimental: {
		typedRoutes: false,
	},
	// Used in the Dockerfile
	output:
		process.env.NEXT_OUTPUT === "standalone"
			? "standalone"
			: process.env.NEXT_OUTPUT === "export"
			  ? "export"
			  : undefined,
};

export default config;
