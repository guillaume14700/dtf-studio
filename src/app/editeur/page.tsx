"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const StudioEditor = dynamic(() => import("@/components/editor"), {
  ssr: false,
  loading: () => <div className="h-[70vh] flex items-center justify-center text-slate-400 font-display uppercase tracking-widest animate-pulse">Chargement de l'éditeur…</div>,
});

export default function EditeurPage() {
  return (
    <Suspense fallback={<div className="h-[70vh] flex items-center justify-center text-slate-400 animate-pulse">Chargement…</div>}>
      <EditeurInner />
    </Suspense>
  );
}

function EditeurInner() {
  const params = useSearchParams();
  return <StudioEditor initialId={params.get("id")} aiIncoming={params.get("ai") === "1"} />;
}
