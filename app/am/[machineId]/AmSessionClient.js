"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Btn from "@/components/Btn";

const SHIFTS = ["Pagi", "Siang", "Malam"];
const STATUS_MESIN = ["Mati", "Hidup", "Standby"];

const cardStyle = {
	background: "#fff",
	border: "1px solid #e5e7eb",
	borderRadius: "8px",
	padding: "16px",
};

export default function AmSessionClient({ machine }) {
	const [shift, setShift] = useState("");
	const [checking, setChecking] = useState(false);
	const [session, setSession] = useState(null);
	const [lines, setLines] = useState([]);
	const [items, setItems] = useState([]);
	const [error, setError] = useState("");

	const [statusMesin, setStatusMesin] = useState("");
	const [submitting, setSubmitting] = useState(false);

	// const [finishPhoto, setFinishPhoto] = useState(null);
	// const [finishPreview, setFinishPreview] = useState(null);
	// const [finishing, setFinishing] = useState(false);

	async function refreshSession(s) {
		const [sessionRes, itemsRes] = await Promise.all([
			fetch(`/api/am-checklists/session?machine_id=${machine.id}&shift=${s}`),
			fetch(`/api/am-checklists/machine-items?machine_id=${machine.id}`),
		]);
		const sessionJson = await sessionRes.json();
		const itemsJson = await itemsRes.json();

		if (!sessionRes.ok) throw new Error(sessionJson.error);
		if (!itemsRes.ok) throw new Error(itemsJson.error);

		setItems(itemsJson.items || []);
		if (sessionJson.exists) {
			setSession(sessionJson.session);
			setLines(sessionJson.lines || []);
		} else {
			setSession(null);
			setLines([]);
		}
	}

	async function selectShift(s) {
		setShift(s);
		setError("");
		setChecking(true);
		try {
			await refreshSession(s);
		} catch (e) {
			setError(e.message || "Gagal memuat data.");
		} finally {
			setChecking(false);
		}
	}

	async function handleStartSession() {
		setError("");
		if (!statusMesin) return setError("Pilih status mesin dulu.");

		setSubmitting(true);
		try {
			const res = await fetch("/api/am-checklists", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					machine_id: machine.id,
					shift,
					status_mesin: statusMesin,
				}),
			});
			const json = await res.json();
			if (!res.ok) throw new Error(json.error);

			setSession(json.data);
			setLines([]);
		} catch (e) {
			setError(e.message || "Terjadi kesalahan.");
		} finally {
			setSubmitting(false);
		}
	}

	// function handleFinishPhotoChange(e) {
	// 	const file = e.target.files?.[0];
	// 	if (!file) return;
	// 	setFinishPhoto(file);
	// 	setFinishPreview(URL.createObjectURL(file));
	// }

	// async function handleFinish() {
	// 	setError("");
	// 	if (!finishPhoto) return setError("Foto bukti wajib diupload.");

	// 	setFinishing(true);
	// 	try {
	// 		const sb = createClient();
	// 		const ext = finishPhoto.name.split(".").pop() || "jpg";
	// 		const path = `${machine.id}/session-${session.id}-${Date.now()}.${ext}`;
	// 		const { error: upErr } = await sb.storage
	// 			.from("am-photos")
	// 			.upload(path, finishPhoto);
	// 		if (upErr) throw new Error("Gagal upload foto: " + upErr.message);
	// 		const { data: pub } = sb.storage.from("am-photos").getPublicUrl(path);

	// 		const res = await fetch(`/api/am-checklists/${session.id}`, {
	// 			method: "PATCH",
	// 			headers: { "Content-Type": "application/json" },
	// 			body: JSON.stringify({ foto_url: pub.publicUrl }),
	// 		});
	// 		const json = await res.json();
	// 		if (!res.ok) throw new Error(json.error);

	// 		setSession(json.data);
	// 	} catch (e) {
	// 		setError(e.message || "Terjadi kesalahan.");
	// 	} finally {
	// 		setFinishing(false);
	// 	}
	// }

	const allDone = items.length > 0 && lines.length === items.length;

	return (
		<div style={{ maxWidth: "480px", margin: "0 auto", padding: "20px 16px" }}>
			<div style={{ marginBottom: "16px" }}>
				<div style={{ fontSize: "17px", fontWeight: 700, color: "#111827" }}>
					{machine.name}
				</div>
				<div style={{ fontSize: "13px", color: "#6b7280" }}>
					{machine.code} · {machine.divisi} · Autonomous Maintenance
				</div>
			</div>

			{error && (
				<div
					style={{
						background: "#fef2f2",
						color: "#dc2626",
						fontSize: "12px",
						padding: "8px 10px",
						borderRadius: "6px",
						marginBottom: "14px",
					}}
				>
					{error}
				</div>
			)}

			<div style={{ ...cardStyle, marginBottom: "12px" }}>
				<div
					style={{
						fontSize: "12px",
						fontWeight: 600,
						color: "#374151",
						marginBottom: "8px",
					}}
				>
					Pilih Shift
				</div>
				<div style={{ display: "flex", gap: "8px" }}>
					{SHIFTS.map((s) => (
						<button
							key={s}
							onClick={() => selectShift(s)}
							style={{
								flex: 1,
								fontSize: "13px",
								fontWeight: 600,
								padding: "8px",
								borderRadius: "6px",
								cursor: "pointer",
								fontFamily: "inherit",
								border: shift === s ? "1px solid #2563eb" : "1px solid #e5e7eb",
								background: shift === s ? "#eff6ff" : "#fff",
								color: shift === s ? "#2563eb" : "#6b7280",
							}}
						>
							{s}
						</button>
					))}
				</div>
			</div>

			{checking && (
				<div
					style={{
						fontSize: "13px",
						color: "#9ca3af",
						textAlign: "center",
						padding: "20px",
					}}
				>
					Memuat...
				</div>
			)}

			{shift && !checking && !session && (
				<div style={cardStyle}>
					<div
						style={{ fontSize: "13px", fontWeight: 600, marginBottom: "10px" }}
					>
						Mulai Checklist Shift {shift}
					</div>
					<div style={{ marginBottom: "14px" }}>
						<label
							style={{
								fontSize: "12px",
								fontWeight: 600,
								color: "#374151",
								marginBottom: "6px",
								display: "block",
							}}
						>
							Status Mesin
						</label>
						<div style={{ display: "flex", gap: "8px" }}>
							{STATUS_MESIN.map((s) => (
								<button
									key={s}
									onClick={() => setStatusMesin(s)}
									style={{
										flex: 1,
										fontSize: "12px",
										fontWeight: 600,
										padding: "7px",
										borderRadius: "6px",
										cursor: "pointer",
										fontFamily: "inherit",
										border:
											statusMesin === s
												? "1px solid #2563eb"
												: "1px solid #e5e7eb",
										background: statusMesin === s ? "#eff6ff" : "#fff",
										color: statusMesin === s ? "#2563eb" : "#6b7280",
									}}
								>
									{s}
								</button>
							))}
						</div>
					</div>
					<Btn
						variant="primary"
						onClick={handleStartSession}
						disabled={submitting}
					>
						{submitting ? "Menyimpan..." : "Mulai Checklist"}
					</Btn>
				</div>
			)}

			{shift && !checking && session && (
				<div>
					<div style={{ ...cardStyle, marginBottom: "12px" }}>
						<div style={{ fontSize: "12px", color: "#6b7280" }}>
							Status Mesin:{" "}
							<strong style={{ color: "#111827" }}>
								{session.status_mesin}
							</strong>
						</div>
						<div
							style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}
						>
							Diisi oleh {session.operator_nama}
						</div>
					</div>

					<div
						style={{
							fontSize: "12px",
							fontWeight: 700,
							color: "#374151",
							textTransform: "uppercase",
							marginBottom: "8px",
						}}
					>
						Line Detail Aktivitas ({lines.length}/{items.length})
					</div>

					<div
						style={{
							display: "flex",
							flexDirection: "column",
							gap: "6px",
							marginBottom: "16px",
						}}
					>
						{items.map((item) => {
							const done = lines.find((l) => l.item_id === item.id);
							return (
								<div
									key={item.id}
									style={{
										...cardStyle,
										padding: "10px 12px",
										display: "flex",
										justifyContent: "space-between",
										alignItems: "center",
										gap: "8px",
									}}
								>
									<div>
										<div
											style={{
												fontSize: "13px",
												fontWeight: 600,
												color: "#111827",
											}}
										>
											{item.check_code ? `${item.check_code} · ` : ""}
											{item.item_text}
										</div>
										{done && (
											<div
												style={{
													fontSize: "11px",
													color: done.kondisi === "OK" ? "#16a34a" : "#dc2626",
													marginTop: "2px",
												}}
											>
												{done.kondisi}
											</div>
										)}
									</div>
									{done ? (
										<span style={{ fontSize: "16px" }}>✅</span>
									) : (
										<a
											href={`/am/${machine.id}/item/${item.id}?shift=${shift}`}
											style={{
												fontSize: "12px",
												fontWeight: 600,
												padding: "6px 12px",
												borderRadius: "6px",
												background: "#2563eb",
												color: "#fff",
												textDecoration: "none",
											}}
										>
											Isi
										</a>
									)}
								</div>
							);
						})}
					</div>

					{allDone && (
						<div
							style={{
								...cardStyle,
								textAlign: "center",
								color: "#16a34a",
								fontSize: "13px",
								fontWeight: 600,
							}}
						>
							✅ Semua aktivitas sudah diisi
						</div>
					)}
				</div>
			)}
		</div>
	);
}
