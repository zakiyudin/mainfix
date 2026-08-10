"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Btn from "@/components/Btn";

const cardStyle = {
	background: "#fff",
	border: "1px solid #e5e7eb",
	borderRadius: "8px",
	padding: "16px",
};

export default function AmItemClient({ machine, item, checklistId }) {
	const router = useRouter();
	const [kondisi, setKondisi] = useState("");
	const [catatan, setCatatan] = useState("");
	const [photo, setPhoto] = useState(null);
	const [photoPreview, setPhotoPreview] = useState(null);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState(null);
	const fileInputRef = useRef(null);

	function handlePhotoChange(e) {
		const file = e.target.files?.[0];
		if (!file) return;
		setPhoto(file);
		setPhotoPreview(URL.createObjectURL(file));
	}

	async function handleSubmit() {
		setError("");
		if (!kondisi) return setError("Pilih kondisi dulu.");
		if (kondisi === "Tidak OK" && !catatan.trim())
			return setError("Catatan wajib diisi untuk kondisi Tidak OK.");
		if (!photo) return setError("Foto bukti wajib diupload.");

		setSubmitting(true);
		try {
			let foto_url = null;
			if (photo) {
				const sb = createClient();
				const ext = photo.name.split(".").pop() || "jpg";
				const path = `${machine.id}/${item.id}-${Date.now()}.${ext}`;
				const { error: upErr } = await sb.storage
					.from("am-photos")
					.upload(path, photo);
				if (upErr) throw new Error("Gagal upload foto: " + upErr.message);
				const { data: pub } = sb.storage.from("am-photos").getPublicUrl(path);
				foto_url = pub.publicUrl;
			}

			const res = await fetch("/api/am-checklists/lines", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					checklist_id: checklistId,
					item_id: item.id,
					item_text: item.item_text,
					kondisi,
					catatan,
					foto_url,
				}),
			});
			const json = await res.json();
			if (!res.ok) throw new Error(json.error);
			setSuccess(json);
		} catch (e) {
			setError(e.message || "Terjadi kesalahan.");
		} finally {
			setSubmitting(false);
		}
	}

	if (success) {
		return (
			<div
				style={{ maxWidth: "420px", margin: "40px auto", padding: "0 16px" }}
			>
				<div style={{ ...cardStyle, textAlign: "center" }}>
					<div style={{ fontSize: "32px", marginBottom: "10px" }}>✅</div>
					<div
						style={{ fontSize: "15px", fontWeight: 700, marginBottom: "6px" }}
					>
						Aktivitas Tersimpan
					</div>
					<div
						style={{ fontSize: "13px", color: "#6b7280", marginBottom: "16px" }}
					>
						{success.requestCreated
							? "Temuan ini otomatis dikirim sebagai request perbaikan."
							: "Kondisi baik, lanjut ke aktivitas berikutnya."}
					</div>
					<Btn
						variant="primary"
						onClick={() => router.push(`/am/${machine.id}`)}
					>
						Kembali ke Daftar Aktivitas
					</Btn>
				</div>
			</div>
		);
	}

	return (
		<div style={{ maxWidth: "420px", margin: "0 auto", padding: "20px 16px" }}>
			<div style={{ marginBottom: "16px" }}>
				<div style={{ fontSize: "12px", color: "#6b7280" }}>
					{machine.name} ({machine.code})
				</div>
				<div style={{ fontSize: "17px", fontWeight: 700, color: "#111827" }}>
					{item.check_code ? `${item.check_code} · ` : ""}
					{item.item_text}
				</div>
			</div>

			{(item.method || item.parameter) && (
				<div style={{ ...cardStyle, marginBottom: "12px" }}>
					{item.method && (
						<div style={{ fontSize: "13px", marginBottom: "6px" }}>
							<span style={{ color: "#6b7280" }}>Method: </span>
							<strong>{item.method}</strong>
						</div>
					)}
					{item.parameter && (
						<div style={{ fontSize: "13px" }}>
							<span style={{ color: "#6b7280" }}>Parameter: </span>
							<strong>{item.parameter}</strong>
						</div>
					)}
				</div>
			)}

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

			<div style={cardStyle}>
				<div
					style={{
						fontSize: "12px",
						fontWeight: 600,
						color: "#374151",
						marginBottom: "8px",
					}}
				>
					Kondisi
				</div>
				<div
					style={{
						display: "flex",
						gap: "8px",
						marginBottom: kondisi === "Tidak OK" ? "12px" : 0,
					}}
				>
					{["OK", "Tidak OK"].map((k) => (
						<button
							key={k}
							onClick={() => setKondisi(k)}
							style={{
								flex: 1,
								fontSize: "13px",
								fontWeight: 600,
								padding: "10px",
								borderRadius: "6px",
								cursor: "pointer",
								fontFamily: "inherit",
								border:
									kondisi === k
										? k === "OK"
											? "1px solid #16a34a"
											: "1px solid #dc2626"
										: "1px solid #e5e7eb",
								background:
									kondisi === k ? (k === "OK" ? "#f0fdf4" : "#fef2f2") : "#fff",
								color:
									kondisi === k
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

				{kondisi && (
					<>
						{kondisi === "Tidak OK" && (
							<textarea
								value={catatan}
								onChange={(e) => setCatatan(e.target.value)}
								placeholder="Jelaskan temuannya..."
								style={{
									width: "100%",
									fontSize: "13px",
									padding: "8px 10px",
									borderRadius: "6px",
									border: "1px solid #fca5a5",
									fontFamily: "inherit",
									minHeight: "70px",
									resize: "vertical",
									boxSizing: "border-box",
									marginBottom: "12px",
								}}
							/>
						)}

						<div style={{ marginBottom: "12px" }}>
							<label
								style={{
									fontSize: "12px",
									fontWeight: 600,
									color: "#374151",
									marginBottom: "6px",
									display: "block",
								}}
							>
								Foto Bukti (wajib)
							</label>
							{photoPreview && (
								<img
									src={photoPreview}
									alt="preview"
									style={{
										width: "100%",
										borderRadius: "6px",
										marginBottom: "8px",
									}}
								/>
							)}
							<input
								ref={fileInputRef}
								type="file"
								accept="image/*"
								capture="environment"
								onChange={handlePhotoChange}
								style={{ display: "none" }}
							/>
							<button
								type="button"
								onClick={() => fileInputRef.current?.click()}
								style={{
									width: "100%",
									fontSize: "13px",
									fontWeight: 600,
									padding: "10px",
									borderRadius: "6px",
									border: "1px solid #2563eb",
									background: "#eff6ff",
									color: "#2563eb",
									cursor: "pointer",
									fontFamily: "inherit",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									gap: "6px",
								}}
							>
								📷 {photo ? "Ganti Foto" : "Ambil Foto"}
							</button>
						</div>
					</>
				)}

				<Btn variant="primary" onClick={handleSubmit} disabled={submitting}>
					{submitting ? "Menyimpan..." : "Simpan Aktivitas"}
				</Btn>
			</div>
		</div>
	);
}
