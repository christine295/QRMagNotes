"use client";
import React, { useTransition } from "react";

export default function DeleteHubForm({ hubId, onDelete }: { hubId: string, onDelete?: () => void }) {
  const [isPending, startTransition] = useTransition();

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault();
    if (!confirm("Delete this hub? The QR code will stop working. This cannot be undone.")) return;
    startTransition(async () => {
      await fetch(`/api/hub/${hubId}`, { method: "POST" });
      if (onDelete) onDelete();
      window.location.href = "/dashboard";
    });
  }

  return (
    <form onSubmit={handleDelete}>
      <button
        type="submit"
        className="text-sm text-red-500 hover:text-red-700 transition-colors"
        disabled={isPending}
      >
        {isPending ? "Deleting..." : "Delete hub"}
      </button>
    </form>
  );
}
