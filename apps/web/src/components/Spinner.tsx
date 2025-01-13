import { BounceLoader } from "react-spinners";

export function Spinner() {
  return (
    <div className="flex items-center justify-center">
      <BounceLoader color="#16a34a" size={100} />
    </div>
  );
}
