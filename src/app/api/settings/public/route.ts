// src/app/api/settings/public/route.ts
//
// Deliberately unauthenticated — logged-out visitors browsing the menu
// still see the Navbar and (once they add items) the Cart preview, so
// this can't require an admin session the way every other settings
// route does. Returns only PublicSiteSettingsDTO's narrow field set;
// see lib/settings.ts for why the rest of SiteSettings stays out of
// this response.

import { NextResponse } from "next/server";
import { getPublicSiteSettings } from "@/lib/settings";

export async function GET() {
  try {
    const settings = await getPublicSiteSettings();
    return NextResponse.json(settings, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}