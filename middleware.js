import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function middleware(request) {
	let supabaseResponse = NextResponse.next({ request });

	const supabase = createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
		{
			cookies: {
				getAll() {
					return request.cookies.getAll();
				},
				setAll(cookiesToSet) {
					cookiesToSet.forEach(({ name, value }) =>
						request.cookies.set(name, value),
					);
					supabaseResponse = NextResponse.next({ request });
					cookiesToSet.forEach(({ name, value, options }) =>
						supabaseResponse.cookies.set(name, value, options),
					);
				},
			},
		},
	);

	const {
		data: { user },
	} = await supabase.auth.getUser();
	const pathname = request.nextUrl.pathname;
	const search = request.nextUrl.search; // termasuk "?shift=Pagi" dll kalau ada

	const isPublic = pathname.startsWith("/login");

	// Belum login → ke halaman login, BAWA path asli sebagai ?next=
	if (!user && !isPublic) {
		const loginUrl = new URL("/login", request.url);
		loginUrl.searchParams.set("next", pathname + search);
		return NextResponse.redirect(loginUrl);
	}

	// Sudah login tapi buka /login → pakai ?next= kalau ada, kalau tidak baru fallback ke role map
	if (user && pathname === "/login") {
		const nextParam = request.nextUrl.searchParams.get("next");
		const safeNext =
			nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")
				? nextParam
				: null;

		if (safeNext) {
			return NextResponse.redirect(new URL(safeNext, request.url));
		}

		const { data: profile } = await supabase
			.from("profiles")
			.select("role")
			.eq("id", user.id)
			.single();

		const map = {
			operator: "/requests",
			supervisor: "/dashboard",
			technician: "/technician",
			admin: "/dashboard",
		};
		return NextResponse.redirect(
			new URL(map[profile?.role] || "/dashboard", request.url),
		);
	}

	return supabaseResponse;
}

export const config = {
	matcher: [
		"/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
	],
};
