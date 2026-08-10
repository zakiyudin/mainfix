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

		const { id } = await params;
		const { foto_url } = await request.json();

		if (!foto_url)
			return NextResponse.json(
				{ error: "Foto bukti wajib diupload." },
				{ status: 400 },
			);

		const { data: session, error: sessionError } = await supabase
			.from("am_checklists")
			.select("id, machine_id, operator_id, foto_url")
			.eq("id", id)
			.single();

		if (sessionError || !session)
			return NextResponse.json(
				{ error: "Sesi checklist tidak ditemukan." },
				{ status: 404 },
			);

		if (session.operator_id !== user.id)
			return NextResponse.json(
				{ error: "Sesi ini bukan milik kamu." },
				{ status: 403 },
			);

		if (session.foto_url)
			return NextResponse.json(
				{ error: "Checklist ini sudah diselesaikan sebelumnya." },
				{ status: 400 },
			);

		// Validasi semua item sudah diisi
		const { data: mapping } = await supabase
			.from("am_machine_checklist_items")
			.select("item_id")
			.eq("machine_id", session.machine_id);

		const { data: lines } = await supabase
			.from("am_checklist_lines")
			.select("item_id")
			.eq("checklist_id", id);

		const totalItems = mapping?.length || 0;
		const totalLines = lines?.length || 0;

		if (totalItems > 0 && totalLines < totalItems)
			return NextResponse.json(
				{ error: `Masih ada ${totalItems - totalLines} aktivitas yang belum diisi.` },
				{ status: 400 },
			);

		const { data, error } = await supabase
			.from("am_checklists")
			.update({ foto_url })
			.eq("id", id)
			.select()
			.single();

		if (error) throw error;
		return NextResponse.json({ data });
	} catch (e) {
		return NextResponse.json({ error: e.message }, { status: 500 });
	}
}