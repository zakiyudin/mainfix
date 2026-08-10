"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Btn from "@/components/Btn";

const SHIFTS = ["Pagi", "Siang", "Malam"];

const cardStyle = {
	background: "#fff",
	border: "1px solid #e5e7eb",
	borderRadius: "8px",
	padding: "16px",
};

export default function AmChecklistClient({ machine }) {
	const [shift, setShift] = useState("");
	const [items, setItems] = useState([]);
	const [hasil, setHasil] = useState({});
	const [loadingItems, setLoadingItems] = useState(false);
	const [alreadySubmitted, setAlreadySubmitted] = useState(false);
	const [photo, setPhoto] = useState(null);
	const [photoPreview, setPhotoPreview] = useState(null);
	const [uploading, setUploading] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState(null);

	async function selectShift(s) {
		setShift(s);
		setError("");
		setSuccess(null);
		setLoadingItems(true);
		try {
			const res = await fetch(
				`/api/am-checklists/items?machine_id=${machine.id}&shift=${s}`,
			);
			const json = await res.json();
			if (!res.ok) {
				setError(json.error || "Gagal memuat checklist.");
				return;
			}
			setItems(json.items || []);
			setAlreadySubmitted(json.already_submitted);
			const initHasil = {};
			(json.items || []).forEach((it) => {
				initHasil[it.id] = { kondisi: "OK", catatan: "" };
			});
			setHasil(initHasil);
		} catch {
			setError("Gagal memuat checklist.");
		} finally {
			setLoadingItems(false);
		}
	}

	function updateKondisi(itemId, kondisi) {
		setHasil((prev) => ({ ...prev, [itemId]: { ...prev[itemId], kondisi } }));
	}

	function updateCatatan(itemId, catatan) {
		setHasil((prev) => ({ ...prev, [itemId]: { ...prev[itemId], catatan } }));
	}

	function handlePhotoChange(e) {
		const file = e.target.files?.[0];
		if (!file) return;
		setPhoto(file);
		setPhotoPreview(URL.createObjectURL(file));
	}

	async function uploadPhoto() {
		const supabase = createClient();
		const ext = photo.name.split(".").pop() || "jpg";
		const path = `${machine.id}/${Date.now()}.${ext}`;

		const { error: uploadError } = await supabase.storage
			.from("am-photos")
			.upload(path, photo);

		if (uploadError) throw new Error("Gagal upload foto: " + uploadError.message);

		const { data } = supabase.storage.from("am-photos").getPublicUrl(path);
		return data.publicUrl;
	}

	async function handleSubmit() {
		setError("");

		if (!shift) return setError("Pilih shift dulu.");
		if (!photo) return setError("Foto bukti wajib diupload.");

		const invalidAbnormal = items.find(
			(it) => hasil[it.id]?.kondisi === "Tidak OK" && !hasil[it.id]?.catatan?.trim(),
		);
		if (invalidAbnormal)
			return setError(`Catatan wajib diisi untuk "${invalidAbnormal.item_text}".`);

		setUploading(true);
		let foto_url;
		try {
			foto_url = await uploadPhoto();
		} catch (e) {
			setError(e.message);
			setUploading(false);
			return;
		}
		setUploading(false);

		setSubmitting(true);
		try {
			const payload = {
				machine_id: machine.id,
				shift,
				foto_url,
				hasil: items.map((it) => ({
					item_id: it.id,
					item_text: it.item_text,
					kondisi: hasil[it.id]?.kondisi || "OK",
					catatan: hasil[it.id]?.catatan || "",
				})),
			};

			const res = await fetch("/api/am-checklists", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			const json = await res.json();

			if (!res.ok) {
				setError(json.error || "Gagal submit checklist.");
				return;
			}

			setSuccess(json);
		} catch {
			setError("Terjadi kesalahan. Coba lagi.");
		} finally {
			setSubmitting(false);
		}
	}

	if (success) {
		return (
			<div style={{ maxWidth: "480px", margin: "40px auto", padding: "0 16px" }}>
				<div style={{ ...cardStyle, textAlign: "center" }}>
					<div style={{ fontSize: "32px", marginBottom: "10px" }}>✅</div>
					<div style={{ fontSize: "15px", fontWeight: 700, marginBottom: "6px" }}>
						Checklist Tersimpan
					</div>
					<div style={{ fontSize: "13px", color: "#6b7280" }}>
						{success.requestsCreated > 0
							? `${success.requestsCreated} temuan otomatis dikirim sebagai request perbaikan.`
							: "Semua item dalam kondisi baik."}
					</div>
				</div>
			</div>
		);
	}

	return (
		<div style={{ maxWidth: "480px", margin: "0 auto", padding: "20px 16px" }}>
			<div style={{ marginBottom: "16px" }}>
				<div style={{ fontSize: "17px", fontWeight: 700, color: "#111827" }}>
					{machine.name}
				</div>
				<div style={{ fontSize: "13px", color: "#6b7280" }}>
					{machine.code} · {machine.divisi} · Checklist Autonomous Maintenance
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
				<div style={{ fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "8px" }}>
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

			{loadingItems && (
				<div style={{ fontSize: "13px", color: "#9ca3af", textAlign: "center", padding: "20px" }}>
					Memuat checklist...
				</div>
			)}

			{shift && !loadingItems && alreadySubmitted && (
				<div style={{ ...cardStyle, textAlign: "center", color: "#6b7280", fontSize: "13px" }}>
					Checklist shift {shift} untuk mesin ini sudah diisi hari ini.
				</div>
			)}

			{shift && !loadingItems && !alreadySubmitted && items.length === 0 && (
				<div style={{ ...cardStyle, textAlign: "center", color: "#9ca3af", fontSize: "13px" }}>
					Belum ada checklist yang di-setup untuk mesin ini. Hubungi admin.
				</div>
			)}

			{shift && !loadingItems && !alreadySubmitted && items.length > 0 && (
				<>
					<div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
						{items.map((it) => (
							<div key={it.id} style={cardStyle}>
								<div style={{ fontSize: "13px", fontWeight: 600, color: "#111827", marginBottom: "8px" }}>
									{it.item_text}
								</div>
								<div style={{ display: "flex", gap: "8px", marginBottom: hasil[it.id]?.kondisi === "Tidak OK" ? "8px" : 0 }}>
									{["OK", "Tidak OK"].map((k) => (
										<button
											key={k}
											onClick={() => updateKondisi(it.id, k)}
											style={{
												flex: 1,
												fontSize: "12px",
												fontWeight: 600,
												padding: "7px",
												borderRadius: "6px",
												cursor: "pointer",
												fontFamily: "inherit",
												border:
													hasil[it.id]?.kondisi === k
														? k === "OK"
															? "1px solid #16a34a"
															: "1px solid #dc2626"
														: "1px solid #e5e7eb",
												background:
													hasil[it.id]?.kondisi === k
														? k === "OK"
															? "#f0fdf4"
															: "#fef2f2"
														: "#fff",
												color:
													hasil[it.id]?.kondisi === k
														? k === "OK"
															? "#16a34a"
															: "#dc2626"
														: "#6b7280",
											}}
										>
											{k}
										</button>
									))}
								</div>
								{hasil[it.id]?.kondisi === "Tidak OK" && (
									<textarea
										value={hasil[it.id]?.catatan || ""}
										onChange={(e) => updateCatatan(it.id, e.target.value)}
										placeholder="Jelaskan temuannya..."
										style={{
											width: "100%",
											fontSize: "13px",
											padding: "7px 10px",
											borderRadius: "6px",
											border: "1px solid #fca5a5",
											fontFamily: "inherit",
											minHeight: "50px",
											resize: "vertical",
											boxSizing: "border-box",
										}}
									/>
								)}
							</div>
						))}
					</div>

					<div style={{ ...cardStyle, marginBottom: "16px" }}>
						<div style={{ fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "8px" }}>
							Foto Bukti (wajib)
						</div>
						{photoPreview ? (
							<img
								src={photoPreview}
								alt="preview"
								style={{ width: "100%", borderRadius: "6px", marginBottom: "8px" }}
							/>
						) : null}
						<input
							type="file"
							accept="image/*"
							capture="environment"
							onChange={handlePhotoChange}
							style={{ fontSize: "13px" }}
						/>
					</div>

					<Btn
						variant="primary"
						onClick={handleSubmit}
						disabled={uploading || submitting}
					>
						{uploading ? "Mengupload foto..." : submitting ? "Menyimpan..." : "Submit Checklist"}
					</Btn>
				</>
			)}
		</div>
	);
}