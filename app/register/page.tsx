import FullScreenLoader from "@/components/FullScreenLoader";
import RegisterScreen from "@/screens/RegisterScreen";
import { Suspense } from "react";

export default function RegisterPage() {
  return (
    <Suspense fallback={<FullScreenLoader />}>
      <RegisterScreen />
    </Suspense>
  );
}
