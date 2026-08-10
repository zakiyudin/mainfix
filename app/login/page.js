"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const next = searchParams.get("next");

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	async function handleLogin(e) {
		e.preventDefault();
		setError("");
		setLoading(true);

		try {
			const res = await fetch("/api/auth/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, password, next }),
			});
			const data = await res.json();

			if (!res.ok) {
				setError(data.error);
				return;
			}

			router.push(data.redirect);
			router.refresh();
		} catch {
			setError("Tidak bisa terhubung ke server.");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div
			style={{
				minHeight: "100vh",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				background: "#f3f4f6",
				padding: "16px",
			}}
		>
			<div
				style={{
					background: "#fff",
					border: "1px solid #e5e7eb",
					borderRadius: "8px",
					padding: "32px",
					width: "100%",
					maxWidth: "360px",
					boxShadow: "0 1px 3px rgba(0,0,0,.07)",
				}}
			>
				{/* Logo */}
				<div style={{ marginBottom: "24px" }}>
					<div style={{ fontSize: "22px", fontWeight: 700 }}>
						Main<span style={{ color: "#2563eb" }}>Fix</span>
					</div>
					<div style={{ fontSize: "13px", color: "#6b7280", marginTop: "2px" }}>
						Sistem Permintaan Perbaikan Mesin
					</div>
				</div>

				{/* Error */}
				{error && (
					<div
						style={{
							background: "#fef2f2",
							border: "1px solid #fca5a5",
							color: "#dc2626",
							borderRadius: "6px",
							padding: "10px 12px",
							fontSize: "13px",
							marginBottom: "16px",
						}}
					>
						{error}
					</div>
				)}

				{/* Form */}
				<form onSubmit={handleLogin}>
					<div style={{ marginBottom: "14px" }}>
						<label
							style={{
								display: "block",
								fontSize: "12px",
								fontWeight: 500,
								color: "#374151",
								marginBottom: "5px",
							}}
						>
							Email
						</label>
						<input
							type="email"
							required
							value={email}
							onChange={(e) => {
								setEmail(e.target.value);
								setError("");
							}}
							placeholder="nama@perusahaan.com"
							style={{
								width: "100%",
								padding: "8px 10px",
								border: "1px solid #d1d5db",
								borderRadius: "6px",
								fontSize: "14px",
								outline: "none",
								fontFamily: "inherit",
							}}
							onFocus={(e) => (e.target.style.borderColor = "#2563eb")}
							onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
						/>
					</div>

					<div style={{ marginBottom: "20px" }}>
						<label
							style={{
								display: "block",
								fontSize: "12px",
								fontWeight: 500,
								color: "#374151",
								marginBottom: "5px",
							}}
						>
							Password
						</label>
						<input
							type="password"
							required
							value={password}
							onChange={(e) => {
								setPassword(e.target.value);
								setError("");
							}}
							placeholder="••••••••"
							style={{
								width: "100%",
								padding: "8px 10px",
								border: "1px solid #d1d5db",
								borderRadius: "6px",
								fontSize: "14px",
								outline: "none",
								fontFamily: "inherit",
							}}
							onFocus={(e) => (e.target.style.borderColor = "#2563eb")}
							onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
						/>
					</div>

					<button
						type="submit"
						disabled={loading}
						style={{
							width: "100%",
							padding: "9px",
							background: loading ? "#93c5fd" : "#2563eb",
							color: "#fff",
							border: "none",
							borderRadius: "6px",
							fontSize: "14px",
							fontWeight: 600,
							cursor: loading ? "not-allowed" : "pointer",
							fontFamily: "inherit",
						}}
					>
						{loading ? "Masuk..." : "Masuk"}
					</button>
				</form>

				<div
					style={{
						marginTop: "20px",
						fontSize: "11px",
						color: "#9ca3af",
						textAlign: "center",
					}}
				>
					Hubungi IT Support jika tidak bisa masuk
				</div>
			</div>
		</div>
	);
}

export default function LoginPage() {
	return (
		<Suspense fallback={null}>
			<LoginForm />
		</Suspense>
	);
}
