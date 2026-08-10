import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const SHIFTS = ["Pagi", "Siang", "Malam"];

export async function GET(request) {
	try {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user)
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

		const { data: profile } = await supabase
			.from("profiles")
			.select("role, divisi")
			.eq("id", user.id)
			.single();

		if (!["supervisor", "admin"].includes(profile?.role))
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });

		const { searchParams } = new URL(request.url);
		const tanggal =
			searchParams.get("tanggal") || new Date().toISOString().slice(0, 10);

		let machineQuery = supabase
			.from("machines")
			.select("id, code, name, divisi")
			.eq("status", "active");
		if (profile.role === "supervisor" && profile.divisi !== "ALL")
			machineQuery = machineQuery.eq("divisi", profile.divisi);

		const { data: machines, error: machineError } = await machineQuery;
		if (machineError) throw machineError;

		const { data: mapping, error: mapError } = await supabase
			.from("am_machine_checklist_items")
			.select("machine_id");
		if (mapError) throw mapError;

		const itemCountByMachine = {};
		(mapping || []).forEach((m) => {
			itemCountByMachine[m.machine_id] =
				(itemCountByMachine[m.machine_id] || 0) + 1;
		});

		const relevantMachines = (machines || []).filter(
			(m) => itemCountByMachine[m.id],
		);

		const { data: sessions, error: sessionError } = await supabase
			.from("am_checklists")
			.select("id, machine_id, shift, ada_abnormal")
			.eq("tanggal", tanggal)
			.in(
				"machine_id",
				relevantMachines.map((m) => m.id),
			);
		if (sessionError) throw sessionError;

		const sessionIds = (sessions || []).map((s) => s.id);
		let lineCounts = {};
		if (sessionIds.length > 0) {
			const { data: lines, error: lineError } = await supabase
				.from("am_checklist_lines")
				.select("checklist_id")
				.in("checklist_id", sessionIds);
			if (lineError) throw lineError;
			(lines || []).forEach((l) => {
				lineCounts[l.checklist_id] = (lineCounts[l.checklist_id] || 0) + 1;
			});
		}

		const result = relevantMachines.map((m) => {
			const shifts = {};
			SHIFTS.forEach((s) => {
				const found = sessions.find(
					(sess) => sess.machine_id === m.id && sess.shift === s,
				);
				if (!found) {
					shifts[s] = { status: "belum_mulai" };
				} else {
					const done = lineCounts[found.id] || 0;
					const total = itemCountByMachine[m.id] || 0;
					shifts[s] = {
						status: done >= total && total > 0 ? "selesai" : "berjalan",
						ada_abnormal: found.ada_abnormal,
					};
				}
			});
			return { ...m, shifts };
		});

		return NextResponse.json({ tanggal, data: result });
	} catch (e) {
		return NextResponse.json({ error: e.message }, { status: 500 });
	}
}
