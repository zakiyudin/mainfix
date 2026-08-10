import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

async function requireAdmin(supabase, user) {
	const { data: profile } = await supabase
		.from("profiles")
		.select("role")
		.eq("id", user.id)
		.single();
	return profile?.role === "admin";
}

export async function GET() {
	try {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user)
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

		const { data, error } = await supabase
			.from("pm_activities")
			.select("*")
			.eq("is_active", true)
			.order("activity_text");

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

		if (!(await requireAdmin(supabase, user)))
			return NextResponse.json(
				{ error: "Hanya admin yang bisa menambah aktivitas." },
				{ status: 403 },
			);

		const { activity_text, check_code, method, parameter } =
			await request.json();
		if (!activity_text?.trim())
			return NextResponse.json(
				{ error: "Nama aktivitas wajib diisi." },
				{ status: 400 },
			);

		const { data, error } = await supabase
			.from("pm_activities")
			.insert({
				activity_text: activity_text.trim(),
				check_code: check_code?.trim() || null,
				method: method?.trim() || null,
				parameter: parameter?.trim() || null,
			})
			.select()
			.single();

		if (error) throw error;
		return NextResponse.json({ data }, { status: 201 });
	} catch (e) {
		return NextResponse.json({ error: e.message }, { status: 500 });
	}
}

export async function PATCH(request) {
	try {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user)
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

		if (!(await requireAdmin(supabase, user)))
			return NextResponse.json(
				{ error: "Hanya admin yang bisa mengubah aktivitas." },
				{ status: 403 },
			);

		const { id, activity_text, check_code, method, parameter } =
			await request.json();
		if (!id || !activity_text?.trim())
			return NextResponse.json(
				{ error: "Data tidak lengkap." },
				{ status: 400 },
			);

		const { data, error } = await supabase
			.from("pm_activities")
			.update({
				activity_text: activity_text.trim(),
				check_code: check_code?.trim() || null,
				method: method?.trim() || null,
				parameter: parameter?.trim() || null,
			})
			.eq("id", id)
			.select()
			.single();

		if (error) throw error;
		return NextResponse.json({ data });
	} catch (e) {
		return NextResponse.json({ error: e.message }, { status: 500 });
	}
}
