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
			.from("maintenance_requests")
			.select("*")
			.order("created_at", { ascending: false });

		if (profile.role === "operator") query = query.eq("operator_id", user.id);
		else if (profile.role === "supervisor" && profile.divisi !== "ALL")
			query = query.eq("divisi", profile.divisi);
		else if (profile.role === "technician")
			query = query.or(`teknisi_id.eq.${user.id},status.eq.approved`);

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
			.select("role, full_name, divisi")
			.eq("id", user.id)
			.single();

		if (!["operator", "admin"].includes(profile.role))
			return NextResponse.json(
				{ error: "Hanya operator yang bisa buat request." },
				{ status: 403 },
			);

		const body = await request.json();
		const { machine_id, no_ref, job_type, mesin_stop, prioritas, problem, foto_url } = body;

		if (!machine_id || !job_type || !mesin_stop || !problem)
			return NextResponse.json(
				{ error: "Data tidak lengkap." },
				{ status: 400 },
			);

		// Ambil data mesin
		const { data: machine } = await supabase
			.from("machines")
			.select("code, name, divisi")
			.eq("id", machine_id)
			.single();

		if (!machine)
			return NextResponse.json(
				{ error: "Mesin tidak ditemukan." },
				{ status: 404 },
			);

		// Validasi mesin sesuai divisi
		if (profile.divisi !== "ALL" && machine.divisi !== profile.divisi)
			return NextResponse.json(
				{ error: "Mesin bukan milik divisi kamu." },
				{ status: 403 },
			);

		const { data, error } = await supabase
			.from("maintenance_requests")
			.insert({
				machine_id,
				machine_code: machine.code,
				machine_name: machine.name,
				divisi: machine.divisi,
				no_ref: no_ref || null,
				job_type,
				mesin_stop,
				prioritas: prioritas || "Medium",
				problem,
				status: "pending",
				operator_id: user.id,
				operator_nama: profile.full_name,
				foto_url: foto_url || null,
			})
			.select()
			.single();

		if (error) throw error;
		return NextResponse.json({ data }, { status: 201 });
	} catch (e) {
		return NextResponse.json({ error: e.message }, { status: 500 });
	}
}
