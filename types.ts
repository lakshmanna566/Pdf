
export type ConversionStatus = 'idle' | 'processing' | 'extracting' | 'normalizing' | 'generating' | 'completed' | 'error';

export interface FileData {
  file: File;
  id: string;
  previewUrl?: string;
}

export interface ProcessingResult {
  originalText: string;
  normalizedText: string;
}

export enum OutputFormat {
  DOCX = 'DOCX',
  PDF = 'PDF'
}
