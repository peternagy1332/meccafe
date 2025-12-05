import { createServerSupabaseClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import { routing } from "@/i18n/routing";

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const { searchParams, origin, pathname } = url;
  const code = searchParams.get("code");
  
  const pathParts = pathname.split("/").filter(Boolean);
  const locale = pathParts[0] && routing.locales.includes(pathParts[0] as typeof routing.locales[number])
    ? pathParts[0]
    : routing.defaultLocale;
  
  const next = searchParams.get("next") ?? `/${locale}/dashboard`;

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const redirectPath = next.startsWith("/") ? next : `/${locale}${next}`;
      return NextResponse.redirect(`${origin}${redirectPath}`);
    }
  }

  return NextResponse.redirect(`${origin}/${locale}?error=auth`);
}
