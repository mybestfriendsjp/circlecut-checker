/**
 * checker.tsx
 * ログイン後のホーム画面
 */
import { useEffect } from "react";
import "./checker.css";

// サークルカットのサイズを規格別に定義
// 1スペース、2スペース等
type LIMIT_SIZE = {
  [key: string]: {
    width: number;
    height: number;
  };
};
// PSDファイルデータの型定義（現在未使用だがPSD機能復活時に使用予定）
interface PSDFileData {
  filetype: string;
  filename: string;
  filesize?: string;
  width: string;
  height: string;
  color_mode: string;
  layers: unknown[];
  layers_count: number;
}

/**
 * ******定数定義****** 
 */

// 【テスト定義】ユーザーが選択したスペース規格
const userSelectedSpace = "MBF_SPACE1";

// MBFのサークルカット規格サイズ 1スペース、2スペース
const LIMIT_SIZE: LIMIT_SIZE = {
  MBF_SPACE1: {
    width: 1654,
    height: 1182,
  },
  MBF_SPACE2: {
    width: 3425,
    height: 1182,
  },
};

// ファイルの最大容量。テキストへの反映とSubmit時のinput hiddenで反映
const MAX_FILE_SIZE = 52428800; // 50MB
// PSD.jsのライブラリURLとアップロード先URL
const psdJSUrl = "./psd/psd-standalone.min.js";
const uploadURL = "/api/circlecut-upload";


/** ******ヘルパー関数****** */
/**
 * バイト数を見やすく変換
 * @param bytes
 * @param decimals
 * @returns
 */
function formatBytes(bytes: number, decimals: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

/**
 * PNGの幅と高さを取得
 * @param dataUrl
 * @param callback
 */
function get_png_WH(
  dataUrl: File,
  callback: (WH: number[], dataUrl: string | ArrayBuffer | null) => void
): void {
  const reader = new FileReader();
  reader.addEventListener(
    "load",
    function () {
      // Setting up base64 URL on image
      const element = new Image();
      element.src = reader.result as string;
      element.onload = function () {
        const WH = [element.naturalWidth, element.naturalHeight];
        callback(WH, reader.result);
      };
    },
    false
  );
  reader.readAsDataURL(dataUrl);
}

/**
 * dt要素とdd要素を持つ説明リスト(dl)の要素を作成する
 * @param dtText 
 * @param ddTexts 
 * @returns 
 */
function createDescriptionListElement(
  dtText: string,
  ...ddTexts: (string | number)[]
): HTMLElement {
  const dl = document.createElement("dl");
  const dt = document.createElement("dt");
  dt.innerHTML = dtText;
  dl.appendChild(dt);
  ddTexts.forEach((ddText) => {
    const dd = document.createElement("dd");
    dd.innerHTML = ddText.toString();
    dl.appendChild(dd);
  });
  return dl;
}

/**
 *  画像を分析しデータを表示。さらに規格に基づいたチェックを行う
 * 最終的なerrorの有無をPromiseで返す
 */
async function showFileData(file: File): Promise<boolean> {

  return new Promise((resolve) => {

    // チェック結果 初期値はtrue
    let isError = false;

    // サイズ規格 幅高さは同一が条件
    const limitW = LIMIT_SIZE[userSelectedSpace].width;
    const limitH = LIMIT_SIZE[userSelectedSpace].height;

    const extension = file.name.split(".").pop()?.toLowerCase() || ""; // 拡張子名取得
    const $list = document.querySelector("#file_data_list"); // ファイル情報表示エリア

    if (!$list) return false;

    // ファイル情報は都度リセット
    $list.innerHTML = "";

    /** アナウンス */
    const $announce = document.createElement("p");
    $announce.innerHTML =
      "ファイルの内容を確認し、下のアップロードボタンを押してください";
    $list.appendChild($announce);
    const flag = document.createDocumentFragment();

    /** ファイル情報 */
    flag.appendChild(createDescriptionListElement("ファイル情報", file.name));

    /** 拡張子 */
    const eleExtension = createDescriptionListElement("拡張子", extension);
    if (!extension.toLowerCase().match(/png|psd/)) {
      eleExtension.querySelector("dd")!.classList.add("error");
      isError = true;
    }
    flag.appendChild(eleExtension);

    /** ファイルサイズ */
    const eleFileSize = createDescriptionListElement(
      "ファイルサイズ",
      formatBytes(file.size, 2)
    );
    const maxSizeElement = document.getElementById(
      "max_size"
    ) as HTMLInputElement;
    if (maxSizeElement && file.size > parseInt(maxSizeElement.value)) {
      eleFileSize.querySelector("dd")!.classList.add("error");
    }
    flag.appendChild(eleFileSize);

    /** ファイル種別による分岐 */
    if (extension === "png") {/** PNGファイルの場合 */
      get_png_WH(
        file,
        function (WH: number[], dataUrl: string | ArrayBuffer | null) {
          console.log("file WH", WH, "limit", limitW, limitH);

          /** サイズ 幅  */
          const eleWidth = createDescriptionListElement("幅", WH[0] + "ピクセル");
          if (WH[0] !== limitW) {
            // 規定幅不等
            eleWidth.querySelector("dd")!.classList.add("error");
            isError = true;
          } else {
            eleWidth.querySelector("dd")!.classList.add("ok");
          }
          flag.appendChild(eleWidth);

          /** サイズ 高さ  */
          const eleHeight = createDescriptionListElement(
            "高さ",
            WH[1] + "ピクセル"
          );
          if (WH[1] !== limitH) {
            // 規定高さ不等
            eleHeight.querySelector("dd")!.classList.add("error");
            isError = true;
          } else {
            eleHeight.querySelector("dd")!.classList.add("ok");
          }
          flag.appendChild(eleHeight);

          $list.appendChild(flag);

          showPreviewImage(dataUrl, WH);
          resolve(isError);
        }
      );
    } else if (extension === "psd") {/** PSDファイルの場合 */
      const errTImer = setTimeout(function () {
        // PSD.jsのthrow errorが受け取れないので、時間経過でPSD読み込みエラーを処理
        alert(
          "PSDファイルの読み込みが失敗しております。ブラウザはリロードし、正しいファイルであるか確認してください"
        );
      }, 10000);

      // PSDはpsd.js。グローバルに読み込まれている。= window.PSD
      PSD.fromDroppedFile(file).then(function (psd) {
        clearTimeout(errTImer);

        // PSDファイルの情報を取得
        const tree = psd.tree().export();
        const layers = tree.children;
        const fileData: PSDFileData = {
          filetype: "PSD",
          filename: file.name, // ファイル名
          filesize: formatBytes(psd.file.data.byteLength, 2), // ファイルサイズ
          width: psd.header.cols + "px", // 幅
          height: psd.header.rows + "px", // 高さ
          color_mode: psd.header.modeName(), // カラーモード(Bitmap, Grayscale, Indexed, RGB, CMYK, Multichannel, Duotone, Laba)
          layers: [], // レイヤー構造
          layers_count: 0, // レイヤー数
        };
        fileData["layers"] = layers;
        fileData["layers_count"] = layers.length;
        console.log("fileData", fileData);

        /** カラーモード */
        const eleColorMode = createDescriptionListElement(
          "カラーモード",
          fileData.color_mode
        );
        if (fileData.color_mode !== "GrayScale") {
          // カラーモード不適
          if(fileData.color_mode !== "RGBColor" && fileData.color_mode !== "CMYKColor"){
            // RGB, CMYK以外は警告
            eleColorMode.querySelector("dd")!.classList.add("error");
            isError = true;
          } else {
            eleColorMode.querySelector("dd")!.classList.add("warn");
          }
        } else {
          eleColorMode.querySelector("dd")!.classList.add("ok");
        }
        flag.appendChild(eleColorMode);

        /** サイズ 幅 */
        const eleWidth = createDescriptionListElement("幅", fileData.width);
        if (parseInt(fileData.width) !== limitW) {
          // 規定幅不等
          eleWidth.querySelector("dd")!.classList.add("error");
          isError = true;
        } else {
          eleWidth.querySelector("dd")!.classList.add("ok");
        }
        flag.appendChild(eleWidth);

        /** サイズ 高さ */
        const eleHeight = createDescriptionListElement("高さ", fileData.height);
        if (parseInt(fileData.height) !== limitH) {
          // 規定高さ不等
          eleHeight.querySelector("dd")!.classList.add("error");
          isError = true;
        } else {
          eleHeight.querySelector("dd")!.classList.add("ok");
        }
        flag.appendChild(eleHeight);

        /** サイズ レイヤー数 */
        const eleLayers = createDescriptionListElement(
          "レイヤー数",
          fileData.layers_count
        );
        flag.appendChild(eleLayers);
        if (fileData.layers.length === 0) {
          eleLayers.querySelector("dd")!.classList.add("ok");
          eleLayers.querySelector("dd")!.innerHTML =
            "レイヤー構造なし、画像統合済み";
        } else if (fileData.layers.length > 1) {
          eleLayers.querySelector("dd")!.classList.add("warn");
          eleLayers.querySelector("dd")!.innerHTML =
            "多層レイヤー構造あり。画像統合なし。印刷の際に意図しない仕上がりになる可能性があります。";
        }
        flag.appendChild(eleLayers);

        $list.appendChild(flag);

        showPreviewImage(psd.image.toPng().src, [
          psd.header.cols,
          psd.header.rows,
        ]);
        resolve(isError);
      });
    } else {// PNG, PSD以外
      const abortEle = document.createElement("p");
      abortEle.classList.add("error");
      abortEle.innerHTML = "PNGまたはPSDファイルを選択してください";
      flag.appendChild(abortEle);
      $list.appendChild(flag);
      resolve(true);
    }

  });
}

function showPreviewImage(
  dataUrl: string | ArrayBuffer | null,
  WH: number[]
): void {
  const $preview = document.getElementById("checker_preview") as HTMLElement;
  const $result_gray = document.getElementById("result_gray") as HTMLElement;
  const $canvas = document.createElement("canvas");
  const width = WH[0];
  const height = WH[1];
  const allowable_range = 0; // RGB誤差許容範囲。2くらいまで見分けがつかない

  if (!$preview || !$result_gray || !dataUrl) return;

  $result_gray.innerHTML = ""; // 結果をリセット

  $canvas.width = width;
  $canvas.height = height;
  const ctx = $canvas.getContext("2d");
  const img = new Image();
  img.src = dataUrl as string; // 画像のURLを指定
  img.onload = function () {
    if (!ctx) return;
    ctx.drawImage(img, 0, 0); // 画像を描画
    $preview.innerHTML = ""; // プレビューエリアをリセット
    $preview.appendChild($canvas); // 画像を表示

    const src = ctx.getImageData(0, 0, width, height);

    let mono = 0;
    let color = 0;
    let alpha = 0;
    for (let i = 0; i < src.data.length; i += 4) {
      if (src.data[i + 3] < 255) {
        // 透明の場合
        alpha++;
      }
      if (
        Math.abs(src.data[i] - src.data[i + 1]) <= allowable_range &&
        Math.abs(src.data[i + 1] - src.data[i + 2]) <= allowable_range &&
        Math.abs(src.data[i + 2] - src.data[i]) <= allowable_range
      ) {
        // 白黒の場合
        // console.log('白黒');
        mono++;
      } else {
        // カラーの場合
        // console.log('カラー',src.data.slice(i, i + 4));
        color++;
      }
    }
    console.log("mono", mono);
    console.log("color", color);
    console.log("alpha", alpha);

    $result_gray.innerHTML =
      "画像ピクセルチェック<br>" +
      "白黒：" +
      mono +
      "ピクセル<br>カラー：" +
      color +
      "ピクセル<br>透明：" +
      alpha +
      "ピクセル";

    document.getElementById("color_warn")?.remove();
    if (color > 0 || alpha > 0) {
      const $warn = document.createElement("p");
      $warn.id = "color_warn";
      $warn.classList.add("warn");
      $warn.innerHTML = "警告：カラーまたは透明度が存在する画像です。<br>グレースケールへの変換/画像統合を行う必要があり、意図しない仕上がりになる可能性があります。";
      $result_gray.parentNode?.insertBefore($warn, $result_gray.nextSibling);
    }
  };
}

function Checker() {
  useEffect(() => {
    // 既にスクリプトが存在するかチェックして、なければスクリプトタグを2つ挿入する

    if (!document.querySelector(`script[src="${psdJSUrl}"]`)) {
      const script1 = document.createElement("script");
      script1.src = psdJSUrl;
      script1.async = true;
      document.body.appendChild(script1);
      script1.onload = () => {
        const script2 = document.createElement("script");
        script2.textContent = `var PSD = require("psd");`;
        document.body.appendChild(script2);
      };
    }
    // console.log('psd', PSD);
    /**
     * HTML要素の取得とイベント設定
     */
    const $drop = document.getElementById("image_drop");
    const $input = document.getElementById("image_input") as HTMLInputElement;
    const $submit = document.getElementById("upload_submit") as HTMLButtonElement;

    if (!$drop || !$input || !$submit) {
      console.error("必要なHTML要素が取得できません");
      return;
    }

    // イベントハンドラー関数を定義
    const handleDragOver = (e: Event) => {
      e.preventDefault();
      $drop.classList.add("uk-dragover");
    };

    const handleDragLeave = (e: Event) => {
      e.preventDefault();
      $drop.classList.remove("uk-dragover");
    };

    const handleDrop = (e: DragEvent) => {
      if (!e.dataTransfer) {
        return;
      }
      e.preventDefault();
      $drop.classList.remove("uk-dragover");
      $input.files = e.dataTransfer.files;
      $input.dispatchEvent(new Event("change"));
    };

    const handleChange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (!target.files) {
        return;
      }
      const file = target.files[0];
      if (typeof file !== "undefined") {
        // ファイルが設定されたのを確認したらアップロードボタンを無効化してから検証処理。結果がtrueなら有効化
        console.log("file get success");
        $submit.disabled = true;
        const isError = await showFileData(file);
        console.log("isError", isError);
        if (!isError) {
          $submit.disabled = false;
        }
      } else {
        console.error("file get error");
        $submit.disabled = true;
        [].forEach.call(
          document.querySelectorAll("#file_data_list dd"),
          function (ele: Element) {
            (ele as HTMLElement).innerHTML = "";
          }
        );
      }
    };

    // イベントリスナーを登録
    $drop.addEventListener("dragover", handleDragOver);
    $drop.addEventListener("dragleave", handleDragLeave);
    $drop.addEventListener("drop", handleDrop);
    $input.addEventListener("change", handleChange, false);

    // クリーンアップ関数（コンポーネントがアンマウントされる時に実行される）
    return () => {
      $drop.removeEventListener("dragover", handleDragOver);
      $drop.removeEventListener("dragleave", handleDragLeave);
      $drop.removeEventListener("drop", handleDrop);
      $input.removeEventListener("change", handleChange);
    };
  }, []); // 空の依存配列により、マウント時に一度だけ実行される

  return (
    <div id="checker_wrap">
      <form
        id="upload_form"
        encType="multipart/form-data"
        method="post"
        action={uploadURL}
      >
        <p id="show_circle_name">
          ようこそ。サークル<span id="circle_name">お試し</span>様
        </p>
        <input
          id="max_size"
          type="hidden"
          name="MAX_FILE_SIZE"
          value={MAX_FILE_SIZE}
        />
        <fieldset>
          <legend>
            画像を選択(PNG, PSDのみ対応, {formatBytes(MAX_FILE_SIZE, 2)}以下)
          </legend>
          <div id="image_drop">
            <span uk-icon="icon: cloud-upload"></span>
            <span>画像ファイルをドロップするか</span>
            <div>
              <label>
                【クリックでファイルを選択】
                <input id="image_input" type="file" name="upfile" />
              </label>
              <div></div>
            </div>
          </div>
        </fieldset>
        <div id="file_data_list"></div>
        <input type="hidden" name="circle_id" value="" />
        <input id="upload_submit" type="submit" value="アップロード" disabled />
      </form>
      <div id="result_gray"></div>
      <div id="checker_preview"></div>
    </div>
  );
}

export default Checker;
