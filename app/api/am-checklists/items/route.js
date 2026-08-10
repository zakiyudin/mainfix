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
		const shift = searchParams.get("shift");

		if (!machine_id)
			return NextResponse.json(
				{ error: "machine_id wajib diisi." },
				{ status: 400 },
			);

		const { data: machine, error: machineError } = await supabase
			.from("machines")
			.select("id, code, name, divisi")
			.eq("id", machine_id)
			.single();

		if (machineError || !machine)
			return NextResponse.json(
				{ error: "Mesin tidak ditemukan." },
				{ status: 404 },
			);

		const { data: mapping, error: mapError } = await supabase
			.from("am_machine_checklist_items")
			.select("urutan, am_checklist_items(id, item_text)")
			.eq("machine_id", machine_id)
			.order("urutan");

		if (mapError) throw mapError;

		const items = (mapping || [])
			.filter((m) => m.am_checklist_items)
			.map((m) => ({
				id: m.am_checklist_items.id,
				item_text: m.am_checklist_items.item_text,
			}));

		let already_submitted = false;
		if (shift) {
			const today = new Date().toISOString().slice(0, 10);
			const { data: existing } = await supabase
				.from("am_checklists")
				.select("id")
				.eq("machine_id", machine_id)
				.eq("tanggal", today)
				.eq("shift", shift)
				.maybeSingle();
			already_submitted = !!existing;
		}

		return NextResponse.json({ machine, items, already_submitted });
	} catch (e) {
		return NextResponse.json({ error: e.message }, { status: 500 });
	}
}