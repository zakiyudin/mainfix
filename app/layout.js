import "./globals.css";

export const metadata = {
	title: "MainFix",
	description: "Sistem Permintaan Perbaikan & Maintenance Mesin",
	manifest: "/manifest.webmanifest",
	appleWebApp: {
		capable: true,
		statusBarStyle: "default",
		title: "MainFix",
	},
	icons: {
		icon: [
			{ url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
			{ url: "/icons/favicon-16.png", sizes: "16x16", type: "image/png" },
		],
		apple: "/icons/apple-touch-icon.png",
	},
};

export const viewport = {
	themeColor: "#2563eb",
	width: "device-width",
	initialScale: 1,
	maximumScale: 1,
};

export default function RootLayout({ children }) {
	return (
		<html lang="id" suppressHydrationWarning>
			<body suppressHydrationWarning>{children}</body>
		</html>
	);
}
