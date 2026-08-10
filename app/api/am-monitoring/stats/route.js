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
			.select("role")
			.eq("id", user.id)
			.single();

		if (!["supervisor", "admin"].includes(profile?.role))
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });

		const { searchParams } = new URL(request.url);
		const days = parseInt(searchParams.get("days") || "14", 10);

		const cutoff = new Date();
		cutoff.setDate(cutoff.getDate() - (days - 1));
		const cutoffStr = cutoff.toISOString().slice(0, 10);

		const { data, error } = await supabase
			.from("am_checklists")
			.select("tanggal, ada_abnormal")
			.gte("tanggal", cutoffStr);
		if (error) throw error;

		const byDate = {};
		for (let i = 0; i < days; i++) {
			const d = new Date(cutoff);
			d.setDate(d.getDate() + i);
			const key = d.toISOString().slice(0, 10);
			byDate[key] = { tanggal: key, total: 0, abnormal: 0 };
		}

		(data || []).forEach((row) => {
			if (byDate[row.tanggal]) {
				byDate[row.tanggal].total += 1;
				if (row.ada_abnormal) byDate[row.tanggal].abnormal += 1;
			}
		});

		return NextResponse.json({ data: Object.values(byDate) });
	} catch (e) {
		return NextResponse.json({ error: e.message }, { status: 500 });
	}
}