import { useEffect, useState } from "react";
import Papa, { ParseResult } from "papaparse";
import { read, utils } from "xlsx";
import { FileWithPath } from "react-dropzone";

export type Mapped = { [key: string]: any };

export interface ColumnMap {
  source: string;
  target: string;
}

export type ColumnMapping = ColumnMap[];

export interface TransformedFile {
  original: File;
  originalData: Mapped[];
  transformed: File;
  transformedData: Mapped[];
}

interface TransformResult extends TransformedFile {
  errors: any[];
}

/**
 * Acceptable file formats that are able to be parsed and transformed
 */
export type FileType =
  | "text/csv"
  | "application/vnd.ms-excel"
  | "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  | "text/xml";

/**
 * Acceptable file formats that are able to be parsed and transformed
 */
export const FILE_TYPES = [
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/xml",
];

/**
 *
 * @description The proposed hook provides a straightforward method to transform or re-map file headers
 *  to align with the application's required headers. This functionality allows users
 * to upload files with varying header names while enabling the application
 * to process them internally before sending them to the backend.
 * Currently, the output file format is restricted to CSV. The following MIME types are supported:
 *
 *  - "text/csv"
 *  - "application/vnd.ms-excel"
 *  - "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
 *  - "text/xml"
 *
 * Note: XML files can have a maximum
 * depth of two levels, including the root element.
 *
 */
export function useFileTransformer() {
  const [files, setFiles] = useState<FileList | FileWithPath[] | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [transformedFiles, setTransformedFiles] = useState<TransformedFile[]>(
    []
  );
  const [loading, setLoading] = useState(false);

  /**
   *
   * @param e ChangeEvent
   * @description Useful utility that can be directly passed to the
   * file input onChange handler.
   */
  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    clear();
    setFiles(e.target.files);
  }

  /**
   *
   * @param mapping Map that represents the source headers to the target headers.
   * Can be seen as Map<source, target> and an example of a key-value pair would be:
   * Key = `name`, Value = `username`
   *
   * @description Reads all provided files and manipulates all files that are elgible.
   * `transformedFiles` is set with the result of the function
   */
  async function transform(mapping: ColumnMapping) {
    if (files) {
      const cm = new Map<string, string>(
        mapping.map((value) => [value.source, value.target])
      );
      setLoading(true);
      for (let i = 0; i < files.length; i++) {
        let file: File;
        if (files instanceof FileList) {
          file = files.item(i) as File;
        } else {
          file = files[i];
        }

        if (!file || !isAcceptableFile(file.type)) {
          console.log("here");
          continue;
        }

        const reader = new FileReader();
        reader.readAsText(file, "utf-8");
        reader.onload = async function (ev) {
          const content = ev.target?.result;
          if (!content || content instanceof ArrayBuffer) return;

          let resp: TransformResult;
          switch (file.type as FileType) {
            case "text/csv":
              resp = transformCsv(file, content, cm);
              setTransformedFiles((prev) => [...prev, resp]);
              break;
            case "application/vnd.ms-excel":
            case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
              const data = await file.arrayBuffer();
              resp = transformExcel(file, data, cm);
              setTransformedFiles((prev) => [...prev, resp]);
              break;
            case "text/xml":
              resp = transformXml(file, content, cm);
              setTransformedFiles((prev) => [...prev, resp]);
          }
        };
      }
    }
  }

  /**
   * @description Loads the headers from a single file and sets `headers`.
   * In the case of multiple available files, only the first provided file's
   * headers will be imported. Should not be used
   */
  async function importHeaders() {
    if (files && files.length !== 0) {
      let file: File;
      if (files instanceof FileList) {
        file = files.item(0) as File;
      } else {
        file = files[0];
      }

      const reader = new FileReader();
      reader.readAsText(file, "utf-8");
      reader.onload = async function (ev) {
        const content = ev.target?.result;
        if (!content || content instanceof ArrayBuffer) return;

        switch (file.type as FileType) {
          case "text/csv":
            setHeaders(parseCsvHeaders(content));
            break;
          case "application/vnd.ms-excel":
          case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
            const data = await file.arrayBuffer();
            setHeaders(parseExcelHeaders(data));
            break;
          case "text/xml":
            setHeaders(parseXmlHeaders(content));
        }
      };
    }
  }

  useEffect(() => {
    if (files && files.length === transformedFiles.length) {
      setLoading(false);
    }
  }, [files, transformedFiles]);

  /**
   * @description Simple function that handles clearing any previously transformed files
   */
  function clear() {
    setTransformedFiles([]);
    setHeaders([]);
    setLoading(false);
  }

  return {
    files,
    setFiles,
    onChange,
    transform,
    transformedFiles,
    headers,
    importHeaders,
    clear,
    loading,
  };
}

function isAcceptableFile(fileType: string): boolean {
  return FILE_TYPES.includes(fileType);
}

/**
 *
 * @param file - The provided file that needs to be manipulated
 * @param content - The content of the file as a string
 * @param m - The header mapper that can be described as Map<source header, target/desired header>
 * @returns TransformResult which includes the original file, original data in JSON,
 * the transformed file (csv file),the transformed data in JSON and any errors that may
 * have occurred.
 * @description Parses the provided csv file and returns a transformed csv file with the
 * target headers
 */
function transformCsv(
  file: File,
  content: string,
  m: Map<string, string>
): TransformResult {
  const res: ParseResult<Mapped> = Papa.parse(content, {
    header: true,
  });

  const transformedData = res.data.map((value) =>
    Object.keys(value)
      .filter((key) => m.has(key))
      .reduce((newObj, k) => {
        const newKey = m.get(k) as string;
        newObj[newKey] = value[k];
        return newObj;
      }, {} as Mapped)
  );

  const transformed = Papa.unparse(transformedData, {
    header: true,
  });
  return {
    original: file,
    originalData: res.data,
    transformed: new File([transformed], file.name, {
      type: "text/csv",
    }),
    transformedData,
    errors: res.errors,
  };
}

function parseCsvHeaders(content: string): string[] {
  const res: ParseResult<Mapped> = Papa.parse(content, {
    header: true,
    preview: 2,
  });

  if (res.data.length === 0) return [];

  return Object.keys(res.data[0]);
}

/**
 *
 * @param file - The provided file that needs to be manipulated
 * @param content - The content of the file as an ArrayBuffer
 * @param m - The header mapper that can be described as Map<source header, target/desired header>
 * @returns TransformResult which includes the original file, original data in JSON,
 * the transformed file (csv file),the transformed data in JSON and any errors that may
 * have occurred.
 * @description Parses the provided excel file and returns a transformed csv file with the
 * target headers
 */
function transformExcel(
  file: File,
  content: ArrayBuffer,
  m: Map<string, string>
): TransformResult {
  const data = parseExcel(content);
  const transformedData = data.map((value) =>
    Object.keys(value)
      .filter((key) => m.has(key))
      .reduce((newObj, k) => {
        const newKey = m.get(k) as string;
        newObj[newKey] = value[k];
        return newObj;
      }, {} as Mapped)
  );

  const transformed = Papa.unparse(transformedData, {
    header: true,
  });
  let parts = file.name.split(".");
  parts = parts.slice(0, parts.length - 1);
  const fileName = parts.join(".") + ".csv";
  return {
    original: file,
    originalData: data,
    transformed: new File([transformed], fileName, {
      type: "text/csv",
    }),
    transformedData,
    errors: [],
  };
}

function parseExcel(content: ArrayBuffer): Mapped[] {
  const wb = read(content);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data: Mapped[] = utils.sheet_to_json(ws);
  return data;
}

function parseExcelHeaders(content: ArrayBuffer): string[] {
  const data = parseExcel(content);
  if (data.length === 0) return [];

  return Object.keys(data[0]);
}

/**
 *
 * @param file - The provided file that needs to be manipulated
 * @param content - The content of the file as an string
 * @param m - The header mapper that can be described as Map<source header, target/desired header>
 * @returns TransformResult which includes the original file, original data in JSON,
 * the transformed file (csv file),the transformed data in JSON and any errors that may
 * have occurred.
 * @description Parses the provided xml file and returns a transformed csv file with the
 * target headers
 */
function transformXml(
  file: File,
  content: string,
  m: Map<string, string>
): TransformResult {
  const data = parseXml(content);

  const transformedData = data.map((value) =>
    Object.keys(value)
      .filter((key) => m.has(key))
      .reduce((newObj, k) => {
        const newKey = m.get(k) as string;
        newObj[newKey] = value[k];
        return newObj;
      }, {} as Mapped)
  );

  const transformed = Papa.unparse(transformedData, {
    header: true,
  });
  return {
    original: file,
    originalData: data,
    transformed: new File([transformed], file.name.replace(".xml", ".csv"), {
      type: "text/csv",
    }),
    transformedData,
    errors: [],
  };
}

function parseXml(content: string): Mapped[] {
  const parser = new DOMParser();
  const xml = parser.parseFromString(content, "text/xml");
  let data: Mapped[] = [];
  const nodes = xml.documentElement.childNodes;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const entry: Mapped = {};
    if (node.nodeType === 1) {
      const children = node.childNodes;
      for (let j = 0; j < children.length; j++) {
        const childNode = children[j];
        if (childNode.nodeType === 1) {
          entry[childNode.nodeName] = childNode.textContent;
        }
      }
      data.push(entry);
    }
  }

  return data;
}

function parseXmlHeaders(content: string): string[] {
  const data = parseXml(content);
  if (data.length === 0) return [];

  return Object.keys(data[0]);
}

export default useFileTransformer;
