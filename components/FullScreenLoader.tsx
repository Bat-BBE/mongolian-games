import { Spinner } from "./ui/spinner";

export default function FullScreenLoader() {
  return (
    <div className="w-full h-screen flex items-center justify-center">
      <Spinner />
    </div>
  );
}
