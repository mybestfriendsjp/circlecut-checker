# サークルカットチェッカー　サンプル

## 概要

旧申し込みサイトのサークルカット入稿ページを新サイトの環境に合わせて再構築したものになります。
プレビュー用の要素が多く、転用するべきところは一部です。

## 仕様

React用tsxで作成。必要なファイル構成は以下の通り

- src/checker.tsx checkerコンポーネント
- src/checker.css 最低限のデザインを施したCSS
- public/psd/psd-standalone.min.js PSD読み込み用ライブラリ

checker.tsx内でcssの読み込みとpsc...jsの読み込みを行っています。のでtsx内のリンクは仕様に合わせてください

## 主な機能

PNG/PSDファイルの読み込みと分析。検証が楽になるように事前にいくつかエラーを示してユーザーに判断してもらう形になります。サイズエラー等致命的なものが発見された時はsubmitボタンが無効になります。

## 注意事項

submit先のURLは設定されていません。ので現在アップロードが出来ない。バックエンド側が出来上がったらリンク（ploadURL）を設定してください
psd-standalone.min.jsはHTMLファイルにscriptタグで読み込ませる必要があります。のでファイルは画像の様に静的ファイルディレクトリ(public等)に置いて適切なリンク（psdJSUrl）を設定してください

## 他必要なもの

今は入稿規格についての説明がありません。別途用意する必要がありますが、それ自体checker.tsxでも変数化して適用すべき事ではあるので、これから考える必要があります

## 余談　PSDライブラリの選定について

[PSD.js](https://github.com/meltingice/psd.js/)
割と古めでruby版のライブラリを移植した、今なお安定で高機能なライブラリ。ただし恐ろしく使いづらい
CoffeeScriptという独自JS言語を使っており、普及もしていないので改造ができない
内部でrequireを使用。Node準拠の関数のためそのままブラウザで使えない
そのためかなり無理をしてインストールしている。注意事項はその影響が大きい

[@webtoon/psd](https://github.com/webtoon/psd/tree/main)
軽量(100kb)高速な新しめのライブラリ。だがグレースケールを正しく認識できないバグに遭遇したため断念。
※バグって？→グレースケールをなぜかRGBと認識し、しかもBlueがない画像だとして出力ができない。

[ag-psd](https://github.com/Agamnentzar/ag-psd)
ReadMe一行目、Does not support reading Indexed, CMYK, Multichannel, Duotone and LAB color modes (all supported color modes are converted to RGB mode when reading)
CMYKが読めない時点で当環境に絶対に合わない。

という事で今回はPSD.jsを採用したのだが、今回の作成の前にPSD.jsを通常のJSで書き直したリポジトリを誰かが作ってくれた気がしたのだけど、見失ってしまった。この点はすまない

2025/10/01 柿生
