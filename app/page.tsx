import ScreenLoader from "@/components/ScreenLoader";
import LandingScreen from "@/screens/LandingScreen";
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense fallback={<ScreenLoader />}>
      <LandingScreen />
    </Suspense>
  );
}
