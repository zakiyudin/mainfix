import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Topbar from "@/components/Topbar";
import PmActivityClient from "./PmActivityClient";

export default async function PmActivityPage({ params }) {
	const { machineId, activityId } = await params;
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) redirect(`/login?next=/pm/${machineId}/activity/${activityId}`);

	const { data: profile } = await supabase
		.from("profiles")
		.select("role, full_name, is_active")
		.eq("id", user.id)
		.single();

	if (!profile || !profile.is_active) redirect("/login");
	if (!["technician", "admin"].includes(profile.role)) redirect("/requests");

	const { data: machine } = await supabase
		.from("machines")
		.select("id, code, name, divisi")
		.eq("id", machineId)
		.single();
	if (!machine) redirect("/technician");

	const { data: activity } = await supabase
		.from("pm_activities")
		.select("*")
		.eq("id", activityId)
		.single();
	if (!activity) redirect("/technician");

	const { data: schedule } = await supabase
		.from("pm_schedules")
		.select("*")
		.eq("machine_id", machineId)
		.eq("activity_id", activityId)
		.neq("status", "selesai")
		.order("tanggal_jadwal", { ascending: true })
		.limit(1)
		.maybeSingle();

	return (
		<div style={{ minHeight: "100vh", background: "#f9fafb" }}>
			<Topbar user={{ full_name: profile.full_name, role: profile.role }} />
			<PmActivityClient machine={machine} activity={activity} initialSchedule={schedule} currentUserId={user.id} />
		</div>
	);
}