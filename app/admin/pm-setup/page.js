import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Topbar from "@/components/Topbar";
import PmSetupClient from "./PmSetupClient";

export default async function PmSetupPage() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) redirect("/login");

	const { data: profile } = await supabase
		.from("profiles")
		.select("role, full_name, is_active")
		.eq("id", user.id)
		.single();

	if (!profile || !profile.is_active) redirect("/login");
	if (profile.role !== "admin") redirect("/dashboard");

	const { data: machines } = await supabase
		.from("machines")
		.select("*")
		.eq("status", "active")
		.order("name");

	const { data: activities } = await supabase
		.from("pm_activities")
		.select("*")
		.eq("is_active", true)
		.order("activity_text");

	return (
		<div style={{ minHeight: "100vh", background: "#f9fafb" }}>
			<Topbar user={{ full_name: profile.full_name, role: profile.role }} />
			<PmSetupClient initialMachines={machines || []} initialActivities={activities || []} />
		</div>
	);
}