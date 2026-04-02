"use client";

import { useState, FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { BackToHomeButton } from "@/components/BackToHomeButton";

type FormData = {
  department: string;
  name: string;
  mail: string;
  accountCode: string;
};

type Status = "idle" | "loading" | "done";

type Errors = {
  department?: string;
  name?: string;
  mail?: string;
  accountCode?: string;
};

function validate(form: FormData): Errors {
  const errors: Errors = {};
  if (!form.department.trim()) errors.department = "部署を入力してください";
  if (!form.name.trim()) errors.name = "名前を入力してください";
  if (!form.mail.trim()) {
    errors.mail = "メールアドレスを入力してください";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.mail)) {
    errors.mail = "正しい形式で入力してください";
  }
  if (!form.accountCode.trim()) errors.accountCode = "アカウントコードを入力してください";
  return errors;
}

export default function AccountUnlockPage() {
  const [form, setForm] = useState<FormData>({ department: "", name: "", mail: "", accountCode: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>("idle");
  const router = useRouter();

  const hasInput = Object.values(form).some((v) => v !== "");

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newErrors = validate(form);
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      const fieldOrder = ["department", "name", "mail", "accountCode"] as const;
      const first = fieldOrder.find((k) => newErrors[k]);
      if (first) {
        setTimeout(() => {
          const el = document.getElementById(`field-${first}`);
          el?.scrollIntoView({ behavior: "smooth", block: "center" });
          el?.focus();
        }, 0);
      }
      return;
    }

    setStatus("loading");
    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => data.append(k, v));
      const res = await fetch("/api/account-unlock", { method: "POST", body: data });
      const json = await res.json();
      if (json.status === "ok") setStatus("done");
      else {
        setErrors({ accountCode: json.message });
        setStatus("idle");
      }
    } catch {
      setErrors({ accountCode: "通信エラーが発生しました" });
      setStatus("idle");
    }
  };

  // 送信完了画面
  if (status === "done") {
    return (
      <main className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-10 text-center max-w-sm w-full">
          <div className="w-14 h-14 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔓</span>
          </div>
          <h2 className="text-white font-bold text-lg mb-2">申請を受け付けました</h2>
          <p className="text-slate-400 text-sm mb-8">担当者より折り返しご連絡します。</p>
          <button
            onClick={() => router.push("/")}
            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400
              text-white font-semibold text-sm transition-all active:scale-95"
          >
            ホームに戻る
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 戻るボタン */}
        <div className="mb-6">
          <BackToHomeButton hasInput={hasInput} />
        </div>

        {/* カード */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8">
          {/* ヘッダー */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
              <span className="text-xl">🔓</span>
            </div>
            <div>
              <h1 className="text-white font-bold text-xl leading-tight">アカウントロック解除</h1>
              <p className="text-slate-400 text-xs mt-0.5">申請内容を入力してください</p>
            </div>
          </div>

          {/* フォーム */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 部署 */}
            <div id="field-department" tabIndex={-1} className="scroll-mt-6">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                部署 <span className="text-rose-400">*</span>
              </label>
              <input type="text" name="department" value={form.department} onChange={handleChange} placeholder="例：包装課" className={inputClass} />
              {errors.department && <p className="text-rose-400 text-xs mt-1">⚠ {errors.department}</p>}
            </div>

            {/* 名前 */}
            <div id="field-name" tabIndex={-1} className="scroll-mt-6">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                名前 <span className="text-rose-400">*</span>
              </label>
              <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="例：山田 太郎" className={inputClass} />
              {errors.name && <p className="text-rose-400 text-xs mt-1">⚠ {errors.name}</p>}
            </div>

            {/* メールアドレス */}
            <div id="field-mail" tabIndex={-1} className="scroll-mt-6">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                メールアドレス <span className="text-rose-400">*</span>
              </label>
              <input type="email" name="mail" value={form.mail} onChange={handleChange} placeholder="例：taro_yamada@hoyu.co.jp" className={inputClass} />
              {errors.mail && <p className="text-rose-400 text-xs mt-1">⚠ {errors.mail}</p>}
            </div>

            {/* アカウントコード */}
            <div id="field-accountCode" tabIndex={-1} className="scroll-mt-6">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                アカウントコード <span className="text-rose-400">*</span>
              </label>
              <input type="text" name="accountCode" value={form.accountCode} onChange={handleChange} placeholder="例：SET12" className={`${inputClass} font-mono tracking-wider`} />
              {errors.accountCode && <p className="text-rose-400 text-xs mt-1">⚠ {errors.accountCode}</p>}
            </div>

            {/* 送信ボタン */}
            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400
                text-white font-bold text-sm transition-all active:scale-95
                disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {status === "loading" ? "送信中..." : "申請する →"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

const inputClass = `
  w-full px-4 py-2.5 rounded-xl bg-slate-700 border border-slate-600
  text-white placeholder-slate-500 text-sm
  focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition
`;
