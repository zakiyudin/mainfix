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
			.from("am_machine_checklist_items")
			.select("item_id")
			.eq("machine_id", machine_id);

		if (error) throw error;
		return NextResponse.json({ data: data.map((d) => d.item_id) });
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
				{ error: "Hanya admin yang bisa mengatur checklist mesin." },
				{ status: 403 },
			);

		const { machine_id, item_ids } = await request.json();
		if (!machine_id || !Array.isArray(item_ids))
			return NextResponse.json(
				{ error: "Data tidak lengkap." },
				{ status: 400 },
			);

		// Hapus mapping lama, insert yang baru (replace total)
		const { error: delError } = await supabase
			.from("am_machine_checklist_items")
			.delete()
			.eq("machine_id", machine_id);

		if (delError) throw delError;

		if (item_ids.length > 0) {
			const rows = item_ids.map((item_id, idx) => ({
				machine_id,
				item_id,
				urutan: idx,
			}));
			const { error: insError } = await supabase
				.from("am_machine_checklist_items")
				.insert(rows);
			if (insError) throw insError;
		}

		return NextResponse.json({ success: true });
	} catch (e) {
		return NextResponse.json({ error: e.message }, { status: 500 });
	}
}