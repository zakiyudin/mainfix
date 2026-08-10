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

		const { searchParams } = new URL(request.url);
		const status = searchParams.get("status");

		let query = supabase
			.from("pm_schedules")
			.select("*")
			.order("tanggal_jadwal", { ascending: true });

		if (profile.role === "supervisor" && profile.divisi !== "ALL")
			query = query.eq("divisi", profile.divisi);
		if (status) query = query.eq("status", status);

		const { data, error } = await query;
		if (error) throw error;
		return NextResponse.json({ data });
	} catch (e) {
		return NextResponse.json({ error: e.message }, { status: 500 });
	}
}

export async function POST(request) {
	try {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user)
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

		const { data: profile } = await supabase
			.from("profiles")
			.select("role, full_name")
			.eq("id", user.id)
			.single();

		if (!["supervisor", "admin"].includes(profile?.role))
			return NextResponse.json(
				{ error: "Hanya supervisor yang bisa membuat jadwal PM." },
				{ status: 403 },
			);

		const { machine_id, activity_id, tanggal_jadwal } = await request.json();

		if (!machine_id || !activity_id || !tanggal_jadwal)
			return NextResponse.json(
				{ error: "Data tidak lengkap." },
				{ status: 400 },
			);

		const { data: machine, error: machineError } = await supabase
			.from("machines")
			.select("code, name, divisi")
			.eq("id", machine_id)
			.single();
		if (machineError || !machine)
			return NextResponse.json({ error: "Mesin tidak ditemukan." }, { status: 404 });

		const { data: activity, error: activityError } = await supabase
			.from("pm_activities")
			.select("activity_text")
			.eq("id", activity_id)
			.single();
		if (activityError || !activity)
			return NextResponse.json({ error: "Aktivitas tidak ditemukan." }, { status: 404 });

		// Cegah dobel jadwal aktif untuk kombinasi mesin+aktivitas yang sama
		const { data: existing } = await supabase
			.from("pm_schedules")
			.select("id")
			.eq("machine_id", machine_id)
			.eq("activity_id", activity_id)
			.neq("status", "selesai")
			.maybeSingle();

		if (existing)
			return NextResponse.json(
				{ error: "Sudah ada jadwal aktif untuk mesin dan aktivitas ini." },
				{ status: 409 },
			);

		const { data, error } = await supabase
			.from("pm_schedules")
			.insert({
				machine_id,
				machine_code: machine.code,
				machine_name: machine.name,
				divisi: machine.divisi,
				activity_id,
				activity_text: activity.activity_text,
				tanggal_jadwal,
				created_by: user.id,
				created_by_nama: profile.full_name,
			})
			.select()
			.single();

		if (error) throw error;
		return NextResponse.json({ data }, { status: 201 });
	} catch (e) {
		return NextResponse.json({ error: e.message }, { status: 500 });
	}
}