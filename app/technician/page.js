import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Topbar from "@/components/Topbar";
import TechnicianClient from "./TechnicianClient";

export default async function TechnicianPage() {
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
	if (!["technician", "admin"].includes(profile.role)) redirect("/login");

	const { data: requests } = await supabase
		.from("maintenance_requests")
		.select("*")
		.or(`teknisi_id.eq.${user.id},status.eq.approved`)
		.order("created_at", { ascending: false });

	return (
		<div style={{ minHeight: "100vh", background: "#f9fafb" }}>
			<Topbar user={{ full_name: profile.full_name, role: profile.role }} />
			<TechnicianClient
				initialRequests={requests || []}
				currentUserId={user.id}
			/>
		</div>
	);
}
