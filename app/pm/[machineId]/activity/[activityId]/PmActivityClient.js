"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Btn from "@/components/Btn";

const cardStyle = {
	background: "#fff",
	border: "1px solid #e5e7eb",
	borderRadius: "8px",
	padding: "16px",
};

function formatDate(iso) {
	return new Date(iso).toLocaleDateString("id-ID", {
		weekday: "short",
		day: "numeric",
		month: "short",
		year: "numeric",
	});
}

function formatDateTime(iso) {
	return new Date(iso).toLocaleString("id-ID", {
		day: "numeric",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

export default function PmActivityClient({
	machine,
	activity,
	initialSchedule,
	currentUserId,
}) {
	const [schedule, setSchedule] = useState(initialSchedule);
	const [catatan, setCatatan] = useState("");
	const [photo, setPhoto] = useState(null);
	const [photoPreview, setPhotoPreview] = useState(null);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState(null);

	function handlePhotoChange(e) {
		const file = e.target.files?.[0];
		if (!file) return;
		setPhoto(file);
		setPhotoPreview(URL.createObjectURL(file));
	}

	async function patchSchedule(body) {
		const res = await fetch(`/api/pm-schedules/${schedule.id}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
		});
		const json = await res.json();
		if (!res.ok) throw new Error(json.error);
		return json.data;
	}

	async function handleAmbil() {
		setError("");
		setSubmitting(true);
		try {
			const updated = await patchSchedule({ action: "ambil" });
			setSchedule(updated);
		} catch (e) {
			setError(e.message);
		} finally {
			setSubmitting(false);
		}
	}

	async function handleSelesai() {
		setError("");
		if (!catatan.trim()) return setError("Catatan wajib diisi.");
		if (!photo) return setError("Foto bukti wajib diupload.");

		setSubmitting(true);
		try {
			const sb = createClient();
			const ext = photo.name.split(".").pop() || "jpg";
			const path = `pm/${machine.id}/${activity.id}-${Date.now()}.${ext}`;
			const { error: upErr } = await sb.storage
				.from("am-photos")
				.upload(path, photo);
			if (upErr) throw new Error("Gagal upload foto: " + upErr.message);
			const { data: pub } = sb.storage.from("am-photos").getPublicUrl(path);

			const updated = await patchSchedule({
				action: "selesai",
				catatan_selesai: catatan,
				foto_url: pub.publicUrl,
			});
			setSuccess(updated);
		} catch (e) {
			setError(e.message);
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<div style={{ maxWidth: "420px", margin: "0 auto", padding: "20px 16px" }}>
			<div style={{ marginBottom: "16px" }}>
				<div style={{ fontSize: "12px", color: "#6b7280" }}>
					{machine.name} ({machine.code})
				</div>
				<div style={{ fontSize: "17px", fontWeight: 700, color: "#111827" }}>
					{activity.check_code ? `${activity.check_code} · ` : ""}
					{activity.activity_text}
				</div>
				<div style={{ fontSize: "12px", color: "#9ca3af", marginTop: "2px" }}>
					Preventive Maintenance
				</div>
			</div>

			{(activity.method || activity.parameter) && (
				<div style={{ ...cardStyle, marginBottom: "12px" }}>
					{activity.method && (
						<div style={{ fontSize: "13px", marginBottom: "6px" }}>
							<span style={{ color: "#6b7280" }}>Method: </span>
							<strong>{activity.method}</strong>
						</div>
					)}
					{activity.parameter && (
						<div style={{ fontSize: "13px" }}>
							<span style={{ color: "#6b7280" }}>Parameter: </span>
							<strong>{activity.parameter}</strong>
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

			{success ? (
				<div style={{ ...cardStyle, textAlign: "center" }}>
					<div style={{ fontSize: "32px", marginBottom: "10px" }}>✅</div>
					<div style={{ fontSize: "15px", fontWeight: 700 }}>
						Tugas PM Selesai
					</div>
					<div style={{ fontSize: "13px", color: "#6b7280", marginTop: "6px" }}>
						Diselesaikan pada {formatDateTime(success.completed_at)}
					</div>
				</div>
			) : !schedule ? (
				<div style={{ ...cardStyle, textAlign: "center", color: "#9ca3af" }}>
					Belum ada jadwal PM aktif untuk aktivitas ini di mesin ini.
				</div>
			) : schedule.status === "terjadwal" ? (
				<div style={cardStyle}>
					<div
						style={{ fontSize: "12px", color: "#6b7280", marginBottom: "10px" }}
					>
						Jadwal:{" "}
						<strong style={{ color: "#111827" }}>
							{formatDate(schedule.tanggal_jadwal)}
						</strong>
					</div>
					<Btn variant="primary" onClick={handleAmbil} disabled={submitting}>
						{submitting ? "Memproses..." : "Ambil Tugas Ini"}
					</Btn>
				</div>
			) : schedule.teknisi_id === currentUserId ? (
				<div style={cardStyle}>
					<div
						style={{ fontSize: "12px", color: "#6b7280", marginBottom: "12px" }}
					>
						Kamu sedang mengerjakan tugas ini. Isi catatan dan foto bukti
						setelah selesai.
					</div>
					<textarea
						value={catatan}
						onChange={(e) => setCatatan(e.target.value)}
						placeholder="Apa yang sudah dikerjakan?"
						style={{
							width: "100%",
							fontSize: "13px",
							padding: "8px 10px",
							borderRadius: "6px",
							border: "1px solid #e5e7eb",
							fontFamily: "inherit",
							minHeight: "70px",
							resize: "vertical",
							boxSizing: "border-box",
							marginBottom: "12px",
						}}
					/>

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
							type="file"
							accept="image/*"
							capture="environment"
							onChange={handlePhotoChange}
							style={{ fontSize: "13px" }}
						/>
					</div>

					<Btn variant="success" onClick={handleSelesai} disabled={submitting}>
						{submitting ? "Menyimpan..." : "Tandai Selesai"}
					</Btn>
				</div>
			) : (
				<div style={{ ...cardStyle, textAlign: "center", color: "#d97706" }}>
					Tugas ini sedang dikerjakan oleh{" "}
					<strong>{schedule.teknisi_nama}</strong>.
				</div>
			)}
		</div>
	);
}
