import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PATCH(request, { params }) {
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

		const { id } = await params;
		const body = await request.json();
		const { action } = body;

		const { data: schedule, error: fetchError } = await supabase
			.from("pm_schedules")
			.select("*")
			.eq("id", id)
			.single();

		if (fetchError || !schedule)
			return NextResponse.json(
				{ error: "Jadwal tidak ditemukan." },
				{ status: 404 },
			);

		let updates = {};

		if (action === "ambil") {
			if (profile.role !== "technician")
				return NextResponse.json(
					{ error: "Hanya teknisi yang bisa mengambil tugas." },
					{ status: 403 },
				);
			if (schedule.status !== "terjadwal")
				return NextResponse.json(
					{ error: "Tugas ini sudah diambil atau selesai." },
					{ status: 400 },
				);
			updates = {
				status: "diambil",
				teknisi_id: user.id,
				teknisi_nama: profile.full_name,
			};
		} else if (action === "selesai") {
			if (schedule.teknisi_id !== user.id)
				return NextResponse.json(
					{ error: "Tugas ini bukan milik kamu." },
					{ status: 403 },
				);
			if (schedule.status !== "diambil")
				return NextResponse.json(
					{ error: "Tugas belum diambil." },
					{ status: 400 },
				);
			if (!body.catatan_selesai?.trim())
				return NextResponse.json(
					{ error: "Catatan wajib diisi." },
					{ status: 400 },
				);
			if (!body.foto_url)
				return NextResponse.json(
					{ error: "Foto bukti wajib diupload." },
					{ status: 400 },
				);
			updates = {
				status: "selesai",
				catatan_selesai: body.catatan_selesai.trim(),
				foto_url: body.foto_url,
				completed_at: new Date().toISOString(),
			};
		} else if (action === "batal") {
			if (!["supervisor", "admin"].includes(profile.role))
				return NextResponse.json(
					{ error: "Hanya supervisor yang bisa membatalkan jadwal." },
					{ status: 403 },
				);
			updates = { status: "terjadwal", teknisi_id: null, teknisi_nama: null };
		} else {
			return NextResponse.json(
				{ error: "Action tidak valid." },
				{ status: 400 },
			);
		}

		const { data, error } = await supabase
			.from("pm_schedules")
			.update(updates)
			.eq("id", id)
			.select()
			.single();

		if (error) throw error;
		return NextResponse.json({ data });
	} catch (e) {
		return NextResponse.json({ error: e.message }, { status: 500 });
	}
}
