"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const RipStudio = dynamic(() => import("@/components/rip"), {
  ssr: false,
  loading: () => <div className="h-[70vh] flex items-center justify-center text-gray-500 font-display uppercase tracking-widest animate-pulse">Chargement du RIP…</div>,
});

export default function RipPage() {
  return (
    <Suspense fallback={<div className="h-[70vh] flex items-center justify-center text-gray-500 animate-pulse">Chargement…</div>}>
      <RipInner />
    </Suspense>
  );
}

function RipInner() {
  const params = useSearchParams();
  return <RipStudio initialId={params.get("id")} />;
}
