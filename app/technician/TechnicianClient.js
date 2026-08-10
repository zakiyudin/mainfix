"use client";

import { useState, useMemo } from "react";
import Btn from "@/components/Btn";
import Modal from "@/components/Modal";
import { StatusBadge, PriorityBadge, StopBadge } from "@/components/Badge";

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
		hour: "2-digit",
		minute: "2-digit",
	});
}

const emptyCloseForm = { penyebab: "", perbaikan: "", spare_part: [] };

export default function TechnicianClient({ initialRequests, currentUserId }) {
	const [requests, setRequests] = useState(initialRequests);
	const [error, setError] = useState("");
	const [actingId, setActingId] = useState(null);

	const [closeTarget, setCloseTarget] = useState(null);
	const [closeForm, setCloseForm] = useState(emptyCloseForm);
	const [spareparts, setSpareparts] = useState([]);
	const [sparepartsLoading, setSparepartsLoading] = useState(false);
	const [submitting, setSubmitting] = useState(false);

	const toStart = useMemo(
		() => requests.filter((r) => r.status === "approved"),
		[requests],
	);
	const inProgress = useMemo(
		() =>
			requests.filter(
				(r) => r.status === "in_progress" && r.teknisi_id === currentUserId,
			),
		[requests, currentUserId],
	);

	async function patchRequest(id, body) {
		const res = await fetch(`/api/requests/${id}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
		});
		const json = await res.json();
		if (!res.ok) throw new Error(json.error || "Terjadi kesalahan.");
		return json.data;
	}

	async function handleStart(id) {
		setActingId(id);
		setError("");
		try {
			const updated = await patchRequest(id, { action: "start" });
			setRequests((prev) => prev.map((r) => (r.id === id ? updated : r)));
		} catch (e) {
			setError(e.message);
		} finally {
			setActingId(null);
		}
	}

	async function openClose(id) {
		setCloseTarget(id);
		setCloseForm(emptyCloseForm);
		setError("");
		setSparepartsLoading(true);
		try {
			const res = await fetch("/api/spareparts");
			const json = await res.json();
			if (res.ok) setSpareparts(json.data || []);
		} catch {
			// diamkan, sparepart opsional
		} finally {
			setSparepartsLoading(false);
		}
	}

	function toggleSparepart(name) {
		setCloseForm((f) => ({
			...f,
			spare_part: f.spare_part.includes(name)
				? f.spare_part.filter((s) => s !== name)
				: [...f.spare_part, name],
		}));
	}

	async function handleCloseSubmit() {
		if (!closeForm.penyebab.trim() || !closeForm.perbaikan.trim()) {
			setError("Penyebab dan perbaikan wajib diisi.");
			return;
		}
		setSubmitting(true);
		setError("");
		try {
			const updated = await patchRequest(closeTarget, {
				action: "close",
				penyebab: closeForm.penyebab,
				perbaikan: closeForm.perbaikan,
				spare_part: closeForm.spare_part.length
					? closeForm.spare_part.join(", ")
					: null,
			});
			setRequests((prev) =>
				prev.map((r) => (r.id === closeTarget ? updated : r)),
			);
			setCloseTarget(null);
		} catch (e) {
			setError(e.message);
		} finally {
			setSubmitting(false);
		}
	}

	function RequestCard({ r, children }) {
		return (
			<div
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
							style={{ fontSize: "14px", fontWeight: 600, color: "#111827" }}
						>
							{r.machine_name}{" "}
							<span style={{ color: "#9ca3af", fontWeight: 400 }}>
								({r.machine_code})
							</span>
						</div>
						<div
							style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}
						>
							{r.job_type} · {r.operator_nama} · {formatDate(r.created_at)}
						</div>
					</div>
					<StatusBadge status={r.status} />
				</div>

				<div
					style={{ fontSize: "13px", color: "#374151", marginBottom: "8px" }}
				>
					{r.problem}
				</div>

				<div style={{ display: "flex", gap: "6px", marginBottom: "10px" }}>
					<PriorityBadge priority={r.prioritas} />
					<StopBadge value={r.mesin_stop} />
				</div>

				{children}
			</div>
		);
	}

	return (
		<div style={{ maxWidth: "720px", margin: "0 auto", padding: "20px 16px" }}>
			<div style={{ marginBottom: "20px" }}>
				<div style={{ fontSize: "17px", fontWeight: 700, color: "#111827" }}>
					Tugas Teknisi
				</div>
				<div style={{ fontSize: "13px", color: "#6b7280" }}>
					Request yang siap dikerjakan dan sedang kamu tangani
				</div>
			</div>

			{error && !closeTarget && (
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

			{inProgress.length > 0 && (
				<div style={{ marginBottom: "22px" }}>
					<div
						style={{
							fontSize: "12px",
							fontWeight: 700,
							color: "#16a34a",
							textTransform: "uppercase",
							letterSpacing: "0.03em",
							marginBottom: "8px",
						}}
					>
						Sedang Dikerjakan ({inProgress.length})
					</div>
					<div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
						{inProgress.map((r) => (
							<RequestCard key={r.id} r={r}>
								<Btn variant="success" onClick={() => openClose(r.id)}>
									Selesaikan
								</Btn>
							</RequestCard>
						))}
					</div>
				</div>
			)}

			<div>
				<div
					style={{
						fontSize: "12px",
						fontWeight: 700,
						color: "#2563eb",
						textTransform: "uppercase",
						letterSpacing: "0.03em",
						marginBottom: "8px",
					}}
				>
					Siap Dikerjakan ({toStart.length})
				</div>
				{toStart.length === 0 ? (
					<div
						style={{
							background: "#fff",
							border: "1px solid #e5e7eb",
							borderRadius: "8px",
							padding: "30px 20px",
							textAlign: "center",
							fontSize: "13px",
							color: "#9ca3af",
						}}
					>
						Belum ada request yang siap dikerjakan.
					</div>
				) : (
					<div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
						{toStart.map((r) => (
							<RequestCard key={r.id} r={r}>
								<Btn
									variant="primary"
									disabled={actingId === r.id}
									onClick={() => handleStart(r.id)}
								>
									{actingId === r.id ? "Memproses..." : "Ambil"}
								</Btn>
							</RequestCard>
						))}
					</div>
				)}
			</div>

			{closeTarget && (
				<Modal
					title="Selesaikan Request"
					onClose={() => setCloseTarget(null)}
					footer={
						<>
							<Btn
								variant="ghost"
								onClick={() => setCloseTarget(null)}
								disabled={submitting}
							>
								Batal
							</Btn>
							<Btn
								variant="success"
								onClick={handleCloseSubmit}
								disabled={submitting}
							>
								{submitting ? "Menyimpan..." : "Tutup Request"}
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
						<label style={labelStyle}>Penyebab</label>
						<textarea
							style={{ ...inputStyle, minHeight: "60px", resize: "vertical" }}
							value={closeForm.penyebab}
							onChange={(e) =>
								setCloseForm((f) => ({ ...f, penyebab: e.target.value }))
							}
							placeholder="Apa penyebab kerusakan/masalahnya?"
						/>
					</div>

					<div style={fieldWrap}>
						<label style={labelStyle}>Perbaikan yang Dilakukan</label>
						<textarea
							style={{ ...inputStyle, minHeight: "60px", resize: "vertical" }}
							value={closeForm.perbaikan}
							onChange={(e) =>
								setCloseForm((f) => ({ ...f, perbaikan: e.target.value }))
							}
							placeholder="Apa yang sudah dikerjakan untuk memperbaiki?"
						/>
					</div>

					<div style={{ ...fieldWrap, marginBottom: 0 }}>
						<label style={labelStyle}>Sparepart Digunakan (opsional)</label>
						{sparepartsLoading ? (
							<div style={{ fontSize: "12px", color: "#9ca3af" }}>
								Memuat daftar sparepart...
							</div>
						) : spareparts.length === 0 ? (
							<div style={{ fontSize: "12px", color: "#9ca3af" }}>
								Tidak ada data sparepart.
							</div>
						) : (
							<div
								style={{
									display: "flex",
									flexDirection: "column",
									gap: "4px",
									maxHeight: "160px",
									overflowY: "auto",
									border: "1px solid #e5e7eb",
									borderRadius: "6px",
									padding: "8px 10px",
								}}
							>
								{spareparts.map((sp) => (
									<label
										key={sp.id}
										style={{
											display: "flex",
											alignItems: "center",
											gap: "8px",
											fontSize: "13px",
											color: "#374151",
											cursor: "pointer",
										}}
									>
										<input
											type="checkbox"
											checked={closeForm.spare_part.includes(sp.name)}
											onChange={() => toggleSparepart(sp.name)}
										/>
										{sp.name}
									</label>
								))}
							</div>
						)}
					</div>
				</Modal>
			)}
		</div>
	);
}
