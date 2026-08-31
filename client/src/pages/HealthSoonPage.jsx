import { Link, useParams } from "react-router-dom";

const copy = {
  food: "Meals and food notes come after sugar.",
};

export default function HealthSoonPage() {
  const { item } = useParams();
  return (
    <div className="page-pad">
      <p className="text-[12px] tracking-[0.18em] text-muted uppercase">
        My Health
      </p>
      <h2 className="mt-2 text-2xl font-semibold break-words capitalize sm:text-3xl">{item}</h2>
      <p className="mt-2 max-w-xl text-sm text-muted">
        {copy[item] || "This part of health is not open yet."}
      </p>
      <Link
        to="/health/sugar"
        className="mt-6 inline-flex rounded-xl border border-coral/40 bg-coral/12 px-4 py-2 text-sm text-coral"
      >
        Go to Sugar
      </Link>
    </div>
  );
}
