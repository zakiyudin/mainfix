const VARIANTS = {
	primary: { bg: "#2563eb", color: "#fff", border: "#2563eb" },
	success: { bg: "#16a34a", color: "#fff", border: "#16a34a" },
	danger: { bg: "#fff", color: "#dc2626", border: "#fca5a5" },
	ghost: { bg: "#fff", color: "#6b7280", border: "#e5e7eb" },
};

export default function Btn({
	children,
	onClick,
	variant = "ghost",
	disabled,
	type = "button",
	small,
}) {
	const v = VARIANTS[variant];
	return (
		<button
			type={type}
			onClick={onClick}
			disabled={disabled}
			style={{
				fontSize: small ? "11px" : "13px",
				fontWeight: 500,
				padding: small ? "4px 10px" : "7px 14px",
				borderRadius: "6px",
				cursor: disabled ? "not-allowed" : "pointer",
				border: `1px solid ${v.border}`,
				background: v.bg,
				color: v.color,
				opacity: disabled ? 0.6 : 1,
				fontFamily: "inherit",
				whiteSpace: "nowrap",
				display: "inline-flex",
				alignItems: "center",
				gap: "5px",
			}}
		>
			{children}
		</button>
	);
}
