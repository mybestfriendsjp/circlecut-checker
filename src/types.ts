
// PSDライブラリの型定義
interface PSDHeader {
  cols: number;
  rows: number;
  modeName(): string;
}

interface PSDFile {
  data: ArrayBuffer;
}

interface PSDTreeNode {
  children: childrenType;
  export(): { children: childrenType[] };
}

interface PSDInstance {
  header: PSDHeader;
  file: PSDFile;
  image: {
    toBase64(): string;
    toPng(): HTMLImageElement;
    saveAsPng(): never; // This always throws
  };
  tree(): PSDTreeNode;
}

interface PSDStatic {
  fromURL(url: string): Promise<PSDInstance>;
  fromEvent(e: DragEvent | InputEvent): Promise<PSDInstance>;
  fromDroppedFile(file: Blob): Promise<PSDInstance>;
}
/**
 * childrenの型参照
 * [ { type: 'layer',
            visible: true,
            opacity: 1,
            blendingMode: 'normal',
            name: 'Make a change and save.',
            left: 275,
            right: 636,
            top: 435,
            bottom: 466,
            height: 31,
            width: 361,
            mask: {},
            text: 
             { value: 'Make a change and save.',
               font: 
                { name: 'HelveticaNeue-Light',
                  sizes: [ 33 ],
                  colors: [ [ 85, 96, 110, 255 ] ],
                  alignment: [ 'center' ] },
               left: 0,
               top: 0,
               right: 0,
               bottom: 0,
               transform: { xx: 1, xy: 0, yx: 0, yy: 1, tx: 456, ty: 459 } },
            image: {} } ] } ]
 */
type childrenType = {
  type: string;
  visible: boolean;
  opacity: number;
  blendingMode: string;
  name: string;
  left: number;
  right: number;
  top: number;
  bottom: number;
  height: number;
  width: number;
  mask: object;
  text: {
    value: string;
    font: {
      name: string;
      sizes: number[];
      colors: number[][];
      alignment: string[];
    };
    left: number;
    top: number;
    right: number;
    bottom: number;
    transform: { xx: number; xy: number; yx: number; yy: number; tx: number; ty: number };
  };
  image: object;
}[];

declare global {
  var PSD: PSDStatic;
  interface Window {
    PSD: PSDStatic;
  }
}