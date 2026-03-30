"use client";

import { useState, FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { BackToHomeButton } from "@/components/BackToHomeButton";

// ── 型定義 ──────────────────────────────────────────
type BaseFormData = {
  department: string;
  name: string;
};

// 品目1セットの型
type ItemRow = {
  id: number; // 各行を識別するためのユニークID
  itemCode: string; // 品目コード
  lotNo: string; // ロットNO
  expiryDate: string; // 保管期限
};

type BaseErrors = {
  department?: string;
  name?: string;
};

// 品目行のエラー型（行番号をキーにしたオブジェクト）
// 例: { 0: { itemCode: 'エラー' }, 2: { lotNo: 'エラー' } }
type ItemErrors = Record<number, Partial<Record<keyof Omit<ItemRow, "id">, string>>>;

type Status = "idle" | "loading" | "done";

// ── 初期の品目行（1行から始める） ────────────────────
const createEmptyRow = (): ItemRow => ({
  id: Date.now() + Math.random(), // ユニークIDとしてタイムスタンプ+乱数を使う
  itemCode: "",
  lotNo: "",
  expiryDate: "",
});

// ── バリデーション ────────────────────────────────────
function validate(base: BaseFormData, items: ItemRow[]): { baseErrors: BaseErrors; itemErrors: ItemErrors; valid: boolean } {
  const baseErrors: BaseErrors = {};
  const itemErrors: ItemErrors = {};

  if (!base.department.trim()) baseErrors.department = "部署を入力してください";
  if (!base.name.trim()) baseErrors.name = "名前を入力してください";

  items.forEach((item, index) => {
    const rowErrors: ItemErrors[number] = {};
    if (!item.itemCode.trim()) rowErrors.itemCode = "品目コードを入力してください";
    if (!item.lotNo.trim()) rowErrors.lotNo = "ロットNOを入力してください";
    if (!item.expiryDate.trim()) rowErrors.expiryDate = "保管期限を入力してください";
    if (Object.keys(rowErrors).length > 0) itemErrors[index] = rowErrors;
  });

  const valid = Object.keys(baseErrors).length === 0 && Object.keys(itemErrors).length === 0;
  return { baseErrors, itemErrors, valid };
}

export default function StorageExtensionPage() {
  const [base, setBase] = useState<BaseFormData>({ department: "", name: "" });
  const [items, setItems] = useState<ItemRow[]>([createEmptyRow()]);
  const [baseErrors, setBaseErrors] = useState<BaseErrors>({});
  const [itemErrors, setItemErrors] = useState<ItemErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const router = useRouter();

  // 入力があるかどうか（戻るボタンの確認ポップアップ用）
  const hasInput = Object.values(base).some((v) => v !== "") || items.some((item) => item.itemCode || item.lotNo || item.expiryDate);

  // ── 基本情報の変更 ────────────────────────────────
  const handleBaseChange = (e: ChangeEvent<HTMLInputElement>) => {
    setBase((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // ── 品目行の変更 ──────────────────────────────────
  // index = 何行目か、field = どのフィールドか
  const handleItemChange = (index: number, field: keyof Omit<ItemRow, "id">, value: string) => {
    setItems(
      (prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
      // 変更された行だけ更新して、他の行はそのまま返す
    );
  };

  // ── 品目行を追加 ──────────────────────────────────
  const addRow = () => setItems((prev) => [...prev, createEmptyRow()]);

  // ── 品目行を削除 ──────────────────────────────────
  const removeRow = (index: number) => {
    if (items.length === 1) return; // 最低1行は残す
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // ── フォーム送信 ──────────────────────────────────
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { baseErrors: bErr, itemErrors: iErr, valid } = validate(base, items);
    setBaseErrors(bErr);
    setItemErrors(iErr);

    if (!valid) {
      // 最初のエラー項目にスクロール
      setTimeout(() => {
        const firstBase = Object.keys(bErr)[0];
        const el = firstBase ? document.getElementById(`field-${firstBase}`) : document.getElementById(`field-item-0`);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
        el?.focus();
      }, 0);
      return;
    }

    setStatus("loading");
    try {
      const res = await fetch("/api/storage-extension", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // items配列をJSONで送る（FormDataだと配列が送りにくいため）
        body: JSON.stringify({ ...base, items }),
      });
      const json = await res.json();
      if (json.status === "ok") setStatus("done");
      else {
        setBaseErrors({ name: json.message });
        setStatus("idle");
      }
    } catch {
      setBaseErrors({ name: "通信エラーが発生しました" });
      setStatus("idle");
    }
  };

  // ── 送信完了画面 ──────────────────────────────────
  if (status === "done") {
    return (
      <main className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-10 text-center max-w-sm w-full">
          <div className="w-14 h-14 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📦</span>
          </div>
          <h2 className="text-white font-bold text-lg mb-2">申請を受け付けました</h2>
          <p className="text-slate-400 text-sm mb-8">担当者より折り返しご連絡します。</p>
          <button
            onClick={() => router.push("/")}
            className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400
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
      <div className="w-full max-w-2xl">
        {/* 戻るボタン */}
        <div className="mb-6">
          <BackToHomeButton hasInput={hasInput} />
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8">
          {/* ヘッダー */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
              <span className="text-xl">📦</span>
            </div>
            <div>
              <h1 className="text-white font-bold text-xl">保管期限延長</h1>
              <p className="text-slate-400 text-xs mt-0.5">申請内容を入力してください</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* ── 部署・名前 横並び ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div id="field-department" tabIndex={-1} className="scroll-mt-6">
                <label className={labelClass}>
                  部署 <span className="text-rose-400">*</span>
                </label>
                <input type="text" name="department" value={base.department} onChange={handleBaseChange} placeholder="例：包装課" className={inputClass} />
                {baseErrors.department && <p className={errClass}>{baseErrors.department}</p>}
              </div>
              <div id="field-name" tabIndex={-1} className="scroll-mt-6">
                <label className={labelClass}>
                  名前 <span className="text-rose-400">*</span>
                </label>
                <input type="text" name="name" value={base.name} onChange={handleBaseChange} placeholder="山田 太郎" className={inputClass} />
                {baseErrors.name && <p className={errClass}>{baseErrors.name}</p>}
              </div>
            </div>

            {/* ── 区切り線 ── */}
            <hr className="border-slate-700" />

            {/* ── 品目リスト ── */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className={labelClass}>
                  品目情報 <span className="text-rose-400">*</span>
                  <span className="text-slate-500 normal-case font-normal ml-2">（{items.length}件）</span>
                </label>
              </div>

              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={item.id} id={`field-item-${index}`} tabIndex={-1} className="bg-slate-750 border border-slate-600 rounded-xl p-4 scroll-mt-6" style={{ backgroundColor: "rgb(30 41 59)" }}>
                    {/* 行ヘッダー */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">品目 {index + 1}</span>
                      {/* 削除ボタン（1行のときは非表示） */}
                      {items.length > 1 && (
                        <button type="button" onClick={() => removeRow(index)} className="text-slate-500 hover:text-rose-400 text-xs transition-colors">
                          ✕ 削除
                        </button>
                      )}
                    </div>

                    {/* 3カラム入力 */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className={labelClass}>品目コード</label>
                        <input type="text" value={item.itemCode} onChange={(e) => handleItemChange(index, "itemCode", e.target.value)} className={`${inputClass} font-mono`} />
                        {itemErrors[index]?.itemCode && <p className={errClass}>{itemErrors[index].itemCode}</p>}
                      </div>
                      <div>
                        <label className={labelClass}>ロットNO</label>
                        <input type="text" value={item.lotNo} onChange={(e) => handleItemChange(index, "lotNo", e.target.value)} className={`${inputClass} font-mono`} />
                        {itemErrors[index]?.lotNo && <p className={errClass}>{itemErrors[index].lotNo}</p>}
                      </div>
                      <div>
                        <label className={labelClass}>保管期限</label>
                        <input type="date" value={item.expiryDate} onChange={(e) => handleItemChange(index, "expiryDate", e.target.value)} className={inputClass} />
                        {itemErrors[index]?.expiryDate && <p className={errClass}>{itemErrors[index].expiryDate}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 品目追加ボタン */}
              <button
                type="button"
                onClick={addRow}
                className="mt-3 w-full py-2.5 rounded-xl border border-dashed border-slate-600
                  text-slate-400 hover:text-emerald-400 hover:border-emerald-500
                  text-sm font-medium transition-all"
              >
                ＋ 品目を追加
              </button>
            </div>

            {/* 送信ボタン */}
            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400
                text-white font-bold text-sm transition-all active:scale-95
                disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {status === "loading" ? "送信中..." : `申請する（${items.length}件） →`}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

const inputClass = `
  w-full px-3 py-2.5 rounded-xl bg-slate-700 border border-slate-600
  text-white placeholder-slate-500 text-sm
  focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition
`;
const labelClass = "block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5";
const errClass = "text-rose-400 text-xs mt-1";
