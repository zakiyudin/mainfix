import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Topbar from "@/components/Topbar";
import AmSetupClient from "./AmSetupClient";

export default async function AmSetupPage() {
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

	const { data: items } = await supabase
		.from("am_checklist_items")
		.select("*")
		.eq("is_active", true)
		.order("item_text");

	return (
		<div style={{ minHeight: "100vh", background: "#f9fafb" }}>
			<Topbar user={{ full_name: profile.full_name, role: profile.role }} />
			<AmSetupClient
				initialMachines={machines || []}
				initialItems={items || []}
			/>
		</div>
	);
}
