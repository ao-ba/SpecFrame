# 📸 SpecFrame (スペックフレーム)

写真の **Exif メタデータ**（カメラ機種・レンズ・絞り値 F・シャッタースピード・ISO感度・焦点距離・撮影日時・撮影地）を瞬時に読み取り、**Leica風クラシック展示フレーム**、**Hasselblad風中判テクニカルフレーム**、**シネマスコープ黒帯**、**ポラロイド風**、または**画像内すりガラスバッジ**として美しく合成・出力できる Web アプリケーションです。

**GitHub Pages** で静的ホスティング可能で、**PWA (Progressive Web Apps)** として iPhone / Android / PC にインストールして完全オフラインで利用できます。

---

## ✨ 主な機能

### 1. 📷 高精度 Exif メタデータ自動解析
- **カメラ機種 & メーカー**: Sony, FUJIFILM, Leica, Hasselblad, Canon, Nikon, Apple, Lumix, Ricoh GR などのロゴやバッジを自動描画
- **レンズ型番**: `FE 35mm F1.4 GM`, `XF16-55mmF2.8 R LM WR` など
- **露出パラメータ**: F値（`f/1.4`）、シャッター速度（`1/160s`）、ISO感度（`ISO 800`）、露出補正（`±EV`）
- **焦点距離**: 実焦点距離 + 35mm判換算値の表示
- **撮影日時・作者クレジット**: 日時表示および「Photo by ...」の著作権サイン
- **手動編集モード**: 古いオールドレンズや Exif が消失した写真でも、すべての項目を自由に手動補正・入力可能

### 2. 🎨 多彩な 9 種類のデザインプリセット
| プリセット | 概要 |
| :--- | :--- |
| **クラシック展示 (Leica Look)** | 上左右に均等な余白、下部にカメラロゴ・機種名・レンズ名・撮影パラメータを上品に配置したギャラリー仕様 |
| **中判テクニカル (Hasselblad)** | スウェディッシュ・ミニマリズム。オレンジのアクセントラインと幾何学的な数値ブロックバッジ |
| **極細ミニマル (Clean)** | ヘアライン境界線と単一行のドット区切りメタデータによる洗練されたデザイン |
| **ポラロイド風 (Instant)** | 正方形〜3:2のクラシックなインスタント写真のプロポーションと手書き風フォント |
| **シネマスコープ (Cinema 2.39:1)** | 上下に映画風の黒帯（レターボックス）を配し、角にネオンブルーでパラメータを点灯 |
| **35mm ネガフィルム (Film)** | パーフォレーション（送り穴）とコマ番号「▶ 24A」、フィルム銘柄（PORTRA 400等）の刻印 |
| **画像内ガラスバッジ (Overlay Glass)** | **外枠なし（写真本来の縦横比100%維持）**。右下にフロストガラス（すりガラス）のピルバッジを配置 |
| **クリーン透かし (Overlay Clean)** | **外枠なし**。写真の隅に柔らかなドロップシャドウ付きのテキストをダイレクト描画 |
| **90s クォーツ日付 (Overlay Quartz)** | 90年代コンパクトフィルムカメラのオレンジ色に光る液晶日付＆露出スタンプ |

### 3. 🎨 写真からの自動カラーパレット抽出
- アップロードした写真の画素をリアルタイム解析し、写真に調和する主要色（トーン・アクセント色）を自動抽出
- パレットチップを1クリックするだけで、フレーム背景色やアクセントカラーを写真の雰囲気に合わせて一瞬でコーディネート可能

### 4. 💎 ネイティブ高解像度フルクオリティ書き出し
- 元画像のオリジナル解像度（2400万〜6000万画素超、4K/8K）を縮小することなく、そのままフル画質でレンダリング
- **JPEG**（品質スライダー調整可）または **PNG**（可逆圧縮・文字が鮮明）で保存可能
- **クリップボードへ直接コピー**対応（SNS投稿やチャット共有にワンクリック）

### 5. 🔒 100% プライベート & 安全（サーバー通信なし）
- すべての処理はブラウザの HTML5 Canvas & Web API 上で完結します
- 写真や位置情報データが外部サーバーへアップロードされることは一切ありません

### 6. 📱 PWA (Progressive Web Apps) 完全対応
- Service Worker によるキャッシュで、**完全オフライン**環境でも動作
- ホーム画面に追加・アプリとしてインストール可能（スマートフォン & デスクトップ）

---

## 🚀 GitHub Pages への公開手順

1. 本リポジトリを GitHub にプッシュします。
   ```bash
   git add .
   git commit -m "feat: initial release of SpecFrame PWA"
   git push origin main
   ```

2. GitHub リポジトリの **Settings** > **Pages** を開きます。
3. **Build and deployment** の Source で **Deploy from a branch** を選択します。
4. Branch に **`main`**、フォルダに **`/(root)`** を指定して **Save** をクリックします。
5. 数十秒〜1分ほどで `https://<あなたのユーザー名>.github.io/SpecFrame/` にて公開されます！

---

## 💻 ローカルでの起動方法

静的 HTML/JS/CSS で構築されているため、特別なビルド手順なしで即座に起動できます。

```bash
# Python による簡易サーバー起動 (ポート 8080)
python3 -m http.server 8080

# または npm スクリプト
npm start
```

ブラウザで `http://localhost:8080` を開きます。

---

## 🛠 技術構成

- **フロントエンド**: HTML5, Vanilla CSS3 (Custom Properties / Glassmorphism / Flexbox & Grid), Vanilla ES6+ JavaScript
- **グラフィック描画**: HTML5 Canvas 2D Context (High-DPI / Vector Typography / Crisp Subpixel Rendering)
- **Exif 解析**: [exifr](https://github.com/MikeKovarik/exifr) (vendor 同梱・オフライン対応)
- **PWA**: Web App Manifest (`manifest.webmanifest`), Service Worker (`sw.js` - Stale-While-Revalidate 戦略)
- **依存ゼロ**: ランタイムビルド不要。GitHub Pages にそのまま配置可能。

---

## 📄 ライセンス

MIT License
