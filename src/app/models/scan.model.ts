export interface ScanSession {
  id?: string;
  scannedBy?: string;
  scannedAt?: string;
  fileOriginalName?: string;
  fileType?: string;
  filePath?: string;
  isHandwritten?: boolean;
  status?: string;
  documentType?: string;
  documentId?: string;
}