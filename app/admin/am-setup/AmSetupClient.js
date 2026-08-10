"use client";

import { useState } from "react";
import Link from "next/link";
import Btn from "@/components/Btn";

const cardStyle = {
	background: "#fff",
	border: "1px solid #e5e7eb",
	borderRadius: "10px",
	display: "flex",
	flexDirection: "column",
};

const cardHeaderStyle = {
	padding: "12px 16px",
	borderBottom: "1px solid #f3f4f6",
	flexShrink: 0,
};

const cardScrollBody = {
	overflowY: "auto",
	flex: 1,
};

const emptyForm = { item_text: "", check_code: "", method: "", parameter: "" };

export default function AmSetupClient({ initialMachines, initialItems }) {
	const [machines] = useState(initialMachines);
	const [items, setItems] = useState(initialItems);
	const [selectedMachine, setSelectedMachine] = useState(null);
	const [assignedIds, setAssignedIds] = useState([]);
	const [loadingMapping, setLoadingMapping] = useState(false);
	const [saving, setSaving] = useState(false);
	const [message, setMessage] = useState("");
	const [error, setError] = useState("");

	const [newForm, setNewForm] = useState(emptyForm);
	const [addingItem, setAddingItem] = useState(false);

	const [editingId, setEditingId] = useState(null);
	const [editForm, setEditForm] = useState(emptyForm);
	const [savingEdit, setSavingEdit] = useState(false);

	async function selectMachine(machine) {
		setSelectedMachine(machine);
		setMessage("");
		setError("");
		setLoadingMapping(true);
		try {
			const res = await fetch(`/api/admin/am-mapping?machine_id=${machine.id}`);
			const json = await res.json();
			if (res.ok) setAssignedIds(json.data || []);
			else setError(json.error || "Gagal memuat data.");
		} catch {
			setError("Gagal memuat data.");
		} finally {
			setLoadingMapping(false);
		}
	}

	function toggleItem(itemId) {
		setAssignedIds((prev) =>
			prev.includes(itemId)
				? prev.filter((id) => id !== itemId)
				: [...prev, itemId],
		);
	}

	async function handleSave() {
		if (!selectedMachine) return;
		setSaving(true);
		setError("");
		setMessage("");
		try {
			const res = await fetch("/api/admin/am-mapping", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					machine_id: selectedMachine.id,
					item_ids: assignedIds,
				}),
			});
			const json = await res.json();
			if (!res.ok) {
				setError(json.error || "Gagal menyimpan.");
				return;
			}
			setMessage(`Checklist untuk ${selectedMachine.name} berhasil disimpan.`);
		} catch {
			setError("Terjadi kesalahan. Coba lagi.");
		} finally {
			setSaving(false);
		}
	}

	async function handleAddItem() {
		if (!newForm.item_text.trim()) return;
		setAddingItem(true);
		setError("");
		try {
			const res = await fetch("/api/admin/am-items", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(newForm),
			});
			const json = await res.json();
			if (!res.ok) {
				setError(json.error || "Gagal menambah item.");
				return;
			}
			setItems((prev) =>
				[...prev, json.data].sort((a, b) =>
					a.item_text.localeCompare(b.item_text),
				),
			);
			setNewForm(emptyForm);
		} catch {
			setError("Terjadi kesalahan. Coba lagi.");
		} finally {
			setAddingItem(false);
		}
	}

	function startEdit(item) {
		setEditingId(item.id);
		setEditForm({
			item_text: item.item_text,
			check_code: item.check_code || "",
			method: item.method || "",
			parameter: item.parameter || "",
		});
	}

	async function handleSaveEdit(id) {
		setSavingEdit(true);
		setError("");
		try {
			const res = await fetch("/api/admin/am-items", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id, ...editForm }),
			});
			const json = await res.json();
			if (!res.ok) {
				setError(json.error || "Gagal menyimpan perubahan.");
				return;
			}
			setItems((prev) => prev.map((it) => (it.id === id ? json.data : it)));
			setEditingId(null);
		} catch {
			setError("Terjadi kesalahan. Coba lagi.");
		} finally {
			setSavingEdit(false);
		}
	}

	return (
		<div style={{ maxWidth: "1000px", margin: "0 auto", padding: "20px 16px" }}>
			<div style={{ marginBottom: "16px" }}>
				<div style={{ fontSize: "17px", fontWeight: 700, color: "#111827" }}>
					Setup Checklist Autonomous Maintenance
				</div>
				<div style={{ fontSize: "13px", color: "#6b7280" }}>
					Atur item checklist yang berlaku untuk tiap mesin
				</div>
			</div>

			{/* Grid mesin (kiri) + checklist assign (kanan), tinggi tetap + scroll internal */}
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "260px 1fr",
					gap: "16px",
					marginBottom: "16px",
				}}
			>
				{/* Kolom kiri: daftar mesin */}
				<div style={{ ...cardStyle, height: "480px" }}>
					<div style={cardHeaderStyle}>
						<div
							style={{
								fontSize: "12px",
								fontWeight: 700,
								color: "#6b7280",
								textTransform: "uppercase",
							}}
						>
							Mesin
						</div>
					</div>
					<div style={{ ...cardScrollBody, padding: "8px" }}>
						<div
							style={{ display: "flex", flexDirection: "column", gap: "2px" }}
						>
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
				</div>

				{/* Kolom kanan: item checklist untuk mesin terpilih */}
				<div style={{ ...cardStyle, height: "480px" }}>
					{!selectedMachine ? (
						<div
							style={{
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								height: "100%",
								fontSize: "13px",
								color: "#9ca3af",
								textAlign: "center",
								padding: "30px",
							}}
						>
							Pilih mesin di sebelah kiri untuk mulai mengatur checklist.
						</div>
					) : (
						<>
							<div style={cardHeaderStyle}>
								<div style={{ fontSize: "14px", fontWeight: 600 }}>
									Checklist untuk {selectedMachine.name}
								</div>
							</div>

							<div style={{ ...cardScrollBody, padding: "12px 16px" }}>
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
										}}
									>
										{items.map((item) => (
											<label
												key={item.id}
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
													checked={assignedIds.includes(item.id)}
													onChange={() => toggleItem(item.id)}
												/>
												{item.check_code ? `${item.check_code} · ` : ""}
												{item.item_text}
											</label>
										))}
										{items.length === 0 && (
											<div style={{ fontSize: "13px", color: "#9ca3af" }}>
												Belum ada item di pool. Tambah dulu di bawah.
											</div>
										)}
									</div>
								)}
							</div>

							<div
								style={{
									padding: "12px 16px",
									borderTop: "1px solid #f3f4f6",
									flexShrink: 0,
								}}
							>
								<Btn
									variant="primary"
									onClick={handleSave}
									disabled={saving || loadingMapping}
								>
									{saving ? "Menyimpan..." : "Simpan Checklist Mesin Ini"}
								</Btn>
							</div>
						</>
					)}
				</div>
			</div>

			{/* Kelola pool master item - tinggi tetap + scroll internal */}
			<div style={{ ...cardStyle, height: "420px" }}>
				<div style={cardHeaderStyle}>
					<div style={{ fontSize: "14px", fontWeight: 600 }}>
						Kelola Pool Master Item Checklist
					</div>
					<div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>
						Item di sini bisa dipakai ulang untuk banyak mesin. Klik item untuk
						edit detail.
					</div>
				</div>

				<div style={{ ...cardScrollBody, padding: "12px 16px" }}>
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							gap: "6px",
							marginBottom: "18px",
						}}
					>
						{items.map((item) =>
							editingId === item.id ? (
								<div
									key={item.id}
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
												placeholder="AM1"
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
												value={editForm.item_text}
												onChange={(e) =>
													setEditForm((f) => ({
														...f,
														item_text: e.target.value,
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
												placeholder="Visual / Listening / dsb"
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
											onClick={() => handleSaveEdit(item.id)}
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
									key={item.id}
									onClick={() => startEdit(item)}
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
											{item.check_code || "—"}
										</span>{" "}
										<span style={{ color: "#111827" }}>{item.item_text}</span>
										{item.method && (
											<span style={{ color: "#9ca3af" }}> · {item.method}</span>
										)}
									</div>
									<span style={{ fontSize: "11px", color: "#9ca3af" }}>
										Edit
									</span>
								</div>
							),
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
							Tambah Item Baru
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
									placeholder="AM1"
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
									value={newForm.item_text}
									onChange={(e) =>
										setNewForm((f) => ({ ...f, item_text: e.target.value }))
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
									placeholder="Misal: Check the machine clean inside & outside"
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
									placeholder="Visual / Listening / dsb"
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
						<Btn variant="ghost" onClick={handleAddItem} disabled={addingItem}>
							{addingItem ? "Menyimpan..." : "+ Tambah Item"}
						</Btn>
					</div>
				</div>
			</div>
		</div>
	);
}
