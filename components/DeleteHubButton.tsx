"use client";
import React from "react";

export default function DeleteHubButton({ onDelete }: { onDelete: () => void }) {
  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    if (!confirm("Delete this hub? The QR code will stop working. This cannot be undone.")) {
      e.preventDefault();
      return;
    }
    onDelete();
  }

  return (
    <button
      type="submit"
      className="text-sm text-red-500 hover:text-red-700 transition-colors"
      onClick={handleClick}
    >
      Delete hub
    </button>
  );
}
