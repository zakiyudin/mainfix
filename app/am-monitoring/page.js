import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Topbar from "@/components/Topbar";
import AmMonitoringClient from "./AmMonitoringClient";

export default async function AmMonitoringPage() {
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

	return (
		<div style={{ minHeight: "100vh", background: "#f9fafb" }}>
			<Topbar user={{ full_name: profile.full_name, role: profile.role }} />
			<AmMonitoringClient />
		</div>
	);
}