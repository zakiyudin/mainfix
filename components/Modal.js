"use client";

export default function Modal({ title, onClose, children, footer }) {
	return (
		<div
			onClick={(e) => e.target === e.currentTarget && onClose()}
			style={{
				position: "fixed",
				inset: 0,
				background: "rgba(0,0,0,.35)",
				zIndex: 100,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				padding: "16px",
			}}
		>
			<div
				style={{
					background: "#fff",
					borderRadius: "8px",
					border: "1px solid #e5e7eb",
					width: "100%",
					maxWidth: "480px",
					maxHeight: "90vh",
					overflow: "hidden",
					display: "flex",
					flexDirection: "column",
					boxShadow: "0 20px 60px rgba(0,0,0,.15)",
				}}
			>
				{/* Header */}
				<div
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						padding: "12px 16px",
						borderBottom: "1px solid #e5e7eb",
						flexShrink: 0,
					}}
				>
					<div style={{ fontSize: "14px", fontWeight: 600 }}>{title}</div>
					<button
						onClick={onClose}
						style={{
							background: "none",
							border: "none",
							fontSize: "18px",
							cursor: "pointer",
							color: "#9ca3af",
							padding: "2px 4px",
							lineHeight: 1,
						}}
					>
						✕
					</button>
				</div>

				{/* Body */}
				<div style={{ padding: "16px", overflowY: "auto", flex: 1 }}>
					{children}
				</div>

				{/* Footer */}
				{footer && (
					<div
						style={{
							padding: "10px 16px",
							borderTop: "1px solid #e5e7eb",
							display: "flex",
							justifyContent: "flex-end",
							gap: "8px",
							flexShrink: 0,
						}}
					>
						{footer}
					</div>
				)}
			</div>
		</div>
	);
}
