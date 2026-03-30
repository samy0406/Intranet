"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

type BackHomeButtonProps = {
  hasInput?: boolean; // 入力があるかどうかを外から受け取る
};

export function BackToHomeButton({ hasInput = false }: BackHomeButtonProps) {
  const router = useRouter();

  useEffect(() => {
    // ブラウザの「戻る」ボタンが押されたときも同様の確認をする
    // 現在のページを履歴に1つ追加して「戻る」を1回吸収する
    window.history.pushState(null, "", window.location.href);

    const handlePopState = () => {
      if (hasInput) {
        const confirmLeave = window.confirm("入力中の内容が失われます。\nホームに戻りますか？");
        if (!confirmLeave) {
          // 「キャンセル」を押したら再度現在のページを履歴に追加して戻るのを防止
          window.history.pushState(null, "", window.location.href);
          return;
        }
      }
      router.push("/"); // ホームに遷移
    };

    // タブを閉じる・リロード・URL直打ち対策
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasInput) {
        // ブラウザ標準の「このページを離れますか？」を出す
        e.preventDefault();
      }
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("beforeunload", handleBeforeUnload);

    // クリーンアップ（コンポーネントが消えたときにイベントを解除する）
    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasInput, router]);
  // [hasInput, router] = この2つが変わるたびに useEffect を再実行する

  const handleClick = () => {
    // 入力がある場合だけ確認ポップアップを出す
    if (hasInput) {
      const confirmLeave = window.confirm("入力中の内容が失われます。\nホームに戻りますか？");
      if (!confirmLeave) return; // 「キャンセル」を押したら何もしない
    }
    router.push("/"); // ホームに遷移
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-2 px-5 py-3 rounded-xl
        bg-white text-slate-700
        font-semibold text-base
        shadow-sm hover:shadow-md
        transition-all active:scale-95"
    >
      <span className="text-lg">←</span>
      <span>ホームに戻る</span>
    </button>
  );
}
