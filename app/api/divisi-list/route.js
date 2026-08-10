import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
	try {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user)
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

		const { data, error } = await supabase
			.from("machines")
			.select("divisi")
			.eq("status", "active");

		if (error) throw error;

		const unique = [...new Set((data || []).map((d) => d.divisi).filter(Boolean))].sort();
		return NextResponse.json({ data: unique });
	} catch (e) {
		return NextResponse.json({ error: e.message }, { status: 500 });
	}
}