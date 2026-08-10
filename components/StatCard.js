export default function StatCard({ label, value, color = "#111827" }) {
	return (
		<div
			style={{
				background: "#fff",
				border: "1px solid #e5e7eb",
				borderRadius: "6px",
				padding: "12px 14px",
			}}
		>
			<div style={{ fontSize: "22px", fontWeight: 700, color, lineHeight: 1 }}>
				{value}
			</div>
			<div
				style={{
					fontSize: "10px",
					fontWeight: 600,
					color: "#9ca3af",
					textTransform: "uppercase",
					letterSpacing: ".3px",
					marginTop: "3px",
				}}
			>
				{label}
			</div>
		</div>
	);
}
