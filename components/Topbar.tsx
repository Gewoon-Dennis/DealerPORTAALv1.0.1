"use client";

import { btn } from "./ui";
import { signOut } from "next-auth/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function Topbar() {
  const router = useRouter();
  const { data } = useSession();
  const role = (data?.user as any)?.role;

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        width: "100%",
        background: "#fff",
        borderBottom: "1px solid #e5e5e5",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "10px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Image src="/logo.png" alt="AutoAgent" width={32} height={32} />
          <span style={{ fontWeight: 600, color: "#00C7B7" }}>
            Dealer Portaal
          </span>
          {role === "admin" && (
            <span
              style={{
                marginLeft: 8,
                padding: "4px 8px",
                background: "#1A1A1A",
                color: "#fff",
                borderRadius: 8,
                fontSize: 12,
              }}
            >
              Beheer
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {role === "admin" && (
            <button
              onClick={() => router.push("/admin")}
              style={btn({ kind: "secondary" })}
            >
              Beheer
            </button>
          )}
          <button
            onClick={() => router.push("/dashboard")}
            style={btn({ kind: "primary" })}
          >
            Dashboard
          </button>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            style={btn({ kind: "ghost" })}
          >
            Uitloggen
          </button>
        </div>
      </div>
    </div>
  );
}
