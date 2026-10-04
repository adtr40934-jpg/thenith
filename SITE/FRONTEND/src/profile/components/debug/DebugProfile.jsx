import React from "react";
import { usePortfolio } from "../../lib/PortfolioContext.jsx";

export default function DebugProfile() {
  const { profile, isLoading, isError, error } = usePortfolio();

  if (isLoading) return <div>Loading profile...</div>;
  if (isError) return <div style={{ color: "red" }}>Error: {error}</div>;
  if (!profile) return <div>No profile data.</div>;

  return (
    <pre style={{ background: "#f0f0f0", padding: "1rem", overflow: "auto" }}>
      {JSON.stringify(profile, null, 2)}
    </pre>
  );
}
