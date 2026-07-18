import Navbar from "@/components/layout/Navbar";
import Hero from "../components/section/Hero/Hero";
import { StoryExperience } from "@/components/story/StoryExperience";
import { Footer } from "@/components/footer/Footer";

export default function HomePage() {
  return (
    <>
      <Navbar />

      <main>
        <Hero />
      </main>
      <StoryExperience />
      <Footer />
    </>
  );
}
