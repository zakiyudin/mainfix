"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import Btn from "@/components/Btn";

const cardStyle = {
	background: "#fff",
	border: "1px solid #e5e7eb",
	borderRadius: "8px",
};

export default function QrGeneratorClient({ machines }) {
	const searchParams = useSearchParams();
	const [selectedId, setSelectedId] = useState("");
	const [items, setItems] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [origin, setOrigin] = useState("");
	const [pmActivities, setPmActivities] = useState([]);

	const selectedMachine = machines.find((m) => m.id === selectedId);

	useEffect(() => {
		setOrigin(process.env.NEXT_PUBLIC_SITE_URL || window.location.origin);
		const preselect = searchParams.get("machine_id");
		if (preselect) handleSelect(preselect);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	async function handleSelect(id) {
		setSelectedId(id);
		setError("");
		if (!id) {
			setItems([]);
			return;
		}
		setLoading(true);
		try {
			const res = await fetch(
				`/api/am-checklists/machine-items?machine_id=${id}`,
			);
			const json = await res.json();
			if (!res.ok) throw new Error(json.error);
			setItems(json.items || []);

			const pmRes = await fetch(`/api/admin/pm-mapping?machine_id=${id}`);
			const pmJson = await pmRes.json();
			if (pmRes.ok) setPmActivities(pmJson.activities || []);
		} catch (e) {
			setError(e.message || "Gagal memuat item checklist mesin ini.");
		} finally {
			setLoading(false);
		}
	}

	function handlePrint() {
		window.print();
	}

	return (
		<div style={{ maxWidth: "900px", margin: "0 auto", padding: "20px 16px" }}>
			<style>{`
				@media print {
					.no-print { display: none !important; }
					.print-area { display: block !important; }
					.qr-card {
						break-inside: avoid;
						page-break-inside: avoid;
					}
				}
				.print-area { display: none; }
			`}</style>

			<div className="no-print" style={{ marginBottom: "16px" }}>
				<div style={{ fontSize: "17px", fontWeight: 700, color: "#111827" }}>
					Generate QR Code
				</div>
				<div style={{ fontSize: "13px", color: "#6b7280" }}>
					QR mesin dan aktivitas checklist untuk dicetak dan ditempel
				</div>
			</div>

			<div
				className="no-print"
				style={{ ...cardStyle, padding: "16px", marginBottom: "16px" }}
			>
				<label
					style={{
						fontSize: "12px",
						fontWeight: 600,
						color: "#374151",
						marginBottom: "8px",
						display: "block",
					}}
				>
					Pilih Mesin
				</label>
				<select
					value={selectedId}
					onChange={(e) => handleSelect(e.target.value)}
					style={{
						width: "100%",
						fontSize: "13px",
						padding: "8px 10px",
						borderRadius: "6px",
						border: "1px solid #e5e7eb",
						fontFamily: "inherit",
					}}
				>
					<option value="">Pilih mesin...</option>
					{machines.map((m) => (
						<option key={m.id} value={m.id}>
							{m.name} ({m.code}) · {m.divisi}
						</option>
					))}
				</select>

				{error && (
					<div
						style={{ fontSize: "12px", color: "#dc2626", marginTop: "10px" }}
					>
						{error}
					</div>
				)}

				{selectedMachine && (
					<Btn
						variant="primary"
						onClick={handlePrint}
						disabled={loading}
						small={false}
					>
						🖨️ Cetak Semua QR Mesin Ini
					</Btn>
				)}
			</div>

			{loading && (
				<div
					style={{
						fontSize: "13px",
						color: "#9ca3af",
						textAlign: "center",
						padding: "20px",
					}}
				>
					Memuat item checklist...
				</div>
			)}

			{selectedMachine && !loading && (
				<>
					{/* Preview di layar (tidak print) */}
					<div className="no-print">
						<div
							style={{
								fontSize: "12px",
								fontWeight: 700,
								color: "#374151",
								textTransform: "uppercase",
								marginBottom: "10px",
							}}
						>
							Preview
						</div>
						<div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
							<QrCard
								title={selectedMachine.name}
								subtitle={`${selectedMachine.code} · MESIN`}
								value={`${origin}/am/${selectedMachine.id}`}
							/>
							{items.map((item) => (
								<QrCard
									key={item.id}
									title={item.check_code || "Aktivitas"}
									subtitle={item.item_text}
									value={`${origin}/am/${selectedMachine.id}/item/${item.id}`}
								/>
							))}
						</div>
						{items.length === 0 && (
							<div
								style={{
									fontSize: "13px",
									color: "#9ca3af",
									marginTop: "10px",
								}}
							>
								Mesin ini belum punya item checklist yang di-assign. Atur dulu
								di halaman Setup Checklist AM.
							</div>
						)}
					</div>

					{/* Layout khusus print */}
					<div className="print-area">
						<div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
							<PrintQrCard
								title={selectedMachine.name}
								subtitle={`${selectedMachine.code} · MESIN`}
								value={`${origin}/am/${selectedMachine.id}`}
							/>
							{items.map((item) => (
								<PrintQrCard
									key={item.id}
									title={item.check_code || "Aktivitas"}
									subtitle={item.item_text}
									value={`${origin}/am/${selectedMachine.id}/item/${item.id}`}
								/>
							))}
							{pmActivities.map((a) => (
								<PrintQrCard
									key={a.id}
									title="PM"
									subtitle={a.activity_text}
									value={`${origin}/pm/${selectedMachine.id}/activity/${a.id}`}
								/>
							))}
						</div>
					</div>
				</>
			)}
		</div>
	);
}

function QrCard({ title, subtitle, value }) {
	return (
		<div
			style={{
				...cardStyle,
				padding: "14px",
				width: "160px",
				textAlign: "center",
			}}
		>
			<QRCodeSVG value={value} size={120} />
			<div
				style={{
					fontSize: "12px",
					fontWeight: 700,
					color: "#111827",
					marginTop: "8px",
				}}
			>
				{title}
			</div>
			<div style={{ fontSize: "10px", color: "#9ca3af", marginTop: "2px" }}>
				{subtitle}
			</div>
		</div>
	);
}

function PrintQrCard({ title, subtitle, value }) {
	return (
		<div
			className="qr-card"
			style={{
				border: "1px solid #000",
				padding: "10px",
				width: "160px",
				textAlign: "center",
			}}
		>
			<QRCodeSVG value={value} size={120} />
			<div style={{ fontSize: "11px", fontWeight: 700, marginTop: "6px" }}>
				{title}
			</div>
			<div style={{ fontSize: "9px", color: "#444", marginTop: "2px" }}>
				{subtitle}
			</div>
		</div>
	);
}
