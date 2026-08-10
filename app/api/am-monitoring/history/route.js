import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

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
		const machine_id = searchParams.get("machine_id");
		const shift = searchParams.get("shift");
		const abnormal_only = searchParams.get("abnormal_only");

		let query = supabase
			.from("am_checklists")
			.select("*, machines(name, code, divisi)")
			.order("created_at", { ascending: false })
			.limit(100);

		if (profile.role === "supervisor" && profile.divisi !== "ALL")
			query = query.eq("machines.divisi", profile.divisi);
		if (machine_id) query = query.eq("machine_id", machine_id);
		if (shift) query = query.eq("shift", shift);
		if (abnormal_only === "true") query = query.eq("ada_abnormal", true);

		const { data, error } = await query;
		if (error) throw error;

		const filtered =
			profile.role === "supervisor" && profile.divisi !== "ALL"
				? (data || []).filter((d) => d.machines?.divisi === profile.divisi)
				: data || [];

		// Hitung total item per mesin & jumlah line yang sudah diisi per sesi
		const machineIds = [...new Set(filtered.map((d) => d.machine_id))];
		const { data: mapping } = await supabase
			.from("am_machine_checklist_items")
			.select("machine_id")
			.in("machine_id", machineIds);

		const itemCountByMachine = {};
		(mapping || []).forEach((m) => {
			itemCountByMachine[m.machine_id] =
				(itemCountByMachine[m.machine_id] || 0) + 1;
		});

		const sessionIds = filtered.map((d) => d.id);
		const { data: lines } = await supabase
			.from("am_checklist_lines")
			.select("checklist_id")
			.in("checklist_id", sessionIds);

		const lineCounts = {};
		(lines || []).forEach((l) => {
			lineCounts[l.checklist_id] = (lineCounts[l.checklist_id] || 0) + 1;
		});

		const result = filtered.map((d) => {
			const total = itemCountByMachine[d.machine_id] || 0;
			const done = lineCounts[d.id] || 0;
			return {
				...d,
				total_items: total,
				completed_items: done,
				is_selesai: total > 0 && done >= total,
			};
		});

		return NextResponse.json({ data: result });
	} catch (e) {
		return NextResponse.json({ error: e.message }, { status: 500 });
	}
}
