import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function getUser() {
	const supabase = await createClient();

	const {
		data: { user },
		error,
	} = await supabase.auth.getUser();
	if (error || !user) redirect("/login");

	const { data: profile } = await supabase
		.from("profiles")
		.select("full_name, role, divisi, employee_id")
		.eq("id", user.id)
		.single();

	if (!profile) redirect("/login");

	return {
		id: user.id,
		email: user.email,
		full_name: profile.full_name,
		role: profile.role,
		divisi: profile.divisi,
	};
}
