// hooks/useAdminLogin.ts
"use client";

import { useState, FormEvent } from "react";

export function useAdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const body = await res.json();
        setError(body.message ?? "パスワードが違います");
        setLoading(false); // 失敗時のみボタンを戻す
        return;
      }

      // 成功時：完全リロードで遷移する
      // Router Cache を無視した素の HTTP リクエストになるため、
      // 発行したばかりの admin_session Cookie が確実にサーバーへ届く
      window.location.href = "/admin/inquiries";
      // ここで loading は true のまま維持する（画面遷移するので戻す必要がない）
    } catch {
      setError("通信エラーが発生しました");
      setLoading(false);
    }
  };

  return { password, error, loading, setPassword, handleSubmit };
}
