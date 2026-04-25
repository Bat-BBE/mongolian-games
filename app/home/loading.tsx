import FullScreenLoader from "@/components/FullScreenLoader";

/** Shown while the /home segment loads (RSC + first paint). */
export default function HomeLoading() {
  return <FullScreenLoader />;
}
