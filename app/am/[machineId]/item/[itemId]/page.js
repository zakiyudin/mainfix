import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Topbar from "@/components/Topbar";
import AmItemClient from "./AmItemClient";

export default async function AmItemPage({ params, searchParams }) {
	const { machineId, itemId } = await params;
	const { shift } = await searchParams;
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) redirect(`/login?next=/am/${machineId}/item/${itemId}`);

	const { data: profile } = await supabase
		.from("profiles")
		.select("role, full_name, is_active")
		.eq("id", user.id)
		.single();

	if (!profile || !profile.is_active) redirect("/login");
	if (!["operator", "admin"].includes(profile.role)) redirect("/requests");

	const { data: machine } = await supabase
		.from("machines")
		.select("id, code, name, divisi")
		.eq("id", machineId)
		.single();
	if (!machine) redirect("/requests");

	const { data: item } = await supabase
		.from("am_checklist_items")
		.select("*")
		.eq("id", itemId)
		.single();
	if (!item) redirect(`/am/${machineId}`);

	// Cari sesi checklist milik user ini, hari ini, untuk mesin ini
	const today = new Date().toISOString().slice(0, 10);
	let sessionQuery = supabase
		.from("am_checklists")
		.select("*")
		.eq("machine_id", machineId)
		.eq("operator_id", user.id)
		.eq("tanggal", today);

	if (shift) sessionQuery = sessionQuery.eq("shift", shift);

	const { data: sessions } = await sessionQuery.order("created_at", { ascending: false });
	const session = sessions?.[0];

	if (!session) redirect(`/am/${machineId}`);

	return (
		<div style={{ minHeight: "100vh", background: "#f9fafb" }}>
			<Topbar user={{ full_name: profile.full_name, role: profile.role }} />
			<AmItemClient machine={machine} item={item} checklistId={session.id} />
		</div>
	);
}