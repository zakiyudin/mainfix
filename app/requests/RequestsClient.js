"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Btn from "@/components/Btn";
import Modal from "@/components/Modal";
import { StatusBadge, PriorityBadge, StopBadge } from "@/components/Badge";

const JOB_TYPES = ["Repair", "Setting", "Improvement", "Perawatan"];
const PRIORITIES = ["Low", "Medium", "High", "Critical"];

const inputStyle = {
	width: "100%",
	fontSize: "13px",
	padding: "8px 10px",
	borderRadius: "6px",
	border: "1px solid #e5e7eb",
	fontFamily: "inherit",
	boxSizing: "border-box",
};

const labelStyle = {
	fontSize: "12px",
	fontWeight: 600,
	color: "#374151",
	marginBottom: "4px",
	display: "block",
};

const fieldWrap = { marginBottom: "14px" };

function formatDate(iso) {
	return new Date(iso).toLocaleString("id-ID", {
		day: "numeric",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

const emptyForm = {
	machine_id: "",
	job_type: "",
	mesin_stop: "",
	prioritas: "Medium",
	problem: "",
};

export default function RequestsClient({ initialRequests }) {
	const [requests, setRequests] = useState(initialRequests);
	const [modalOpen, setModalOpen] = useState(false);
	const [machines, setMachines] = useState([]);
	const [machinesLoading, setMachinesLoading] = useState(false);
	const [form, setForm] = useState(emptyForm);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState("");
	const [photo, setPhoto] = useState(null);
	const [photoPreview, setPhotoPreview] = useState(null);

	async function openModal() {
		setModalOpen(true);
		setError("");
		setMachinesLoading(true);
		try {
			const res = await fetch("/api/machines");
			const json = await res.json();
			if (res.ok) setMachines(json.data || []);
			else setError(json.error || "Gagal memuat daftar mesin.");
		} catch {
			setError("Gagal memuat daftar mesin.");
		} finally {
			setMachinesLoading(false);
		}
	}

	function closeModal() {
		setModalOpen(false);
		setForm(emptyForm);
		setError("");
	}

	function updateField(key, value) {
		setForm((f) => ({ ...f, [key]: value }));
	}

	async function handleSubmit() {
		setError("");
		if (
			!form.machine_id ||
			!form.job_type ||
			!form.mesin_stop ||
			!form.problem
		) {
			setError("Semua field wajib diisi.");
			return;
		}

		setSubmitting(true);
		try {
			let foto_url = null;
			if (photo) {
				const sb = createClient();
				const ext = photo.name.split(".").pop() || "jpg";
				const path = `manual/${Date.now()}.${ext}`;
				const { error: upErr } = await sb.storage
					.from("am-photos")
					.upload(path, photo);
				if (upErr) throw new Error("Gagal upload foto: " + upErr.message);
				const { data: pub } = sb.storage.from("am-photos").getPublicUrl(path);
				foto_url = pub.publicUrl;
			}

			const res = await fetch("/api/requests", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ ...form, foto_url }),
			});
			const json = await res.json();

			if (!res.ok) {
				setError(json.error || "Gagal membuat request.");
				return;
			}

			setRequests((prev) => [json.data, ...prev]);
			closeModal();
		} catch (e) {
			setError(e.message || "Terjadi kesalahan. Coba lagi.");
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<div style={{ maxWidth: "720px", margin: "0 auto", padding: "20px 16px" }}>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					marginBottom: "16px",
				}}
			>
				<div>
					<div style={{ fontSize: "17px", fontWeight: 700, color: "#111827" }}>
						Request Perbaikan
					</div>
					<div style={{ fontSize: "13px", color: "#6b7280" }}>
						Daftar permintaan perbaikan yang kamu buat
					</div>
				</div>
				<Btn variant="primary" onClick={openModal}>
					+ Buat Request
				</Btn>
			</div>

			{requests.length === 0 ? (
				<div
					style={{
						background: "#fff",
						border: "1px solid #e5e7eb",
						borderRadius: "8px",
						padding: "40px 20px",
						textAlign: "center",
					}}
				>
					<div
						style={{ fontSize: "13px", color: "#6b7280", marginBottom: "12px" }}
					>
						Belum ada request. Buat request perbaikan pertama kamu.
					</div>
					<Btn variant="primary" onClick={openModal}>
						+ Buat Request
					</Btn>
				</div>
			) : (
				<div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
					{requests.map((r) => (
						<div
							key={r.id}
							style={{
								background: "#fff",
								border: "1px solid #e5e7eb",
								borderRadius: "8px",
								padding: "12px 14px",
							}}
						>
							<div
								style={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "flex-start",
									gap: "8px",
									marginBottom: "6px",
								}}
							>
								<div>
									<div
										style={{
											fontSize: "14px",
											fontWeight: 600,
											color: "#111827",
										}}
									>
										{r.machine_name}{" "}
										<span style={{ color: "#9ca3af", fontWeight: 400 }}>
											({r.machine_code})
										</span>
									</div>
									<div
										style={{
											fontSize: "12px",
											color: "#6b7280",
											marginTop: "2px",
										}}
									>
										{r.job_type} · {formatDate(r.created_at)}
									</div>
								</div>
								<div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
									<StatusBadge status={r.status} />
								</div>
							</div>

							<div
								style={{
									fontSize: "13px",
									color: "#374151",
									marginBottom: "8px",
								}}
							>
								{r.problem}
							</div>

							<div style={{ display: "flex", gap: "6px" }}>
								<PriorityBadge priority={r.prioritas} />
								<StopBadge value={r.mesin_stop} />
							</div>
						</div>
					))}
				</div>
			)}

			{modalOpen && (
				<Modal
					title="Buat Request Perbaikan"
					onClose={closeModal}
					footer={
						<>
							<Btn variant="ghost" onClick={closeModal} disabled={submitting}>
								Batal
							</Btn>
							<Btn
								variant="primary"
								onClick={handleSubmit}
								disabled={submitting}
							>
								{submitting ? "Menyimpan..." : "Simpan"}
							</Btn>
						</>
					}
				>
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

					<div style={fieldWrap}>
						<label style={labelStyle}>Mesin</label>
						<select
							style={inputStyle}
							value={form.machine_id}
							onChange={(e) => updateField("machine_id", e.target.value)}
							disabled={machinesLoading}
						>
							<option value="">
								{machinesLoading ? "Memuat mesin..." : "Pilih mesin"}
							</option>
							{machines.map((m) => (
								<option key={m.id} value={m.id}>
									{m.name} ({m.code})
								</option>
							))}
						</select>
					</div>

					<div style={fieldWrap}>
						<label style={labelStyle}>Jenis Pekerjaan</label>
						<select
							style={inputStyle}
							value={form.job_type}
							onChange={(e) => updateField("job_type", e.target.value)}
						>
							<option value="">Pilih jenis pekerjaan</option>
							{JOB_TYPES.map((j) => (
								<option key={j} value={j}>
									{j}
								</option>
							))}
						</select>
					</div>

					<div style={fieldWrap}>
						<label style={labelStyle}>Mesin Berhenti?</label>
						<div style={{ display: "flex", gap: "8px" }}>
							{["Yes", "No"].map((v) => (
								<button
									key={v}
									type="button"
									onClick={() => updateField("mesin_stop", v)}
									style={{
										flex: 1,
										fontSize: "13px",
										fontWeight: 600,
										padding: "8px",
										borderRadius: "6px",
										cursor: "pointer",
										fontFamily: "inherit",
										border:
											form.mesin_stop === v
												? "1px solid #2563eb"
												: "1px solid #e5e7eb",
										background: form.mesin_stop === v ? "#eff6ff" : "#fff",
										color: form.mesin_stop === v ? "#2563eb" : "#6b7280",
									}}
								>
									{v === "Yes" ? "Ya" : "Tidak"}
								</button>
							))}
						</div>
					</div>

					<div style={fieldWrap}>
						<label style={labelStyle}>Prioritas</label>
						<select
							style={inputStyle}
							value={form.prioritas}
							onChange={(e) => updateField("prioritas", e.target.value)}
						>
							{PRIORITIES.map((p) => (
								<option key={p} value={p}>
									{p}
								</option>
							))}
						</select>
					</div>

					<div style={{ ...fieldWrap, marginBottom: 0 }}>
						<label style={labelStyle}>Deskripsi Masalah</label>
						<textarea
							style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
							value={form.problem}
							onChange={(e) => updateField("problem", e.target.value)}
							placeholder="Jelaskan masalah yang terjadi..."
						/>
					</div>

					<div style={{ marginTop: "14px" }}>
						<label style={labelStyle}>Foto (opsional)</label>
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
							onChange={(e) => {
								const file = e.target.files?.[0];
								if (!file) return;
								setPhoto(file);
								setPhotoPreview(URL.createObjectURL(file));
							}}
							style={{ fontSize: "13px" }}
						/>
					</div>
				</Modal>
			)}
		</div>
	);
}
