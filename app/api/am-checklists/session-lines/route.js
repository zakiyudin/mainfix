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
		const checklist_id = searchParams.get("checklist_id");
		if (!checklist_id)
			return NextResponse.json({ error: "checklist_id wajib diisi." }, { status: 400 });

		const { data, error } = await supabase
			.from("am_checklist_lines")
			.select("*")
			.eq("checklist_id", checklist_id)
			.order("created_at");

		if (error) throw error;
		return NextResponse.json({ data });
	} catch (e) {
		return NextResponse.json({ error: e.message }, { status: 500 });
	}
}