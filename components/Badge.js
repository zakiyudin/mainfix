const STATUS = {
	pending: { label: "Pending", bg: "#fffbeb", color: "#d97706" },
	approved: { label: "Approved", bg: "#eff6ff", color: "#2563eb" },
	in_progress: { label: "In Progress", bg: "#f0fdf4", color: "#16a34a" },
	closed: { label: "Selesai", bg: "#f3f4f6", color: "#6b7280" },
	rejected: { label: "Ditolak", bg: "#fef2f2", color: "#dc2626" },
};

const PRIORITY = {
	Low: { bg: "#f0fdf4", color: "#15803d" },
	Medium: { bg: "#eff6ff", color: "#2563eb" },
	High: { bg: "#fffbeb", color: "#d97706" },
	Critical: { bg: "#fef2f2", color: "#dc2626" },
};

export function StatusBadge({ status }) {
	const s = STATUS[status] || {
		label: status,
		bg: "#f3f4f6",
		color: "#6b7280",
	};
	return (
		<span
			style={{
				fontSize: "11px",
				fontWeight: 600,
				padding: "2px 7px",
				borderRadius: "4px",
				background: s.bg,
				color: s.color,
				whiteSpace: "nowrap",
			}}
		>
			{s.label}
		</span>
	);
}

export function PriorityBadge({ priority }) {
	const p = PRIORITY[priority] || { bg: "#f3f4f6", color: "#6b7280" };
	return (
		<span
			style={{
				fontSize: "11px",
				fontWeight: 600,
				padding: "2px 7px",
				borderRadius: "4px",
				background: p.bg,
				color: p.color,
				whiteSpace: "nowrap",
			}}
		>
			{priority}
		</span>
	);
}

export function StopBadge({ value }) {
	return (
		<span
			style={{
				fontSize: "11px",
				fontWeight: 700,
				padding: "2px 7px",
				borderRadius: "4px",
				background: value === "Yes" ? "#fef2f2" : "#f3f4f6",
				color: value === "Yes" ? "#dc2626" : "#6b7280",
			}}
		>
			{value}
		</span>
	);
}
