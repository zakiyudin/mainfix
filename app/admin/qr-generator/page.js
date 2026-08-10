import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import Topbar from "@/components/Topbar";
import QrGeneratorClient from "./QrGeneratorClient";

export default async function QrGeneratorPage() {
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

	return (
		<div style={{ minHeight: "100vh", background: "#f9fafb" }}>
			<Topbar user={{ full_name: profile.full_name, role: profile.role }} />
			<Suspense
				fallback={
					<div style={{ padding: "20px", fontSize: "13px", color: "#9ca3af" }}>
						Memuat...
					</div>
				}
			>
				<QrGeneratorClient machines={machines || []} />
			</Suspense>
		</div>
	);
}
