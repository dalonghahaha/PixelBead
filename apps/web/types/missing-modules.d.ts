/**
 * 模块占位声明(需要用户安装对应 npm 包后生效)
 *
 * 缺少这些依赖时,TS 不会报错;运行时如果没装,会动态 import 失败静默。
 */
declare module 'jspdf' {
  export interface jsPDFOptions {
    orientation?: 'portrait' | 'landscape';
    unit?: 'mm' | 'pt' | 'px';
    format?: string;
  }
  export class jsPDF {
    constructor(options?: jsPDFOptions);
    setFontSize(size: number): jsPDF;
    setFont(name: string, style?: string): jsPDF;
    setTextColor(r: number, g: number, b: number): jsPDF;
    setFillColor(r: number, g: number, b: number): jsPDF;
    setDrawColor(r: number, g: number, b: number): jsPDF;
    setLineWidth(width: number): jsPDF;
    text(text: string | string[], x: number, y: number, options?: { align?: 'left' | 'center' | 'right' }): jsPDF;
    rect(x: number, y: number, w: number, h: number, style?: 'F' | 'S' | 'FD'): jsPDF;
    line(x1: number, y1: number, x2: number, y2: number): jsPDF;
    getTextWidth(text: string): number;
    getNumberOfPages(): number;
    output(type?: 'blob' | 'datauristring'): string | Blob;
    save(filename: string): jsPDF;
    addPage(format?: string): jsPDF;
  }
}

declare module '@sentry/nextjs' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Sentry: any;
  export = Sentry;
}

declare module 'svg2pdf.js';

declare module 'jszip' {
  export class JSZip {
    static loadAsync(data: ArrayBuffer | Blob): Promise<JSZip>;
    file(name: string, content: string | Blob): JSZip;
    generateAsync(type: 'blob' | 'arraybuffer'): Promise<Blob>;
  }
}

declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const vi: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const describe: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const it: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const expect: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const beforeEach: any;
}

declare module '@testing-library/react' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const render: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const screen: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const waitFor: any;
}

interface ImportMeta {
  env?: {
    DEV?: boolean;
    PROD?: boolean;
    MODE?: string;
  };
}