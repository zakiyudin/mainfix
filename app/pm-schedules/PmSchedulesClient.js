"use client";

import { useState, useEffect } from "react";
import Btn from "@/components/Btn";
import Modal from "@/components/Modal";

const STATUS_STYLE = {
	terjadwal: { label: "Terjadwal", bg: "#f3f4f6", color: "#6b7280" },
	diambil: { label: "Dikerjakan", bg: "#fffbeb", color: "#d97706" },
	selesai: { label: "Selesai", bg: "#f0fdf4", color: "#16a34a" },
};

function StatusPill({ status }) {
	const s = STATUS_STYLE[status];
	return (
		<span
			style={{
				fontSize: "11px",
				fontWeight: 600,
				padding: "2px 8px",
				borderRadius: "4px",
				background: s.bg,
				color: s.color,
			}}
		>
			{s.label}
		</span>
	);
}

function formatDate(iso) {
	return new Date(iso).toLocaleDateString("id-ID", {
		weekday: "short",
		day: "numeric",
		month: "short",
		year: "numeric",
	});
}

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
const emptyForm = { machine_id: "", activity_id: "", tanggal_jadwal: "" };

export default function PmSchedulesClient({ initialSchedules, machines }) {
	const [schedules, setSchedules] = useState(initialSchedules);
	const [modalOpen, setModalOpen] = useState(false);
	const [form, setForm] = useState(emptyForm);
	const [activities, setActivities] = useState([]);
	const [loadingActivities, setLoadingActivities] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState("");

	function openModal() {
		setModalOpen(true);
		setForm(emptyForm);
		setActivities([]);
		setError("");
	}

	async function handleMachineChange(machine_id) {
		setForm((f) => ({ ...f, machine_id, activity_id: "" }));
		setActivities([]);
		if (!machine_id) return;
		setLoadingActivities(true);
		try {
			const res = await fetch(`/api/admin/pm-mapping?machine_id=${machine_id}`);
			const json = await res.json();
			if (res.ok) setActivities(json.activities || []);
		} catch {
			// diamkan
		} finally {
			setLoadingActivities(false);
		}
	}

	async function handleSubmit() {
		setError("");
		if (!form.machine_id || !form.activity_id || !form.tanggal_jadwal) {
			setError("Semua field wajib diisi.");
			return;
		}

		setSubmitting(true);
		try {
			const res = await fetch("/api/pm-schedules", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(form),
			});
			const json = await res.json();
			if (!res.ok) {
				setError(json.error || "Gagal membuat jadwal.");
				return;
			}
			setSchedules((prev) =>
				[...prev, json.data].sort((a, b) =>
					a.tanggal_jadwal.localeCompare(b.tanggal_jadwal),
				),
			);
			setModalOpen(false);
		} catch {
			setError("Terjadi kesalahan. Coba lagi.");
		} finally {
			setSubmitting(false);
		}
	}

	async function handleCancel(id) {
		try {
			const res = await fetch(`/api/pm-schedules/${id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ action: "batal" }),
			});
			const json = await res.json();
			if (res.ok)
				setSchedules((prev) => prev.map((s) => (s.id === id ? json.data : s)));
		} catch {
			// diamkan
		}
	}

	return (
		<div style={{ maxWidth: "900px", margin: "0 auto", padding: "20px 16px" }}>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					marginBottom: "16px",
				}}
			>
				<div>
					<div style={{ fontSize: "17px", fontWeight: 700, color: "#111827" }}>
						Jadwal Preventive Maintenance
					</div>
					<div style={{ fontSize: "13px", color: "#6b7280" }}>
						Buat dan pantau jadwal PM untuk teknisi
					</div>
				</div>
				<Btn variant="primary" onClick={openModal}>
					+ Buat Jadwal
				</Btn>
			</div>

			<div
				style={{
					background: "#fff",
					border: "1px solid #e5e7eb",
					borderRadius: "8px",
					overflow: "hidden",
				}}
			>
				<div style={{ overflowX: "auto" }}>
					<table style={{ width: "100%", borderCollapse: "collapse" }}>
						<thead>
							<tr>
								<th
									style={{
										textAlign: "left",
										fontSize: "11px",
										fontWeight: 600,
										color: "#6b7280",
										padding: "10px 12px",
										borderBottom: "1px solid #e5e7eb",
									}}
								>
									Tanggal
								</th>
								<th
									style={{
										textAlign: "left",
										fontSize: "11px",
										fontWeight: 600,
										color: "#6b7280",
										padding: "10px 12px",
										borderBottom: "1px solid #e5e7eb",
									}}
								>
									Mesin
								</th>
								<th
									style={{
										textAlign: "left",
										fontSize: "11px",
										fontWeight: 600,
										color: "#6b7280",
										padding: "10px 12px",
										borderBottom: "1px solid #e5e7eb",
									}}
								>
									Aktivitas
								</th>
								<th
									style={{
										textAlign: "left",
										fontSize: "11px",
										fontWeight: 600,
										color: "#6b7280",
										padding: "10px 12px",
										borderBottom: "1px solid #e5e7eb",
									}}
								>
									Status
								</th>
								<th
									style={{
										textAlign: "left",
										fontSize: "11px",
										fontWeight: 600,
										color: "#6b7280",
										padding: "10px 12px",
										borderBottom: "1px solid #e5e7eb",
									}}
								>
									Teknisi
								</th>
								<th
									style={{
										textAlign: "left",
										fontSize: "11px",
										fontWeight: 600,
										color: "#6b7280",
										padding: "10px 12px",
										borderBottom: "1px solid #e5e7eb",
									}}
								>
									Aksi
								</th>
							</tr>
						</thead>
						<tbody>
							{schedules.length === 0 ? (
								<tr>
									<td
										colSpan={6}
										style={{
											textAlign: "center",
											padding: "30px",
											color: "#9ca3af",
											fontSize: "13px",
										}}
									>
										Belum ada jadwal PM.
									</td>
								</tr>
							) : (
								schedules.map((s) => (
									<tr key={s.id}>
										<td
											style={{
												padding: "10px 12px",
												borderBottom: "1px solid #f3f4f6",
												fontSize: "13px",
											}}
										>
											{formatDate(s.tanggal_jadwal)}
										</td>
										<td
											style={{
												padding: "10px 12px",
												borderBottom: "1px solid #f3f4f6",
												fontSize: "13px",
											}}
										>
											<div style={{ fontWeight: 600 }}>{s.machine_name}</div>
											<div style={{ fontSize: "11px", color: "#9ca3af" }}>
												{s.machine_code}
											</div>
										</td>
										<td
											style={{
												padding: "10px 12px",
												borderBottom: "1px solid #f3f4f6",
												fontSize: "13px",
												maxWidth: "220px",
											}}
										>
											{s.activity_text}
											{s.catatan_selesai && (
												<div
													style={{
														fontSize: "11px",
														color: "#16a34a",
														marginTop: "2px",
													}}
												>
													✓ {s.catatan_selesai}
													{s.completed_at && (
														<span style={{ color: "#9ca3af" }}>
															{" · "}
															{new Date(s.completed_at).toLocaleDateString(
																"id-ID",
																{
																	day: "numeric",
																	month: "short",
																	year: "numeric",
																},
															)}
														</span>
													)}
												</div>
											)}
											{s.foto_url && (
												<a
													href={s.foto_url}
													target="_blank"
													rel="noopener noreferrer"
													style={{ fontSize: "11px", color: "#2563eb" }}
												>
													📷 Lihat foto
												</a>
											)}
										</td>
										<td
											style={{
												padding: "10px 12px",
												borderBottom: "1px solid #f3f4f6",
											}}
										>
											<StatusPill status={s.status} />
										</td>
										<td
											style={{
												padding: "10px 12px",
												borderBottom: "1px solid #f3f4f6",
												fontSize: "13px",
											}}
										>
											{s.teknisi_nama || "—"}
										</td>
										<td
											style={{
												padding: "10px 12px",
												borderBottom: "1px solid #f3f4f6",
											}}
										>
											{s.status !== "selesai" && (
												<Btn
													variant="danger"
													small
													onClick={() => handleCancel(s.id)}
												>
													Batalkan
												</Btn>
											)}
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</div>

			{modalOpen && (
				<Modal
					title="Buat Jadwal PM"
					onClose={() => setModalOpen(false)}
					footer={
						<>
							<Btn
								variant="ghost"
								onClick={() => setModalOpen(false)}
								disabled={submitting}
							>
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

					<div style={{ marginBottom: "14px" }}>
						<label style={labelStyle}>Mesin</label>
						<select
							style={inputStyle}
							value={form.machine_id}
							onChange={(e) => handleMachineChange(e.target.value)}
						>
							<option value="">Pilih mesin</option>
							{machines.map((m) => (
								<option key={m.id} value={m.id}>
									{m.name} ({m.code})
								</option>
							))}
						</select>
					</div>

					<div style={{ marginBottom: "14px" }}>
						<label style={labelStyle}>Aktivitas PM</label>
						<select
							style={inputStyle}
							value={form.activity_id}
							onChange={(e) =>
								setForm((f) => ({ ...f, activity_id: e.target.value }))
							}
							disabled={!form.machine_id || loadingActivities}
						>
							<option value="">
								{!form.machine_id
									? "Pilih mesin dulu"
									: loadingActivities
										? "Memuat..."
										: "Pilih aktivitas"}
							</option>
							{activities.map((a) => (
								<option key={a.id} value={a.id}>
									{a.activity_text}
								</option>
							))}
						</select>
						{form.machine_id &&
							!loadingActivities &&
							activities.length === 0 && (
								<div
									style={{
										fontSize: "11px",
										color: "#d97706",
										marginTop: "4px",
									}}
								>
									Mesin ini belum punya aktivitas PM yang di-assign. Atur dulu
									di Setup PM.
								</div>
							)}
					</div>

					<div>
						<label style={labelStyle}>Tanggal Jadwal</label>
						<input
							type="date"
							style={inputStyle}
							value={form.tanggal_jadwal}
							onChange={(e) =>
								setForm((f) => ({ ...f, tanggal_jadwal: e.target.value }))
							}
						/>
					</div>
				</Modal>
			)}
		</div>
	);
}
