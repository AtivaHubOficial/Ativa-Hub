import { createServerClient, type SetAllCookies } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function protectAdminRoute(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const path = request.nextUrl.pathname;
  const isLogin = path === "/admin/login";
  const isDenied = path === "/admin/acesso-negado";

  if (!url || !key) {
    if (isLogin) return NextResponse.next({ request });
    const target = request.nextUrl.clone(); target.pathname = "/admin/login"; target.search = "";
    target.searchParams.set("erro", "configuracao");
    return NextResponse.redirect(target);
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (items: Parameters<SetAllCookies>[0]) => {
        items.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        items.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    if (isLogin) return response;
    const target = request.nextUrl.clone(); target.pathname = "/admin/login"; target.search = "";
    if (!isDenied) target.searchParams.set("proximo", path);
    return NextResponse.redirect(target);
  }

  const { data: admin } = await supabase.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!admin) {
    if (isDenied) return response;
    const target = request.nextUrl.clone(); target.pathname = "/admin/acesso-negado"; target.search = "";
    return NextResponse.redirect(target);
  }

  if (isLogin || isDenied) {
    const target = request.nextUrl.clone(); target.pathname = "/admin"; target.search = "";
    return NextResponse.redirect(target);
  }
  return response;
}
