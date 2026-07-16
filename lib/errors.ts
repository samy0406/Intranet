// ユーザーにそのまま見せてよい「業務エラー」を表すクラス
export class BusinessError extends Error {
  status: number;

  constructor(message: string, status: number = 400) {
    super(message); // 親クラス Error に message を渡す
    this.name = "BusinessError";
    this.status = status; // HTTPステータスも一緒に持たせる
  }
}
