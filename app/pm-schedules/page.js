import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Topbar from "@/components/Topbar";
import PmSchedulesClient from "./PmSchedulesClient";

export default async function PmSchedulesPage() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) redirect("/login");

	const { data: profile } = await supabase
		.from("profiles")
		.select("role, full_name, divisi, is_active")
		.eq("id", user.id)
		.single();

	if (!profile || !profile.is_active) redirect("/login");
	if (!["supervisor", "admin"].includes(profile.role)) redirect("/dashboard");

	let query = supabase
		.from("pm_schedules")
		.select("*")
		.order("tanggal_jadwal", { ascending: true });

	if (profile.role === "supervisor" && profile.divisi !== "ALL")
		query = query.eq("divisi", profile.divisi);

	const { data: schedules } = await query;

	const { data: machines } = await supabase
		.from("machines")
		.select("id, code, name, divisi")
		.eq("status", "active")
		.order("name");

	return (
		<div style={{ minHeight: "100vh", background: "#f9fafb" }}>
			<Topbar user={{ full_name: profile.full_name, role: profile.role }} />
			<PmSchedulesClient initialSchedules={schedules || []} machines={machines || []} />
		</div>
	);
}