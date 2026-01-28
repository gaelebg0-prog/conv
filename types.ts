
export enum FileStatus {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  ANALYZING = 'ANALYZING',
  CONVERTING = 'CONVERTING',
  TRANSLATING = 'TRANSLATING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface FileItem {
  id: string;
  file: File;
  previewUrl: string | null;
  status: FileStatus;
  progress: number;
  outputFormat: string | null;
  aiInsights?: string;
  translationResult?: string;
  convertedBlob?: Blob;
}

export interface ConversionOption {
  label: string;
  value: string;
  category: 'image' | 'text' | 'document';
}

export const SUPPORTED_IMAGE_FORMATS = [
  'image/jpeg', 
  'image/png', 
  'image/webp', 
  'image/gif', 
  'image/svg+xml', 
  'image/bmp', 
  'image/x-icon', 
  'image/vnd.microsoft.icon', 
  'image/tiff', 
  'image/avif',
  'image/heic',
  'image/heif'
];

export const SUPPORTED_TEXT_FORMATS = ['text/plain', 'text/markdown', 'application/json', 'text/csv', 'text/html', 'application/xml'];

export const LANGUAGES = [
  { name: 'French', code: 'fr' },
  { name: 'English', code: 'en' },
  { name: 'Spanish', code: 'es' },
  { name: 'German', code: 'de' },
  { name: 'Chinese', code: 'zh' },
  { name: 'Japanese', code: 'ja' },
  { name: 'Italian', code: 'it' },
  { name: 'Portuguese', code: 'pt' }
];
