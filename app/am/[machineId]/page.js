import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Topbar from "@/components/Topbar";
import AmSessionClient from "./AmSessionClient";

export default async function AmMachinePage({ params }) {
	const { machineId } = await params;
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) redirect(`/login?next=/am/${machineId}`);

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

	return (
		<div style={{ minHeight: "100vh", background: "#f9fafb" }}>
			<Topbar user={{ full_name: profile.full_name, role: profile.role }} />
			<AmSessionClient machine={machine} />
		</div>
	);
}
