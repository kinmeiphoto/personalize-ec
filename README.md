# Kinmei — Wedding Album Atelier

Blenderで制作したアルバムを使う、Vue / Nuxt製の3Dカスタマイズアプリです。
フッター表記は `© kinmei. All Rights Reserved.` です。

## 起動

Node.js 24.15以上を推奨します。開発環境の24.14.1でも生成を確認しています。

```sh
npm ci
npm run dev
```

開発用URLは http://127.0.0.1:3100/ です。

```sh
npm run build
```

Nuxtが商品ページをHTMLに事前生成し、`.output/public` に静的配信データを書き出します。3D部分はクライアントで読み込みます。

## 実装済み

- Blender由来の開いた本・閉じた本のGLB表示、回転、ズーム、自動回転、拡大編集
- 表紙6色と任意色、本文紙3色、表紙写真枠3色
- 20cm / 30cmのサイズ選択と参考価格の更新
- 表紙・見開き左右の写真アップロード、中央クロップ、位置・倍率調整
- 最大10MBのJPG / PNG / WebP。長辺1600pxに縮小しブラウザー内で処理
- 表紙への名入れ、日本語・英数字12文字、箔3色、参考価格の加算
- プレビューPNGとデザイン仕様JSONのダウンロード
- ブラウザー内へのデザイン保存と再読み込み、お気に入り、ローカルのご相談リスト
- 商品仕様アコーディオン、Swiperのカラーギャラリー、相談メモのローカル保存
- よくある質問に答えるローカルガイド。外部AIとの接続はありません
- PWAマニフェストとService Worker、初回取得後の静的アセットのキャッシュ
- Product構造化データ。販売していないため、架空の在庫やOfferは記載していません

## 技術スタックと本番接続

- Nuxt 4 / Vue 3 / Three.js / Swiper / core-js 3.32.2
- `@vite-pwa/nuxt` でPWAを実装
- Boomerangのコードは `public/vendor/boomerang.js` に同梱
- `NUXT_PUBLIC_BOOMERANG_BEACON_URL` 設定時のみ計測コードを起動します
- `NUXT_PUBLIC_GTM_ID` にGTM IDを設定した場合のみタグを読み込みます
- `view_item` / `add_to_cart` / カスタマイズ等のイベントをローカルのdataLayerに記録します
- 静的生成なので上記公開設定を変更した後は再ビルドが必要です
- Akamai Bot ManagerはAkamai契約・管理対象ドメイン・エッジ側の設定が必要です。このソースだけでは有効化されません
- 決済、受注、実店舗在庫、実予約、電話注文、外部チャット、ARは含みません。画面でも未接続を明示しています

## データと写真

写真はサーバーに送信しません。明示的な保存時にlocalStorageに保存します。PWAのアセットキャッシュにユーザーの写真は追加しません。
保存容量が足りない場合は通知します。共用端末ではフッターのプライバシー画面から保存データを削除できます。
JSON仕様書は端末間移動用の書き出しです。このバージョンではJSONの再インポートには対応していません。
初期写真はimage_genで制作した架空の婚礼サンプルです。実際の利用時はカップルの高解像度写真に差し替えてください。

## 主要ファイル

- `app/app.vue`：商品ページ、編集UI、保存・ご相談リスト・相談メモ
- `app/components/AlbumViewer.client.vue`：WebGL、glTF、色・画像・名入れ反映
- `app/composables/useAlbum.js`：デザインの初期値、価格、カラーパレット
- `app/assets/css/main.css`：レスポンシブレイアウト
- `public/models/`：Blenderモデル由来のGLB
- `nuxt.config.ts`：SSGとPWAの設定

価格、寸法、素材、納期、ブランド名は提案用の設定です。本番化する際は確定情報に更新してください。

## 確認

Nuxtの静的生成が成功しています。ブラウザーでGLB表示、色変更、見開き切替、名入れ、価格加算、デザイン保存と再読み込みを確認しています。今回の更新では、回転前後の編集アイコン位置の変化、ポップアップからの色変更、写真トリミング、390px幅の編集パネル、1440px幅のレイアウト、ご相談リストへの追加と削除、ご相談メモ画面への遷移も確認しました。
ブラウザー自動化ツールのファイル選択処理が停止するため、写真アップロードの自動テストは完了していません。

参考にした公式資料：
- https://nuxt.com/docs/4.x/getting-started/deployment
- https://threejs.org/docs/pages/GLTFLoader.html
- https://swiperjs.com/vue
- https://vite-pwa-org.netlify.app/frameworks/nuxt


## 婚礼向けの更新

提供されたKinmeiロゴをヘッダーとフッターに配置。明朝体・白・墨色・控えめな金茶を使い、カップルが式場で一緒に選ぶ画面に更新しています。

3D画面にマウスを重ねると、表紙、写真、本文紙、写真枠、名入れの変更アイコンを表示します。アイコンはモデルの回転・拡大とサイズ変更に追従し、裏側や隠れた部位は表示しません。クリックすると部位専用のメニューが開きます。閉じるボタン、完了、Escape、外側クリックで閉じます。タッチ端末は常時アイコン表示と画面下の編集パネルに対応しています。

表紙・本文紙の色変更、左写真のトリミング、見開き切替、スマートフォン幅のポップアップをブラウザーで確認しています。写真ファイル選択の自動化に関する制約は前述のとおりです。

### サンプル写真の制作記録

built-in image_genを使用。保存先は `public/photos/wedding-couple.webp` と `public/photos/wedding-detail.webp`。実在のカップルの写真ではありません。

最終プロンプト（人物）：
Use case: photorealistic-natural. Asset type: sample wedding photograph used INSIDE a 3D wedding album customizer for Japanese wedding venues. Generate a single landscape 4:3 editorial wedding photograph, not a mockup or album. A fictional adult Japanese couple in their late twenties, bride in an elegant ivory silk wedding gown with minimal veil and groom in refined black formal suit, standing close together in a serene Japanese garden outside an understated modern wedding venue. They are looking at each other with small natural smiles, tender and dignified, not posed exuberantly. Couple centrally framed from waist up, sufficient space around heads so it crops to portrait too. Soft overcast natural light, natural skin texture, muted greens and whites, subtle fine film grain, restrained contrast, high-end Japanese wedding photography. Natural realistic hands. No text, no logos, no watermark. This is a fictional sample couple, no real identities.

最終プロンプト（ディテール）：
Use case: photorealistic-natural. Asset type: sample detail photograph inside a Japanese wedding album customizer. One landscape 4:3 fine-art editorial wedding detail photograph: close-up of a fictional adult bride and groom's hands gently resting together, simple polished gold wedding bands, an ivory silk bridal gown, the groom's black formal sleeve, a loose bouquet of white seasonal flowers with understated green leaves. Hands anatomically natural, 5 fingers each, relaxed touch. Soft window light, quiet and dignified Japanese wedding venue aesthetic, fine film grain, natural whites, very restrained warm tones. Crop faces entirely out of frame; focus on hands and rings, a few softly blurred flowers near one edge. A photographic scene only, no album or product mockup, no layout, no text, no logo, no watermark.


## LANDIC採用サイトを参照したデザイン改訂

ユーザー提供HTMLと公式CSSから、背景色、書体の役割、12カラムの組み方、余白、罫線、短い遷移を確認し、ウェディング用途へ組み直しました。大きな和文見出しと横長の写真から始まり、その下のナビゲーションから3D編集へ進みます。左に英語ラベル、右に本文・写真を置く編集的な構成です。

デザインのトークンと画面構成は `DESIGN_SYSTEM.md`、実装は `app/assets/css/landic-theme.css` にまとめています。Kinmeiロゴとすべての3D編集機能、保存データのキーを保持しています。参照サイトのブランド素材、写真、SVG、背景画像、有料配信フォントは含めていません。

確認：Nuxt本番ビルド成功、ローカル配信HTTP 200、静的HTMLに含まれる17件のアセット、8件のページ内リンク、H1が一つであること、IDの重複がないことを確認しました。この改訂ではブラウザー操作ツールが利用できず、実ブラウザーでの目視確認は未実施です。


## 選択画面を最初に表示する更新

最新版は3Dを全画面で見せる選択画面です。写真ヒーローと紹介セクション、常設の右カラムを外しました。右の編集欄は初期非表示で、部位アイコンか下部の項目ボタンをクリックすると開きます。マウスオーバーはアイコンの表示だけを切り替えます。開いた項目はそのまま保持し、「完了」や閉じる、Escape、外側クリックで戻れます。

画面の見た目は `selection-studio.css`、開閉状態は `useSelectionEditor.js` にまとめています。現在の仕様は `DESIGN_SYSTEM.md` を参照してください。以前のデザイン資料・記録は履歴として残しています。

6件の状態テスト：`node --test tests/selection-editor.test.mjs`

ブラウザー操作ツールが利用できないため、新しい配置の目視確認とホバーの実ブラウザー操作確認は未実施です。写真アップロードの自動検証に関する制約も前述のとおりです。

## GitHub Pages

公開先: https://kinmeiphoto.github.io/personalize-ec/

`main`への更新で `.github/workflows/deploy-pages.yml` がテスト、静的ビルド、公開を行います。GitHubのSettings → Pagesの公開元はGitHub Actionsを使用します。

ローカルで公開用ビルドを確認する場合:

```sh
NUXT_APP_BASE_URL=/personalize-ec/ npm run build
node --test tests/*.test.mjs
```

ロゴ、写真、GLB、PWAは上記サブパスに対応しています。通常の `npm run dev` は `/` で動作します。編集アイコンは3Dアルバムの表面をマウスで指している間だけ表示され、背景や画面の外へ移ると隠れます。タッチ操作やキーボード操作では下部の項目ボタンから編集できます。
