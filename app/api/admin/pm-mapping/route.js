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

		const { searchParams } = new URL(request.url);
		const machine_id = searchParams.get("machine_id");
		if (!machine_id)
			return NextResponse.json(
				{ error: "machine_id wajib diisi." },
				{ status: 400 },
			);

		const { data, error } = await supabase
			.from("pm_machine_activities")
			.select("activity_id, urutan, pm_activities(id, activity_text)")
			.eq("machine_id", machine_id)
			.order("urutan");

		if (error) throw error;

		const activities = (data || [])
			.filter((d) => d.pm_activities)
			.map((d) => d.pm_activities);

		return NextResponse.json({ data: data.map((d) => d.activity_id), activities });
	} catch (e) {
		return NextResponse.json({ error: e.message }, { status: 500 });
	}
}

export async function PUT(request) {
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

		if (profile?.role !== "admin")
			return NextResponse.json(
				{ error: "Hanya admin yang bisa mengatur PM mesin." },
				{ status: 403 },
			);

		const { machine_id, activity_ids } = await request.json();
		if (!machine_id || !Array.isArray(activity_ids))
			return NextResponse.json(
				{ error: "Data tidak lengkap." },
				{ status: 400 },
			);

		await supabase.from("pm_machine_activities").delete().eq("machine_id", machine_id);

		if (activity_ids.length > 0) {
			const rows = activity_ids.map((activity_id, idx) => ({
				machine_id,
				activity_id,
				urutan: idx,
			}));
			const { error: insError } = await supabase.from("pm_machine_activities").insert(rows);
			if (insError) throw insError;
		}

		return NextResponse.json({ success: true });
	} catch (e) {
		return NextResponse.json({ error: e.message }, { status: 500 });
	}
}