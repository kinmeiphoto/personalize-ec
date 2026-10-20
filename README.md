# 余白 / Photo Atelier

PC向けのVue / Nuxt製写真商品カスタマイズ試作です。

```sh
npm ci
npm run dev
```

本番ビルド: `npm run build`、起動: `npm run preview`。

商品選択 → サイズ・形式 → テンプレート → 写真・文字の編集 → 仕上がり確認。
アルバム・スクラップ・カレンダー・カード・プリントに対応します。

- HTML / CSS transform / Pointer Eventsで配置を編集。
- 商品ごとの設定を遅延読み込み。
- JPEG / PNG / WebPを長辺1400px以下に縮小し端末内で処理。元写真は保存しません。
- 編集内容と縮小写真はIndexedDBに自動保存。同じブラウザ・同じオリジンで再開できます。プライベートブラウジング、サイトデータの削除、保存容量制限に注意してください。
- カレンダーの各月、アルバムの表紙・各ページ、カードの各面で写真・文字・配置を保存。色・テンプレート・向きは商品間で共通の試作設定です。
- 注文、決済、印刷データ出力、背景自動除去、スマホ最適化は対象外。
- スクラップの写真は長方形のフレーム内で切り取り。自由形状の切り抜きは未対応です。
- 同一ブラウザの複数タブ同時編集には対応しません。

サンプル写真はMDN learning-areaの教材画像です（https://github.com/mdn/learning-area/tree/main/html/multimedia-and-embedding/responsive-images）。参考HTMLのスクリプトやブランド素材は再利用していません。

## GitHub Pages

Settings → Pages → Build and deployment の Source を **GitHub Actions** に設定してください。
`main`へのpushで `.github/workflows/pages.yml` が静的サイトを生成・公開します。
静的出力のローカル検証は `NUXT_APP_BASE_URL=/personalize-ec/ npm run generate`。
サーバー処理は不要で、写真と編集内容は閲覧している端末のブラウザ内に保存されます。
公開URLは GitHub Actions の deployment 出力、または Settings → Pages で確認してください。
