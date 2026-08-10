import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

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

		if (!["operator", "admin"].includes(profile?.role))
			return NextResponse.json(
				{ error: "Hanya operator yang bisa memulai checklist." },
				{ status: 403 },
			);

		const { machine_id, shift, status_mesin } = await request.json();

		if (!machine_id || !shift || !status_mesin)
			return NextResponse.json(
				{ error: "Data tidak lengkap." },
				{ status: 400 },
			);

		const { data, error } = await supabase
			.from("am_checklists")
			.insert({
				machine_id,
				operator_id: user.id,
				operator_nama: profile.full_name,
				shift,
				status_mesin,
			})
			.select()
			.single();

		if (error) {
			if (error.code === "23505")
				return NextResponse.json(
					{
						error:
							"Checklist untuk mesin, tanggal, dan shift ini sudah pernah dimulai.",
					},
					{ status: 409 },
				);
			throw error;
		}

		return NextResponse.json({ data }, { status: 201 });
	} catch (e) {
		return NextResponse.json({ error: e.message }, { status: 500 });
	}
}
