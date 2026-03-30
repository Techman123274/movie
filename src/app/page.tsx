import { getHomePageData } from "@/lib/tmdb";
import { LandingPage } from "@/components/landing-page";

export default async function HomePage() {
  const data = await getHomePageData();

  return <LandingPage featuredItems={data?.featuredSlides ?? []} />;
}
