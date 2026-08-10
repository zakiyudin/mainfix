"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

const ROLE_LABEL = {
	operator: { label: "Operator", bg: "#eff6ff", color: "#2563eb" },
	supervisor: { label: "Supervisor", bg: "#fef3c7", color: "#92400e" },
	technician: { label: "Teknisi", bg: "#f0fdf4", color: "#16a34a" },
	admin: { label: "Admin", bg: "#fef2f2", color: "#dc2626" },
};

const MENU_BY_ROLE = {
	operator: [{ href: "/requests", label: "Request Perbaikan" }],
	supervisor: [
		{ href: "/dashboard", label: "Dashboard" },
		{ href: "/am-monitoring", label: "Monitoring AM" },
		{ href: "/pm-schedules", label: "Jadwal PM" },
	],
	technician: [{ href: "/technician", label: "Tugas Teknisi" }],
	admin: [
		{ href: "/dashboard", label: "Dashboard" },
		{ href: "/am-monitoring", label: "Monitoring AM" },
		{ href: "/pm-schedules", label: "Jadwal PM" },
		{ href: "/admin/am-setup", label: "Setup Checklist AM" },
		{ href: "/admin/pm-setup", label: "Setup PM" },
		{ href: "/admin/qr-generator", label: "Generate QR Code" },
	],
};

export default function Topbar({ user }) {
	const router = useRouter();
	const pathname = usePathname();
	const [menuOpen, setMenuOpen] = useState(false);
	const menuRef = useRef(null);

	const role = ROLE_LABEL[user?.role] || {
		label: user?.role,
		bg: "#f3f4f6",
		color: "#6b7280",
	};
	const menuItems = MENU_BY_ROLE[user?.role] || [];

	useEffect(() => {
		function handleClickOutside(e) {
			if (menuRef.current && !menuRef.current.contains(e.target)) {
				setMenuOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	useEffect(() => {
		setMenuOpen(false);
	}, [pathname]);

	async function handleLogout() {
		await fetch("/api/auth/logout", { method: "POST" });
		router.push("/login");
		router.refresh();
	}

	return (
		<div
			style={{
				background: "#fff",
				borderBottom: "1px solid #e5e7eb",
				padding: "0 16px",
				height: "48px",
				display: "flex",
				alignItems: "center",
				justifyContent: "space-between",
				position: "sticky",
				top: 0,
				zIndex: 50,
			}}
		>
			<div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
				{menuItems.length > 0 && (
					<div ref={menuRef} style={{ position: "relative" }}>
						<button
							onClick={() => setMenuOpen((o) => !o)}
							aria-label="Menu"
							style={{
								background: "none",
								border: "none",
								cursor: "pointer",
								padding: "6px",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								borderRadius: "6px",
								color: "#374151",
							}}
						>
							<svg
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
							>
								<line x1="3" y1="6" x2="21" y2="6" />
								<line x1="3" y1="12" x2="21" y2="12" />
								<line x1="3" y1="18" x2="21" y2="18" />
							</svg>
						</button>

						{menuOpen && (
							<div
								style={{
									position: "absolute",
									top: "36px",
									left: 0,
									background: "#fff",
									border: "1px solid #e5e7eb",
									borderRadius: "8px",
									boxShadow: "0 8px 24px rgba(0,0,0,.12)",
									minWidth: "200px",
									overflow: "hidden",
									zIndex: 60,
								}}
							>
								{menuItems.map((item) => {
									const active = pathname === item.href;
									return (
										<Link
											key={item.href}
											href={item.href}
											style={{
												display: "block",
												padding: "10px 14px",
												fontSize: "13px",
												fontWeight: active ? 600 : 400,
												color: active ? "#2563eb" : "#374151",
												background: active ? "#eff6ff" : "transparent",
												textDecoration: "none",
												borderBottom: "1px solid #f3f4f6",
											}}
										>
											{item.label}
										</Link>
									);
								})}
							</div>
						)}
					</div>
				)}

				<div style={{ fontWeight: 700, fontSize: "15px" }}>
					Main<span style={{ color: "#2563eb" }}>Fix</span>
				</div>
			</div>

			<div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
				<span style={{ fontSize: "13px", color: "#6b7280" }}>
					{user?.full_name}
				</span>
				<span
					style={{
						fontSize: "11px",
						fontWeight: 600,
						padding: "2px 8px",
						borderRadius: "20px",
						background: role.bg,
						color: role.color,
					}}
				>
					{role.label}
				</span>
				<button
					onClick={handleLogout}
					style={{
						fontSize: "12px",
						padding: "4px 10px",
						border: "1px solid #e5e7eb",
						borderRadius: "6px",
						background: "#fff",
						color: "#6b7280",
						cursor: "pointer",
						fontFamily: "inherit",
					}}
				>
					Keluar
				</button>
			</div>
		</div>
	);
}
