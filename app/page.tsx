import ScreenLoader from "@/components/ScreenLoader";
import LadingScreen from "@/screens/LandingScreen";
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense fallback={<ScreenLoader />}>
      <LadingScreen />
    </Suspense>
  );
}