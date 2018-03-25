import * as Papa from 'papaparse';
import { read } from './fileprocess';

export async function parseCsvFile(
  fileName: string
): Promise<Papa.ParseResult>{
  const content = await read(fileName);
  //If you tell Papa there is a header row, each row will be organized by field name instead of index
  const config = {
    header: true,
    dynamicTyping: true,
    delimiter: '\t',
    fastMode: false,
  }
  return Papa.parse(content, config);
}
