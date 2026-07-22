"use client";

import React from "react";
import { Toaster } from "react-hot-toast";

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        gutter={12}
        toastOptions={{
          duration: 4000,
          style: {
            background: "#1a1a1a",
            color: "#e2e8f0",
            border: "1px solid rgba(51, 51, 51, 0.5)",
            borderRadius: "0.75rem",
            fontSize: "0.875rem",
            padding: "12px 16px",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)",
          },
          success: {
            iconTheme: {
              primary: "#22c55e",
              secondary: "#1a1a1a",
            },
          },
          error: {
            iconTheme: {
              primary: "#ef4444",
              secondary: "#1a1a1a",
            },
          },
          loading: {
            iconTheme: {
              primary: "#14B8A6",
              secondary: "#1a1a1a",
            },
          },
        }}
      />
    </>
  );
}
