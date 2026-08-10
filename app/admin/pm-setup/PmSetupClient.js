"use client";

import { useState } from "react";
import Link from "next/link";
import Btn from "@/components/Btn";

const cardStyle = {
	background: "#fff",
	border: "1px solid #e5e7eb",
	borderRadius: "8px",
};

export default function PmSetupClient({ initialMachines, initialActivities }) {
	const [machines] = useState(initialMachines);
	const [activities, setActivities] = useState(initialActivities);
	const [selectedMachine, setSelectedMachine] = useState(null);
	const [assignedIds, setAssignedIds] = useState([]);
	const [loadingMapping, setLoadingMapping] = useState(false);
	const [saving, setSaving] = useState(false);
	const emptyForm = {
		activity_text: "",
		check_code: "",
		method: "",
		parameter: "",
	};
	const [newForm, setNewForm] = useState(emptyForm);
	const [addingActivity, setAddingActivity] = useState(false);
	const [message, setMessage] = useState("");
	const [error, setError] = useState("");
	const [editingId, setEditingId] = useState(null);
	const [editForm, setEditForm] = useState(emptyForm);
	const [savingEdit, setSavingEdit] = useState(false);

	async function selectMachine(machine) {
		setSelectedMachine(machine);
		setMessage("");
		setError("");
		setLoadingMapping(true);
		try {
			const res = await fetch(`/api/admin/pm-mapping?machine_id=${machine.id}`);
			const json = await res.json();
			if (res.ok) setAssignedIds(json.data || []);
			else setError(json.error || "Gagal memuat data.");
		} catch {
			setError("Gagal memuat data.");
		} finally {
			setLoadingMapping(false);
		}
	}

	function toggleActivity(id) {
		setAssignedIds((prev) =>
			prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
		);
	}

	async function handleSave() {
		if (!selectedMachine) return;
		setSaving(true);
		setError("");
		setMessage("");
		try {
			const res = await fetch("/api/admin/pm-mapping", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					machine_id: selectedMachine.id,
					activity_ids: assignedIds,
				}),
			});
			const json = await res.json();
			if (!res.ok) {
				setError(json.error || "Gagal menyimpan.");
				return;
			}
			setMessage(`PM untuk ${selectedMachine.name} berhasil disimpan.`);
		} catch {
			setError("Terjadi kesalahan. Coba lagi.");
		} finally {
			setSaving(false);
		}
	}

	async function handleAddActivity() {
		if (!newForm.activity_text.trim()) return;
		setAddingActivity(true);
		setError("");
		try {
			const res = await fetch("/api/admin/pm-activities", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(newForm),
			});
			const json = await res.json();
			if (!res.ok) {
				setError(json.error || "Gagal menambah aktivitas.");
				return;
			}
			setActivities((prev) =>
				[...prev, json.data].sort((a, b) =>
					a.activity_text.localeCompare(b.activity_text),
				),
			);
			setNewForm(emptyForm);
		} catch {
			setError("Terjadi kesalahan. Coba lagi.");
		} finally {
			setAddingActivity(false);
		}
	}

	function startEdit(activity) {
		setEditingId(activity.id);
		setEditForm({
			activity_text: activity.activity_text,
			check_code: activity.check_code || "",
			method: activity.method || "",
			parameter: activity.parameter || "",
		});
	}

	async function handleSaveEdit(id) {
		if (!editForm.activity_text.trim()) return;
		setSavingEdit(true);
		setError("");
		try {
			const res = await fetch("/api/admin/pm-activities", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id, ...editForm }),
			});
			const json = await res.json();
			if (!res.ok) {
				setError(json.error || "Gagal menyimpan perubahan.");
				return;
			}
			setActivities((prev) =>
				prev
					.map((a) => (a.id === id ? json.data : a))
					.sort((a, b) => a.activity_text.localeCompare(b.activity_text)),
			);
			setEditingId(null);
		} catch {
			setError("Terjadi kesalahan. Coba lagi.");
		} finally {
			setSavingEdit(false);
		}
	}
	return (
		<div style={{ maxWidth: "900px", margin: "0 auto", padding: "20px 16px" }}>
			<div style={{ marginBottom: "16px" }}>
				<div style={{ fontSize: "17px", fontWeight: 700, color: "#111827" }}>
					Setup Preventive Maintenance
				</div>
				<div style={{ fontSize: "13px", color: "#6b7280" }}>
					Atur aktivitas PM yang berlaku untuk tiap mesin
				</div>
			</div>

			<div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
				<div
					style={{
						...cardStyle,
						flex: "1 1 220px",
						padding: "10px",
						alignSelf: "flex-start",
					}}
				>
					<div
						style={{
							fontSize: "12px",
							fontWeight: 700,
							color: "#6b7280",
							textTransform: "uppercase",
							marginBottom: "8px",
							padding: "0 4px",
						}}
					>
						Mesin
					</div>
					<div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
						{machines.map((m) => (
							<button
								key={m.id}
								onClick={() => selectMachine(m)}
								style={{
									textAlign: "left",
									padding: "8px 10px",
									borderRadius: "6px",
									border: "none",
									cursor: "pointer",
									fontFamily: "inherit",
									fontSize: "13px",
									background:
										selectedMachine?.id === m.id ? "#eff6ff" : "transparent",
									color: selectedMachine?.id === m.id ? "#2563eb" : "#374151",
									fontWeight: selectedMachine?.id === m.id ? 600 : 400,
								}}
							>
								{m.name}
								<div style={{ fontSize: "11px", color: "#9ca3af" }}>
									{m.code} · {m.divisi}
								</div>
							</button>
						))}
					</div>
				</div>

				<div style={{ ...cardStyle, flex: "2 1 400px", padding: "16px" }}>
					{!selectedMachine ? (
						<div
							style={{
								fontSize: "13px",
								color: "#9ca3af",
								textAlign: "center",
								padding: "30px",
							}}
						>
							Pilih mesin di sebelah kiri untuk mulai mengatur PM.
						</div>
					) : (
						<>
							<div
								style={{
									fontSize: "14px",
									fontWeight: 600,
									marginBottom: "12px",
								}}
							>
								Aktivitas PM untuk {selectedMachine.name}
							</div>

							{error && (
								<div
									style={{
										background: "#fef2f2",
										color: "#dc2626",
										fontSize: "12px",
										padding: "8px 10px",
										borderRadius: "6px",
										marginBottom: "12px",
									}}
								>
									{error}
								</div>
							)}
							{message && (
								<div
									style={{
										background: "#f0fdf4",
										color: "#16a34a",
										fontSize: "12px",
										padding: "8px 10px",
										borderRadius: "6px",
										marginBottom: "12px",
									}}
								>
									{message}
								</div>
							)}

							{loadingMapping ? (
								<div style={{ fontSize: "13px", color: "#9ca3af" }}>
									Memuat...
								</div>
							) : (
								<div
									style={{
										display: "flex",
										flexDirection: "column",
										gap: "4px",
										marginBottom: "16px",
									}}
								>
									{activities.map((a) => (
										<label
											key={a.id}
											style={{
												display: "flex",
												alignItems: "center",
												gap: "8px",
												fontSize: "13px",
												color: "#374151",
												cursor: "pointer",
												padding: "6px 4px",
											}}
										>
											<input
												type="checkbox"
												checked={assignedIds.includes(a.id)}
												onChange={() => toggleActivity(a.id)}
											/>
											{a.activity_text}
										</label>
									))}
									{activities.length === 0 && (
										<div style={{ fontSize: "13px", color: "#9ca3af" }}>
											Belum ada aktivitas di pool. Tambah dulu di bawah.
										</div>
									)}
								</div>
							)}

							<div
								style={{ display: "flex", gap: "8px", alignItems: "center" }}
							>
								<Btn
									variant="primary"
									onClick={handleSave}
									disabled={saving || loadingMapping}
								>
									{saving ? "Menyimpan..." : "Simpan PM Mesin Ini"}
								</Btn>
								<Link
									href={`/admin/qr-generator?machine_id=${selectedMachine.id}&tab=pm`}
									style={{
										fontSize: "13px",
										fontWeight: 500,
										padding: "7px 14px",
										borderRadius: "6px",
										border: "1px solid #e5e7eb",
										background: "#fff",
										color: "#374151",
										textDecoration: "none",
									}}
								>
									🔗 Generate QR PM Mesin Ini
								</Link>
							</div>
						</>
					)}
				</div>
			</div>

			{/* Kelola pool master aktivitas PM */}
			<div style={{ ...cardStyle, padding: "16px", marginTop: "16px" }}>
				<div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>
					Kelola Pool Master Aktivitas PM
				</div>
				<div
					style={{ fontSize: "12px", color: "#6b7280", marginBottom: "14px" }}
				>
					Aktivitas di sini bisa dipakai ulang untuk banyak mesin. Klik
					aktivitas untuk edit.
				</div>

				<div
					style={{
						display: "flex",
						flexDirection: "column",
						gap: "6px",
						marginBottom: "18px",
					}}
				>
					{activities.map((a) =>
						editingId === a.id ? (
							<div
								key={a.id}
								style={{
									border: "1px solid #2563eb",
									borderRadius: "6px",
									padding: "10px",
								}}
							>
								<div
									style={{
										display: "grid",
										gridTemplateColumns: "1fr 3fr",
										gap: "8px",
										marginBottom: "8px",
									}}
								>
									<div>
										<label
											style={{
												fontSize: "11px",
												fontWeight: 600,
												color: "#6b7280",
												marginBottom: "3px",
												display: "block",
											}}
										>
											Check Code
										</label>
										<input
											value={editForm.check_code}
											onChange={(e) =>
												setEditForm((f) => ({
													...f,
													check_code: e.target.value,
												}))
											}
											style={{
												width: "100%",
												fontSize: "13px",
												padding: "7px 10px",
												borderRadius: "6px",
												border: "1px solid #e5e7eb",
												fontFamily: "inherit",
												boxSizing: "border-box",
											}}
											placeholder="PM1"
										/>
									</div>
									<div>
										<label
											style={{
												fontSize: "11px",
												fontWeight: 600,
												color: "#6b7280",
												marginBottom: "3px",
												display: "block",
											}}
										>
											Activity
										</label>
										<input
											value={editForm.activity_text}
											onChange={(e) =>
												setEditForm((f) => ({
													...f,
													activity_text: e.target.value,
												}))
											}
											style={{
												width: "100%",
												fontSize: "13px",
												padding: "7px 10px",
												borderRadius: "6px",
												border: "1px solid #e5e7eb",
												fontFamily: "inherit",
												boxSizing: "border-box",
											}}
										/>
									</div>
								</div>
								<div
									style={{
										display: "grid",
										gridTemplateColumns: "1fr 1fr",
										gap: "8px",
										marginBottom: "10px",
									}}
								>
									<div>
										<label
											style={{
												fontSize: "11px",
												fontWeight: 600,
												color: "#6b7280",
												marginBottom: "3px",
												display: "block",
											}}
										>
											Method
										</label>
										<input
											value={editForm.method}
											onChange={(e) =>
												setEditForm((f) => ({ ...f, method: e.target.value }))
											}
											style={{
												width: "100%",
												fontSize: "13px",
												padding: "7px 10px",
												borderRadius: "6px",
												border: "1px solid #e5e7eb",
												fontFamily: "inherit",
												boxSizing: "border-box",
											}}
											placeholder="Visual / Ganti / dsb"
										/>
									</div>
									<div>
										<label
											style={{
												fontSize: "11px",
												fontWeight: 600,
												color: "#6b7280",
												marginBottom: "3px",
												display: "block",
											}}
										>
											Parameter
										</label>
										<input
											value={editForm.parameter}
											onChange={(e) =>
												setEditForm((f) => ({
													...f,
													parameter: e.target.value,
												}))
											}
											style={{
												width: "100%",
												fontSize: "13px",
												padding: "7px 10px",
												borderRadius: "6px",
												border: "1px solid #e5e7eb",
												fontFamily: "inherit",
												boxSizing: "border-box",
											}}
											placeholder="Standar yang harus dipenuhi"
										/>
									</div>
								</div>
								<div style={{ display: "flex", gap: "8px" }}>
									<Btn
										variant="primary"
										small
										onClick={() => handleSaveEdit(a.id)}
										disabled={savingEdit}
									>
										{savingEdit ? "Menyimpan..." : "Simpan"}
									</Btn>
									<Btn
										variant="ghost"
										small
										onClick={() => setEditingId(null)}
										disabled={savingEdit}
									>
										Batal
									</Btn>
								</div>
							</div>
						) : (
							<div
								key={a.id}
								onClick={() => startEdit(a)}
								style={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
									padding: "8px 10px",
									borderRadius: "6px",
									border: "1px solid #f3f4f6",
									cursor: "pointer",
									fontSize: "13px",
								}}
							>
								<div>
									<span style={{ fontWeight: 700, color: "#2563eb" }}>
										{a.check_code || "—"}
									</span>{" "}
									<span style={{ color: "#111827" }}>{a.activity_text}</span>
									{a.method && (
										<span style={{ color: "#9ca3af" }}> · {a.method}</span>
									)}
								</div>
								<span style={{ fontSize: "11px", color: "#9ca3af" }}>Edit</span>
							</div>
						),
					)}
					{activities.length === 0 && (
						<div style={{ fontSize: "13px", color: "#9ca3af" }}>
							Belum ada aktivitas di pool.
						</div>
					)}
				</div>

				<div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "14px" }}>
					<div
						style={{
							fontSize: "12px",
							fontWeight: 600,
							color: "#374151",
							marginBottom: "8px",
						}}
					>
						Tambah Aktivitas Baru
					</div>
					<div
						style={{
							display: "grid",
							gridTemplateColumns: "1fr 3fr",
							gap: "8px",
							marginBottom: "8px",
						}}
					>
						<div>
							<label
								style={{
									fontSize: "11px",
									fontWeight: 600,
									color: "#6b7280",
									marginBottom: "3px",
									display: "block",
								}}
							>
								Check Code
							</label>
							<input
								value={newForm.check_code}
								onChange={(e) =>
									setNewForm((f) => ({ ...f, check_code: e.target.value }))
								}
								style={{
									width: "100%",
									fontSize: "13px",
									padding: "7px 10px",
									borderRadius: "6px",
									border: "1px solid #e5e7eb",
									fontFamily: "inherit",
									boxSizing: "border-box",
								}}
								placeholder="PM1"
							/>
						</div>
						<div>
							<label
								style={{
									fontSize: "11px",
									fontWeight: 600,
									color: "#6b7280",
									marginBottom: "3px",
									display: "block",
								}}
							>
								Activity
							</label>
							<input
								value={newForm.activity_text}
								onChange={(e) =>
									setNewForm((f) => ({ ...f, activity_text: e.target.value }))
								}
								style={{
									width: "100%",
									fontSize: "13px",
									padding: "7px 10px",
									borderRadius: "6px",
									border: "1px solid #e5e7eb",
									fontFamily: "inherit",
									boxSizing: "border-box",
								}}
								placeholder="Misal: Ganti oli hidrolik"
							/>
						</div>
					</div>
					<div
						style={{
							display: "grid",
							gridTemplateColumns: "1fr 1fr",
							gap: "8px",
							marginBottom: "10px",
						}}
					>
						<div>
							<label
								style={{
									fontSize: "11px",
									fontWeight: 600,
									color: "#6b7280",
									marginBottom: "3px",
									display: "block",
								}}
							>
								Method
							</label>
							<input
								value={newForm.method}
								onChange={(e) =>
									setNewForm((f) => ({ ...f, method: e.target.value }))
								}
								style={{
									width: "100%",
									fontSize: "13px",
									padding: "7px 10px",
									borderRadius: "6px",
									border: "1px solid #e5e7eb",
									fontFamily: "inherit",
									boxSizing: "border-box",
								}}
								placeholder="Visual / Ganti / dsb"
							/>
						</div>
						<div>
							<label
								style={{
									fontSize: "11px",
									fontWeight: 600,
									color: "#6b7280",
									marginBottom: "3px",
									display: "block",
								}}
							>
								Parameter
							</label>
							<input
								value={newForm.parameter}
								onChange={(e) =>
									setNewForm((f) => ({ ...f, parameter: e.target.value }))
								}
								style={{
									width: "100%",
									fontSize: "13px",
									padding: "7px 10px",
									borderRadius: "6px",
									border: "1px solid #e5e7eb",
									fontFamily: "inherit",
									boxSizing: "border-box",
								}}
								placeholder="Standar yang harus dipenuhi"
							/>
						</div>
					</div>
					<Btn
						variant="ghost"
						onClick={handleAddActivity}
						disabled={addingActivity}
					>
						{addingActivity ? "Menyimpan..." : "+ Tambah Aktivitas"}
					</Btn>
				</div>
			</div>
		</div>
	);
}
