import FullScreenLoader from "@/components/FullScreenLoader";
import HomeScreen from "@/screens/HomeScreen";
import { Suspense } from "react";

export default function HomePage() {
  return (
    <Suspense fallback={<FullScreenLoader />}>
      <HomeScreen />
    </Suspense>
  );
}
