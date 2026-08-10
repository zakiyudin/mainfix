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

		if (!machine_id || !shift)
			return NextResponse.json(
				{ error: "machine_id dan shift wajib diisi." },
				{ status: 400 },
			);

		const today = new Date().toISOString().slice(0, 10);

		const { data: session, error } = await supabase
			.from("am_checklists")
			.select("*")
			.eq("machine_id", machine_id)
			.eq("shift", shift)
			.eq("tanggal", today)
			.maybeSingle();

		if (error) throw error;
		if (!session) return NextResponse.json({ exists: false });

		const { data: lines, error: linesError } = await supabase
			.from("am_checklist_lines")
			.select("*")
			.eq("checklist_id", session.id);

		if (linesError) throw linesError;

		return NextResponse.json({ exists: true, session, lines: lines || [] });
	} catch (e) {
		return NextResponse.json({ error: e.message }, { status: 500 });
	}
}