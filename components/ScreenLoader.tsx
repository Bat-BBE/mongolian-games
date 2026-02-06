import { Spinner } from "./ui/spinner";

export default function ScreenLoader() {
  return (
    <div className="w-full h-[90vh] flex items-center justify-center">
      <Spinner />
    </div>
  );
}
