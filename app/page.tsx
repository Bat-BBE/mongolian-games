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
// "use client";

// import GameScene from "@/components/game/gamescene";

// export default function Page() {
//   return (
//     <main style={{ width: "100vw", height: "100vh" }}>
//       <GameScene />
//     </main>
//   );
// }