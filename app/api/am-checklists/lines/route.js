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
			.select("full_name")
			.eq("id", user.id)
			.single();

		const { checklist_id, item_id, item_text, kondisi, catatan, foto_url } =
			await request.json();

		if (!checklist_id || !item_id || !item_text || !kondisi)
			return NextResponse.json(
				{ error: "Data tidak lengkap." },
				{ status: 400 },
			);
		if (kondisi === "Tidak OK" && !catatan?.trim())
			return NextResponse.json(
				{ error: "Catatan wajib diisi untuk kondisi Tidak OK." },
				{ status: 400 },
			);
		if (kondisi === "Tidak OK" && !foto_url)
			return NextResponse.json(
				{ error: "Foto bukti wajib diupload untuk kondisi Tidak OK." },
				{ status: 400 },
			);
		if (!foto_url)
			return NextResponse.json(
				{ error: "Foto bukti wajib diupload." },
				{ status: 400 },
			);

		const { data: checklist, error: checklistError } = await supabase
			.from("am_checklists")
			.select("id, machine_id, operator_id")
			.eq("id", checklist_id)
			.single();

		if (checklistError || !checklist)
			return NextResponse.json(
				{ error: "Sesi checklist tidak ditemukan." },
				{ status: 404 },
			);

		if (checklist.operator_id !== user.id)
			return NextResponse.json(
				{ error: "Sesi ini bukan milik kamu." },
				{ status: 403 },
			);

		const { data: line, error: lineError } = await supabase
			.from("am_checklist_lines")
			.insert({
				checklist_id,
				item_id,
				item_text,
				kondisi,
				catatan: catatan || null,
				foto_url: foto_url || null,
			})
			.select()
			.single();

		if (lineError) {
			if (lineError.code === "23505")
				return NextResponse.json(
					{ error: "Aktivitas ini sudah diisi." },
					{ status: 409 },
				);
			throw lineError;
		}

		let requestCreated = false;

		if (kondisi === "Tidak OK") {
			const { data: machine } = await supabase
				.from("machines")
				.select("code, name, divisi")
				.eq("id", checklist.machine_id)
				.single();

			await supabase
				.from("am_checklists")
				.update({ ada_abnormal: true })
				.eq("id", checklist_id);

			if (machine) {
				const { error: reqError } = await supabase
					.from("maintenance_requests")
					.insert({
						machine_id: checklist.machine_id,
						machine_code: machine.code,
						machine_name: machine.name,
						divisi: machine.divisi,
						job_type: "Perawatan",
						mesin_stop: "No",
						prioritas: "Medium",
						problem: `[AM] ${item_text}: ${catatan}`,
						status: "pending",
						operator_id: user.id,
						operator_nama: profile?.full_name,
						source: "AM",
						am_checklist_id: checklist_id,
						foto_url,
					});
				if (reqError) throw reqError;
				requestCreated = true;
			}
		}

		return NextResponse.json({ data: line, requestCreated }, { status: 201 });
	} catch (e) {
		return NextResponse.json({ error: e.message }, { status: 500 });
	}
}
