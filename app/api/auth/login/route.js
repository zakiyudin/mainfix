import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request) {
	try {
		const { email, password, next } = await request.json();

		if (!email || !password)
			return NextResponse.json(
				{ error: "Email dan password wajib diisi." },
				{ status: 400 },
			);

		const supabase = await createClient();

		const { data: auth, error: authError } =
			await supabase.auth.signInWithPassword({
				email: email.trim().toLowerCase(),
				password,
			});

		if (authError)
			return NextResponse.json(
				{ error: "Email atau password salah." },
				{ status: 401 },
			);

		const { data: profile, error: profileError } = await supabase
			.from("profiles")
			.select("role, full_name, divisi, is_active")
			.eq("id", auth.user.id)
			.single();

		if (profileError || !profile)
			return NextResponse.json(
				{ error: "Akun belum terdaftar. Hubungi admin." },
				{ status: 403 },
			);

		if (!profile.is_active)
			return NextResponse.json(
				{ error: "Akun tidak aktif. Hubungi admin." },
				{ status: 403 },
			);

		const redirectMap = {
			operator: "/requests",
			supervisor: "/dashboard",
			technician: "/technician",
			admin: "/dashboard",
		};

		// Pakai 'next' kalau valid (path relatif, bukan URL eksternal) — buat kasus scan QR sebelum login
		const safeNext =
			next && next.startsWith("/") && !next.startsWith("//") ? next : null;

		return NextResponse.json({
			user: {
				id: auth.user.id,
				email: auth.user.email,
				full_name: profile.full_name,
				role: profile.role,
				divisi: profile.divisi,
			},
			redirect: safeNext || redirectMap[profile.role] || "/dashboard",
		});
	} catch (e) {
		console.error("[POST /api/auth/login]", e);
		return NextResponse.json({ error: "Server error." }, { status: 500 });
	}
}
