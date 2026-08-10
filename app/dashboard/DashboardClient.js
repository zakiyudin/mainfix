"use client";

import { useState, useMemo } from "react";
import Btn from "@/components/Btn";
import Modal from "@/components/Modal";
import {
	StatusBadge,
	PriorityBadge,
	StopBadge,
} from "@/components/Badge";

const STATUS_FILTERS = [
	{ value: "", label: "Semua Status" },
	{ value: "pending", label: "Pending" },
	{ value: "approved", label: "Approved" },
	{ value: "in_progress", label: "In Progress" },
	{ value: "closed", label: "Selesai" },
	{ value: "rejected", label: "Ditolak" },
];

function formatDate(iso) {
	return new Date(iso).toLocaleDateString("id-ID", {
		weekday: "short",
		month: "short",
		day: "numeric",
	});
}

const thStyle = {
	textAlign: "left",
	fontSize: "11px",
	fontWeight: 600,
	color: "#6b7280",
	textTransform: "uppercase",
	letterSpacing: "0.03em",
	padding: "10px 12px",
	borderBottom: "1px solid #e5e7eb",
	whiteSpace: "nowrap",
};

const tdStyle = {
	padding: "10px 12px",
	borderBottom: "1px solid #f3f4f6",
	fontSize: "13px",
	verticalAlign: "top",
};

export default function DashboardClient({ initialRequests }) {
	const [requests, setRequests] = useState(initialRequests);
	const [statusFilter, setStatusFilter] = useState("");
	const [rejectTarget, setRejectTarget] = useState(null);
	const [catatan, setCatatan] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState("");
	const [actingId, setActingId] = useState(null);

	const filtered = useMemo(() => {
		if (!statusFilter) return requests;
		return requests.filter((r) => r.status === statusFilter);
	}, [requests, statusFilter]);

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

	async function handleApprove(id) {
		setActingId(id);
		setError("");
		try {
			const updated = await patchRequest(id, { action: "approve" });
			setRequests((prev) => prev.map((r) => (r.id === id ? updated : r)));
		} catch (e) {
			setError(e.message);
		} finally {
			setActingId(null);
		}
	}

	function openReject(id) {
		setRejectTarget(id);
		setCatatan("");
		setError("");
	}

	async function handleReject() {
		if (!catatan.trim()) {
			setError("Alasan penolakan wajib diisi.");
			return;
		}
		setSubmitting(true);
		setError("");
		try {
			const updated = await patchRequest(rejectTarget, {
				action: "reject",
				catatan,
			});
			setRequests((prev) =>
				prev.map((r) => (r.id === rejectTarget ? updated : r)),
			);
			setRejectTarget(null);
		} catch (e) {
			setError(e.message);
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<div style={{ maxWidth: "1100px", margin: "0 auto", padding: "20px 16px" }}>
			<div
				style={{
					background: "#fff",
					border: "1px solid #e5e7eb",
					borderRadius: "8px",
					overflow: "hidden",
				}}
			>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						padding: "12px 16px",
						borderBottom: "1px solid #e5e7eb",
					}}
				>
					<div style={{ fontSize: "14px", fontWeight: 700, color: "#111827" }}>
						{filtered.length} REQUEST
					</div>
					<select
						value={statusFilter}
						onChange={(e) => setStatusFilter(e.target.value)}
						style={{
							fontSize: "13px",
							padding: "6px 10px",
							borderRadius: "6px",
							border: "1px solid #e5e7eb",
							fontFamily: "inherit",
							color: "#374151",
						}}
					>
						{STATUS_FILTERS.map((s) => (
							<option key={s.value} value={s.value}>
								{s.label}
							</option>
						))}
					</select>
				</div>

				<div style={{ overflowX: "auto" }}>
					<table style={{ width: "100%", borderCollapse: "collapse" }}>
						<thead>
							<tr>
								<th style={thStyle}>ID / Ref</th>
								<th style={thStyle}>Mesin / Divisi</th>
								<th style={thStyle}>Jenis</th>
								<th style={thStyle}>Problem</th>
								<th style={thStyle}>Stop</th>
								<th style={thStyle}>Prio</th>
								<th style={thStyle}>Status</th>
								<th style={thStyle}>Operator</th>
								<th style={thStyle}>Tgl</th>
								<th style={thStyle}>Aksi</th>
							</tr>
						</thead>
						<tbody>
							{filtered.length === 0 ? (
								<tr>
									<td
										colSpan={10}
										style={{
											...tdStyle,
											textAlign: "center",
											color: "#9ca3af",
											padding: "30px",
										}}
									>
										Tidak ada request.
									</td>
								</tr>
							) : (
								filtered.map((r) => (
									<tr key={r.id}>
										<td style={{ ...tdStyle, color: "#9ca3af", fontSize: "12px" }}>
											{r.id.slice(0, 8)}
											{r.no_ref ? ` · ${r.no_ref}` : ""}
										</td>
										<td style={tdStyle}>
											<div style={{ fontWeight: 600, color: "#111827" }}>
												{r.machine_name}
											</div>
											<div style={{ fontSize: "12px", color: "#9ca3af" }}>
												{r.divisi}
											</div>
										</td>
										<td style={tdStyle}>{r.job_type}</td>
										<td style={{ ...tdStyle, maxWidth: "220px" }}>
											<div style={{ color: "#374151" }}>{r.problem}</div>
										</td>
										<td style={tdStyle}>
											<StopBadge value={r.mesin_stop} />
										</td>
										<td style={tdStyle}>
											<PriorityBadge priority={r.prioritas} />
										</td>
										<td style={tdStyle}>
											<StatusBadge status={r.status} />
										</td>
										<td style={tdStyle}>{r.operator_nama}</td>
										<td style={{ ...tdStyle, color: "#9ca3af", fontSize: "12px" }}>
											{formatDate(r.created_at)}
										</td>
										<td style={tdStyle}>
											{r.status === "pending" ? (
												<div style={{ display: "flex", gap: "6px" }}>
													<Btn
														variant="primary"
														small
														disabled={actingId === r.id}
														onClick={() => handleApprove(r.id)}
													>
														Approve
													</Btn>
													<Btn
														variant="danger"
														small
														disabled={actingId === r.id}
														onClick={() => openReject(r.id)}
													>
														Reject
													</Btn>
												</div>
											) : (
												<span style={{ fontSize: "12px", color: "#d1d5db" }}>—</span>
											)}
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</div>

			{rejectTarget && (
				<Modal
					title="Tolak Request"
					onClose={() => setRejectTarget(null)}
					footer={
						<>
							<Btn
								variant="ghost"
								onClick={() => setRejectTarget(null)}
								disabled={submitting}
							>
								Batal
							</Btn>
							<Btn variant="danger" onClick={handleReject} disabled={submitting}>
								{submitting ? "Menyimpan..." : "Tolak Request"}
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
					<label
						style={{
							fontSize: "12px",
							fontWeight: 600,
							color: "#374151",
							marginBottom: "4px",
							display: "block",
						}}
					>
						Alasan Penolakan
					</label>
					<textarea
						style={{
							width: "100%",
							fontSize: "13px",
							padding: "8px 10px",
							borderRadius: "6px",
							border: "1px solid #e5e7eb",
							fontFamily: "inherit",
							minHeight: "80px",
							resize: "vertical",
							boxSizing: "border-box",
						}}
						value={catatan}
						onChange={(e) => setCatatan(e.target.value)}
						placeholder="Jelaskan alasan penolakan..."
					/>
				</Modal>
			)}
		</div>
	);
}