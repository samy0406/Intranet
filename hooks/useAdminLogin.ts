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
        router.push("/admin/inquiries");
      } else {
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
