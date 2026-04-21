import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export function useAdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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

      if (res.ok) {
        console.log("✅ ログイン成功 → push開始");
        router.refresh();
        router.push("/admin/inquiries");
        console.log("✅ push呼び出し完了");
      } else {
        const body = await res.json();
        console.log("❌ ログイン失敗 status:", res.status, body);
        setError("パスワードが違います");
      }
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setLoading(false); // 成功・失敗どちらでも必ず戻す
    }
  };

  return { password, error, loading, setPassword, handleSubmit };
}
