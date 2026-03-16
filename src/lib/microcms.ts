// ============================================
// microCMS クライアント設定ファイル
// ============================================
// このファイルでは、microCMS の JavaScript SDK を使って
// API からデータを取得するための設定を行います。
//
// 【このファイルの役割】
// 1. microCMS クライアントの初期化（API接続の準備）
// 2. ブログ記事の型定義（TypeScript でデータの形を定義）
// 3. データ取得関数（記事一覧・個別記事を取得する関数）
// ============================================

// microCMS の公式 JavaScript SDK をインポート
// createClient: APIクライアントを作成する関数
// MicroCMSImage: 画像フィールドの型定義
// MicroCMSListResponse: 一覧取得時のレスポンス型
import { createClient } from "microcms-js-sdk";
import type { MicroCMSImage, MicroCMSListResponse } from "microcms-js-sdk";

// ============================================
// ブログ記事の型定義（TypeScript）
// ============================================
// microCMS で作成したAPIスキーマに合わせて、
// 記事データの「形」を TypeScript の型として定義します。
// これにより、コード内で記事データを扱う際に
// プロパティ名の補完やエラーチェックが効きます。
export type Blog = {
  id: string;           // microCMS が自動生成する一意のID
  createdAt: string;    // 作成日時（microCMS自動生成）
  updatedAt: string;    // 更新日時（microCMS自動生成）
  publishedAt: string;  // 公開日時（microCMS自動生成）
  revisedAt: string;    // 改訂日時（microCMS自動生成）
  coverimage?: MicroCMSImage;  // カバー画像（任意フィールド）
  slug: string;         // 記事のスラッグ（URLに使う固有文字列）
  title: string;        // 記事タイトル
  description: string;  // 記事の説明文（一覧ページで表示）
  date: string;         // 投稿日付
  tag: string[] | string;  // 投稿タグ（microCMSの設定により配列 or 文字列）
  content: string;      // 記事本文（HTML形式）
};

// ============================================
// microCMS クライアントの初期化
// ============================================
// createClient() に「サービスドメイン」と「APIキー」を渡して
// API と通信するためのクライアントオブジェクトを作成します。
//
// import.meta.env は Astro（Vite）が提供する環境変数へのアクセス方法です。
// .env ファイルに書いた値がここで読み込まれます。
//
// ⚠ 環境変数が未設定の場合はエラーになるので、
//   空文字をフォールバック値として設定しています。
const client = createClient({
  serviceDomain: import.meta.env.MICROCMS_SERVICE_DOMAIN || "",
  apiKey: import.meta.env.MICROCMS_API_KEY || "",
});

// ============================================
// ブログ記事一覧を取得する関数
// ============================================
// microCMS の「blogs」エンドポイントから記事一覧を取得します。
//
// 【引数】
// - queries: 取得条件（件数制限、並び順など）を指定するオブジェクト
//   例: { limit: 10, orders: '-date' }
//
// 【戻り値】
// - MicroCMSListResponse<Blog>: 記事の配列と総件数を含むオブジェクト
//   { contents: Blog[], totalCount: number, offset: number, limit: number }
export const getBlogs = async (queries?: {
  limit?: number;
  offset?: number;
  orders?: string;
  filters?: string;
}) => {
  // client.getList() で一覧データを取得
  // endpoint: microCMS のAPI名（管理画面で設定した「エンドポイント」）
  // queries: 取得条件
  return await client.getList<Blog>({
    endpoint: "blogs",
    queries,
  });
};

// ============================================
// 個別のブログ記事を取得する関数
// ============================================
// 指定したコンテンツIDの記事を1件取得します。
//
// 【引数】
// - contentId: 取得したい記事のID（microCMSが自動生成するID）
//
// 【戻り値】
// - Blog: 記事データ1件
export const getBlogDetail = async (contentId: string) => {
  // client.getListDetail() で個別データを取得
  return await client.getListDetail<Blog>({
    endpoint: "blogs",
    contentId,
  });
};

// ============================================
// スラッグ（slug）で記事を検索する関数
// ============================================
// URLに使う「slug」フィールドの値で記事を検索します。
// 動的ルーティング [slug].astro で使用します。
//
// 【引数】
// - slug: 検索したいスラッグ文字列
//
// 【戻り値】
// - Blog | undefined: 見つかった記事 or undefined
export const getBlogBySlug = async (slug: string) => {
  // filters を使って slug フィールドで絞り込み
  // filters の書式: "フィールドID[演算子]値"
  // [equals] は完全一致検索
  const response = await client.getList<Blog>({
    endpoint: "blogs",
    queries: {
      filters: `slug[equals]${slug}`,
    },
  });
  // 検索結果の最初の1件を返す（見つからなければ undefined）
  return response.contents[0];
};
