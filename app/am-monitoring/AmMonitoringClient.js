"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";

const cardStyle = {
	background: "#fff",
	border: "1px solid #e5e7eb",
	borderRadius: "10px",
	display: "flex",
	flexDirection: "column",
};

const cardHeaderStyle = {
	padding: "14px 16px",
	borderBottom: "1px solid #f3f4f6",
	flexShrink: 0,
};

const cardBodyScroll = {
	overflowY: "auto",
	flex: 1,
};

const STATUS_STYLE = {
	belum_mulai: { label: "Belum Mulai", bg: "#f3f4f6", color: "#6b7280" },
	berjalan: { label: "Berjalan", bg: "#fffbeb", color: "#d97706" },
	selesai: { label: "Selesai", bg: "#f0fdf4", color: "#16a34a" },
};

function StatusPill({ status, abnormal }) {
	const s = STATUS_STYLE[status];
	return (
		<span
			style={{
				fontSize: "10px",
				fontWeight: 700,
				padding: "2px 6px",
				borderRadius: "4px",
				background: abnormal ? "#fef2f2" : s.bg,
				color: abnormal ? "#dc2626" : s.color,
				whiteSpace: "nowrap",
			}}
		>
			{abnormal ? "⚠ Abnormal" : s.label}
		</span>
	);
}

function formatDateTime(iso) {
	return new Date(iso).toLocaleString("id-ID", {
		day: "numeric",
		month: "short",
		hour: "2-digit",
		minute: "2-digit",
	});
}

function StatCard({ label, value, sub, accent }) {
	return (
		<div style={{ ...cardStyle, padding: "14px 16px" }}>
			<div
				style={{
					fontSize: "11px",
					fontWeight: 600,
					color: "#6b7280",
					textTransform: "uppercase",
					letterSpacing: "0.03em",
				}}
			>
				{label}
			</div>
			<div
				style={{
					fontSize: "24px",
					fontWeight: 700,
					color: accent || "#111827",
					marginTop: "4px",
				}}
			>
				{value}
			</div>
			{sub && (
				<div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "2px" }}>
					{sub}
				</div>
			)}
		</div>
	);
}

// Header grup divisi: nama + badge jumlah, bisa diklik untuk collapse/expand
function GroupHeader({ label, count, collapsed, onToggle }) {
	return (
		<div
			onClick={onToggle}
			style={{
				display: "flex",
				alignItems: "center",
				gap: "8px",
				padding: "8px 16px",
				background: "#f9fafb",
				borderTop: "1px solid #f3f4f6",
				borderBottom: "1px solid #f3f4f6",
				cursor: "pointer",
				position: "sticky",
				top: 0,
				zIndex: 1,
			}}
		>
			<span style={{ fontSize: "11px", color: "#6b7280" }}>
				{collapsed ? "▸" : "▾"}
			</span>
			<span style={{ fontSize: "12px", fontWeight: 700, color: "#111827" }}>
				{label}
			</span>
			<span
				style={{
					fontSize: "10px",
					fontWeight: 700,
					padding: "1px 7px",
					borderRadius: "999px",
					background: "#e5e7eb",
					color: "#374151",
				}}
			>
				{count}
			</span>
		</div>
	);
}

export default function AmMonitoringClient() {
	const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
	const [compliance, setCompliance] = useState([]);
	const [loadingCompliance, setLoadingCompliance] = useState(false);
	const [collapsedCompliance, setCollapsedCompliance] = useState({});

	const [stats, setStats] = useState([]);
	const [loadingStats, setLoadingStats] = useState(false);

	const [history, setHistory] = useState([]);
	const [loadingHistory, setLoadingHistory] = useState(false);
	const [abnormalOnly, setAbnormalOnly] = useState(false);
	const [collapsedHistory, setCollapsedHistory] = useState({});
	const [expandedId, setExpandedId] = useState(null);
	const [lines, setLines] = useState({});

	const [error, setError] = useState("");

	const loadCompliance = useCallback(async () => {
		setLoadingCompliance(true);
		try {
			const res = await fetch(
				`/api/am-monitoring/compliance?tanggal=${tanggal}`,
			);
			const json = await res.json();
			if (!res.ok) throw new Error(json.error);
			setCompliance(json.data || []);
		} catch (e) {
			setError(e.message);
		} finally {
			setLoadingCompliance(false);
		}
	}, [tanggal]);

	const loadStats = useCallback(async () => {
		setLoadingStats(true);
		try {
			const res = await fetch("/api/am-monitoring/stats?days=14");
			const json = await res.json();
			if (!res.ok) throw new Error(json.error);
			setStats(json.data || []);
		} catch (e) {
			setError(e.message);
		} finally {
			setLoadingStats(false);
		}
	}, []);

	const loadHistory = useCallback(async () => {
		setLoadingHistory(true);
		try {
			const params = new URLSearchParams();
			if (abnormalOnly) params.set("abnormal_only", "true");
			const res = await fetch(
				`/api/am-monitoring/history?${params.toString()}`,
			);
			const json = await res.json();
			if (!res.ok) throw new Error(json.error);
			setHistory(json.data || []);
		} catch (e) {
			setError(e.message);
		} finally {
			setLoadingHistory(false);
		}
	}, [abnormalOnly]);

	useEffect(() => {
		loadCompliance();
	}, [loadCompliance]);
	useEffect(() => {
		loadStats();
	}, [loadStats]);
	useEffect(() => {
		loadHistory();
	}, [loadHistory]);

	async function toggleExpand(id) {
		if (expandedId === id) {
			setExpandedId(null);
			return;
		}
		setExpandedId(id);
		if (!lines[id]) {
			try {
				const res = await fetch(
					`/api/am-checklists/session-lines?checklist_id=${id}`,
				);
				const json = await res.json();
				if (!res.ok) {
					setLines((prev) => ({
						...prev,
						[id]: { error: json.error || "Gagal memuat detail." },
					}));
					return;
				}
				setLines((prev) => ({ ...prev, [id]: json.data || [] }));
			} catch {
				setLines((prev) => ({
					...prev,
					[id]: { error: "Gagal memuat detail." },
				}));
			}
		}
	}

	const maxTotal = Math.max(1, ...stats.map((s) => s.total));

	// Kelompokkan compliance per divisi
	const groupedCompliance = useMemo(() => {
		const groups = {};
		compliance.forEach((m) => {
			const key = m.divisi || "Tanpa Divisi";
			if (!groups[key]) groups[key] = [];
			groups[key].push(m);
		});
		return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
	}, [compliance]);

	// Kelompokkan riwayat per divisi
	const groupedHistory = useMemo(() => {
		const groups = {};
		history.forEach((h) => {
			const key = h.machines?.divisi || "Tanpa Divisi";
			if (!groups[key]) groups[key] = [];
			groups[key].push(h);
		});
		return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
	}, [history]);

	// KPI dihitung dari seluruh data compliance (tidak difilter, karena sekarang semua tampil sekaligus dalam grup)
	const kpi = useMemo(() => {
		let totalSlots = 0,
			selesai = 0,
			abnormalCount = 0,
			belumMulai = 0;
		compliance.forEach((m) => {
			["Pagi", "Siang", "Malam"].forEach((s) => {
				totalSlots += 1;
				const shift = m.shifts[s];
				if (shift.status === "selesai") selesai += 1;
				if (shift.status === "belum_mulai") belumMulai += 1;
				if (shift.ada_abnormal) abnormalCount += 1;
			});
		});
		const complianceRate =
			totalSlots > 0 ? Math.round((selesai / totalSlots) * 100) : 0;
		return {
			totalSlots,
			selesai,
			abnormalCount,
			belumMulai,
			complianceRate,
			totalMachines: compliance.length,
		};
	}, [compliance]);

	function toggleGroupCompliance(divisi) {
		setCollapsedCompliance((prev) => ({ ...prev, [divisi]: !prev[divisi] }));
	}

	function toggleGroupHistory(divisi) {
		setCollapsedHistory((prev) => ({ ...prev, [divisi]: !prev[divisi] }));
	}

	return (
		<div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px 16px" }}>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "flex-end",
					marginBottom: "16px",
					flexWrap: "wrap",
					gap: "10px",
				}}
			>
				<div>
					<div style={{ fontSize: "18px", fontWeight: 700, color: "#111827" }}>
						Monitoring Autonomous Maintenance
					</div>
					<div style={{ fontSize: "13px", color: "#6b7280" }}>
						Compliance, riwayat, dan tren temuan checklist AM
					</div>
				</div>
				<input
					type="date"
					value={tanggal}
					onChange={(e) => setTanggal(e.target.value)}
					style={{
						fontSize: "13px",
						padding: "7px 10px",
						borderRadius: "6px",
						border: "1px solid #e5e7eb",
						fontFamily: "inherit",
						background: "#fff",
					}}
				/>
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

			{/* KPI Row */}
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
					gap: "10px",
					marginBottom: "16px",
				}}
			>
				<StatCard
					label="Mesin Ter-cover"
					value={kpi.totalMachines}
					sub="Punya checklist AM"
				/>
				<StatCard
					label="Compliance Hari Ini"
					value={`${kpi.complianceRate}%`}
					sub={`${kpi.selesai}/${kpi.totalSlots} shift selesai`}
					accent={
						kpi.complianceRate >= 80
							? "#16a34a"
							: kpi.complianceRate >= 50
								? "#d97706"
								: "#dc2626"
					}
				/>
				<StatCard
					label="Belum Mulai"
					value={kpi.belumMulai}
					sub="Slot shift"
					accent="#6b7280"
				/>
				<StatCard
					label="Ada Abnormal"
					value={kpi.abnormalCount}
					sub="Hari ini"
					accent={kpi.abnormalCount > 0 ? "#dc2626" : "#16a34a"}
				/>
			</div>

			{/* Grid utama: Compliance (kiri) + Tren (kanan) */}
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "1.3fr 1fr",
					gap: "12px",
					marginBottom: "12px",
					alignItems: "stretch",
				}}
			>
				{/* Compliance - grouped per divisi */}
				<div style={{ ...cardStyle, height: "420px" }}>
					<div style={cardHeaderStyle}>
						<div
							style={{ fontSize: "13px", fontWeight: 700, color: "#111827" }}
						>
							Compliance per Mesin
						</div>
						{loadingCompliance && (
							<span style={{ fontSize: "11px", color: "#9ca3af" }}>
								Memuat...
							</span>
						)}
					</div>
					<div style={cardBodyScroll}>
						{groupedCompliance.length === 0 && !loadingCompliance ? (
							<div
								style={{
									fontSize: "13px",
									color: "#9ca3af",
									padding: "20px",
									textAlign: "center",
								}}
							>
								Belum ada mesin dengan checklist AM yang di-setup.
							</div>
						) : (
							<table style={{ width: "100%", borderCollapse: "collapse" }}>
								<thead
									style={{
										position: "sticky",
										top: 0,
										background: "#fff",
										zIndex: 2,
									}}
								>
									<tr>
										<th
											style={{
												textAlign: "left",
												fontSize: "10px",
												fontWeight: 700,
												color: "#9ca3af",
												textTransform: "uppercase",
												padding: "8px 16px",
												borderBottom: "1px solid #f3f4f6",
											}}
										>
											Mesin
										</th>
										{["Pagi", "Siang", "Malam"].map((s) => (
											<th
												key={s}
												style={{
													textAlign: "center",
													fontSize: "10px",
													fontWeight: 700,
													color: "#9ca3af",
													textTransform: "uppercase",
													padding: "8px 6px",
													borderBottom: "1px solid #f3f4f6",
												}}
											>
												{s}
											</th>
										))}
									</tr>
								</thead>
								<tbody>
									{groupedCompliance.map(([divisi, machinesInGroup]) => (
										<React.Fragment key={divisi}>
											<tr>
												<td colSpan={4} style={{ padding: 0 }}>
													<GroupHeader
														label={divisi}
														count={machinesInGroup.length}
														collapsed={collapsedCompliance[divisi]}
														onToggle={() => toggleGroupCompliance(divisi)}
													/>
												</td>
											</tr>
											{!collapsedCompliance[divisi] &&
												machinesInGroup.map((m) => (
													<tr key={m.id}>
														<td
															style={{
																padding: "8px 16px",
																borderBottom: "1px solid #f9fafb",
																fontSize: "12px",
															}}
														>
															<div
																style={{ fontWeight: 600, color: "#111827" }}
															>
																{m.name}
															</div>
															<div
																style={{ fontSize: "10px", color: "#9ca3af" }}
															>
																{m.code}
															</div>
														</td>
														{["Pagi", "Siang", "Malam"].map((s) => (
															<td
																key={s}
																style={{
																	textAlign: "center",
																	padding: "8px 6px",
																	borderBottom: "1px solid #f9fafb",
																}}
															>
																<StatusPill
																	status={m.shifts[s].status}
																	abnormal={m.shifts[s].ada_abnormal}
																/>
															</td>
														))}
													</tr>
												))}
										</React.Fragment>
									))}
								</tbody>
							</table>
						)}
					</div>
				</div>

				{/* Tren */}
				<div style={{ ...cardStyle, height: "420px" }}>
					<div style={cardHeaderStyle}>
						<div
							style={{ fontSize: "13px", fontWeight: 700, color: "#111827" }}
						>
							Tren 14 Hari
						</div>
					</div>
					<div
						style={{
							...cardBodyScroll,
							padding: "16px",
							display: "flex",
							flexDirection: "column",
						}}
					>
						{loadingStats ? (
							<div style={{ fontSize: "13px", color: "#9ca3af" }}>
								Memuat...
							</div>
						) : (
							<>
								<div
									style={{
										display: "flex",
										alignItems: "flex-end",
										gap: "5px",
										height: "180px",
										overflowX: "auto",
										flex: 1,
									}}
								>
									{stats.map((s) => (
										<div
											key={s.tanggal}
											style={{
												display: "flex",
												flexDirection: "column",
												alignItems: "center",
												flex: "0 0 auto",
												width: "28px",
											}}
										>
											<div
												style={{
													display: "flex",
													alignItems: "flex-end",
													height: "140px",
													gap: "2px",
												}}
											>
												<div
													title={`${s.total} sesi`}
													style={{
														width: "9px",
														height: `${(s.total / maxTotal) * 140}px`,
														background: "#93c5fd",
														borderRadius: "2px 2px 0 0",
													}}
												/>
												<div
													title={`${s.abnormal} abnormal`}
													style={{
														width: "9px",
														height: `${(s.abnormal / maxTotal) * 140}px`,
														background: "#f87171",
														borderRadius: "2px 2px 0 0",
													}}
												/>
											</div>
											<div
												style={{
													fontSize: "8px",
													color: "#9ca3af",
													marginTop: "4px",
													whiteSpace: "nowrap",
												}}
											>
												{new Date(s.tanggal).toLocaleDateString("id-ID", {
													day: "numeric",
													month: "short",
												})}
											</div>
										</div>
									))}
								</div>
								<div
									style={{
										display: "flex",
										gap: "14px",
										marginTop: "10px",
										fontSize: "10px",
										color: "#6b7280",
										flexShrink: 0,
									}}
								>
									<div
										style={{
											display: "flex",
											alignItems: "center",
											gap: "4px",
										}}
									>
										<span
											style={{
												width: "9px",
												height: "9px",
												background: "#93c5fd",
												borderRadius: "2px",
												display: "inline-block",
											}}
										/>{" "}
										Total Sesi
									</div>
									<div
										style={{
											display: "flex",
											alignItems: "center",
											gap: "4px",
										}}
									>
										<span
											style={{
												width: "9px",
												height: "9px",
												background: "#f87171",
												borderRadius: "2px",
												display: "inline-block",
											}}
										/>{" "}
										Abnormal
									</div>
								</div>
							</>
						)}
					</div>
				</div>
			</div>

			{/* Riwayat - grouped per divisi */}
			<div style={{ ...cardStyle, height: "460px" }}>
				<div style={cardHeaderStyle}>
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
						}}
					>
						<div
							style={{ fontSize: "13px", fontWeight: 700, color: "#111827" }}
						>
							Riwayat Checklist
						</div>
						<label
							style={{
								fontSize: "12px",
								color: "#374151",
								display: "flex",
								alignItems: "center",
								gap: "6px",
								cursor: "pointer",
							}}
						>
							<input
								type="checkbox"
								checked={abnormalOnly}
								onChange={(e) => setAbnormalOnly(e.target.checked)}
							/>
							Ada abnormal saja
						</label>
					</div>
				</div>

				<div style={cardBodyScroll}>
					{loadingHistory ? (
						<div
							style={{
								fontSize: "13px",
								color: "#9ca3af",
								padding: "16px",
								textAlign: "center",
							}}
						>
							Memuat...
						</div>
					) : groupedHistory.length === 0 ? (
						<div
							style={{
								fontSize: "13px",
								color: "#9ca3af",
								padding: "16px",
								textAlign: "center",
							}}
						>
							Tidak ada data.
						</div>
					) : (
						groupedHistory.map(([divisi, itemsInGroup]) => (
							<div key={divisi}>
								<GroupHeader
									label={divisi}
									count={itemsInGroup.length}
									collapsed={collapsedHistory[divisi]}
									onToggle={() => toggleGroupHistory(divisi)}
								/>
								{!collapsedHistory[divisi] && (
									<div
										style={{
											display: "flex",
											flexDirection: "column",
											gap: "6px",
											padding: "8px",
										}}
									>
										{itemsInGroup.map((h) => (
											<div
												key={h.id}
												style={{
													border: "1px solid #f3f4f6",
													borderRadius: "6px",
												}}
											>
												<div
													onClick={() => toggleExpand(h.id)}
													style={{
														display: "flex",
														justifyContent: "space-between",
														alignItems: "center",
														padding: "10px 12px",
														cursor: "pointer",
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
															{h.machines?.name}{" "}
															<span
																style={{ color: "#9ca3af", fontWeight: 400 }}
															>
																({h.machines?.code})
															</span>
														</div>
														<div style={{ fontSize: "11px", color: "#6b7280" }}>
															{h.shift} · {h.operator_nama} ·{" "}
															{formatDateTime(h.created_at)}
														</div>
													</div>
													<div
														style={{
															display: "flex",
															alignItems: "center",
															gap: "8px",
														}}
													>
														{h.ada_abnormal && (
															<StatusPill status="selesai" abnormal={true} />
														)}
														<span
															style={{
																fontSize: "11px",
																color: h.is_selesai ? "#16a34a" : "#d97706",
															}}
														>
															{h.is_selesai
																? "Selesai"
																: `Berjalan (${h.completed_items}/${h.total_items})`}
														</span>
													</div>
												</div>

												{expandedId === h.id && (
													<div
														style={{
															padding: "10px 12px",
															borderTop: "1px solid #f3f4f6",
															background: "#f9fafb",
															maxHeight: "220px",
															overflowY: "auto",
														}}
													>
														<div
															style={{
																fontSize: "12px",
																color: "#6b7280",
																marginBottom: "8px",
															}}
														>
															Status Mesin: <strong>{h.status_mesin}</strong>
														</div>
														{lines[h.id]?.error && (
															<div
																style={{ fontSize: "12px", color: "#dc2626" }}
															>
																{lines[h.id].error}
															</div>
														)}
														{Array.isArray(lines[h.id]) &&
															lines[h.id].map((l) => (
																<div
																	key={l.id}
																	style={{
																		display: "flex",
																		gap: "10px",
																		padding: "8px 0",
																		borderBottom: "1px solid #e5e7eb",
																	}}
																>
																	{l.foto_url && (
																		<img
																			src={l.foto_url}
																			alt="bukti"
																			style={{
																				width: "44px",
																				height: "44px",
																				objectFit: "cover",
																				borderRadius: "4px",
																				flexShrink: 0,
																			}}
																		/>
																	)}
																	<div style={{ fontSize: "12px" }}>
																		<span
																			style={{
																				fontWeight: 600,
																				color:
																					l.kondisi === "OK"
																						? "#16a34a"
																						: "#dc2626",
																			}}
																		>
																			{l.kondisi}
																		</span>{" "}
																		— {l.item_text}
																		{l.catatan && (
																			<div style={{ color: "#6b7280" }}>
																				{l.catatan}
																			</div>
																		)}
																	</div>
																</div>
															))}
														{!lines[h.id] && (
															<div
																style={{ fontSize: "12px", color: "#9ca3af" }}
															>
																Memuat detail...
															</div>
														)}
													</div>
												)}
											</div>
										))}
									</div>
								)}
							</div>
						))
					)}
				</div>
			</div>
		</div>
	);
}
