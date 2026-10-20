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

## MAISON ARDEA / 360°トートバッグ試作

`public/maison-ardea.html` は HTML / CSS / JavaScript・Three.js・商品画像をすべて含む単一ファイルです。CDN・外部API・外部フォントにはアクセスしません。静的HTTPホストへ置くことで利用できます。既存の写真商品エディタとは別ページです。

- 商品詳細、6枚のギャラリー、全画面編集、3サイズ、4色、6パッチ、英字3文字、2色ライン。
- 簡易モデルは独自の台形バッグ・持ち手・金具・幾何学模様で生成。実物のGLBデータは使用していません。
- Three.js / OrbitControlsは編集画面を開いてから初期化。単一ファイルのためJSと画像のバイト列は最初のHTMLに含まれます。
- 横360°、仰角−10〜60°、0.8〜2.5倍、平行移動なし。正面・側面・背面・内側の切り替えは0.6秒。通常は最初に12秒かけて一回転し、操作開始で停止。動きを減らす設定では自動回転・慣性・視点アニメーションを停止します。
- WebGL不可時は生成済みの36枚の画像で横360°表示。**この代替表示では上下視点と装飾のプレビュー反映はありません**。選択内容・価格・保存は利用できます。
- AR用の実物GLB・USDZがないため、ARボタンは非表示。`tools/ardea/template.html` の `assets` に実物モデルを設定する際はiOS / Android実機で別途検証が必要です。簡易モデルからのARデータ生成は未対応。
- 決定内容・お気に入りはlocalStorageに保存。カート・相談・電話案内は体験用で、実際の注文・決済・送信・電話接続は行いません。
- メインのCSS変数で色・フォント・線・角丸などを差し替えられます。

### 生成・テスト

```sh
npm ci
npx playwright install chromium
npm run build:ardea
npm run test:ardea
```

既存のChromiumを使う場合は `CHROMIUM_PATH=/usr/bin/chromium` を各コマンドの前に付けてください。
`tools/ardea/viewer.js` と `tools/ardea/template.html` が編集用ソースです。生成にはローカルChromiumのWebGLが必要です。生成済みHTMLはコミットされているため、GitHub Actionsでの通常公開時にChromiumをインストールする必要はありません。
Three.jsのMITライセンスは生成済みHTMLに同梱しています。

GitHub Pagesの公開後は `/personalize-ec/maison-ardea.html` で確認できます。
