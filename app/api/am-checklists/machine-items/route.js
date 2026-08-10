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

		const { data: mapping, error } = await supabase
			.from("am_machine_checklist_items")
			.select("urutan, am_checklist_items(id, item_text, check_code, method, parameter)")
			.eq("machine_id", machine_id)
			.order("urutan");

		if (error) throw error;

		const items = (mapping || [])
			.filter((m) => m.am_checklist_items)
			.map((m) => m.am_checklist_items);

		return NextResponse.json({ items });
	} catch (e) {
		return NextResponse.json({ error: e.message }, { status: 500 });
	}
}