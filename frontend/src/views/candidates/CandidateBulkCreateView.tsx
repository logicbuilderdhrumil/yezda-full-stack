/**
 * Candidate bulk create view with file upload and results summary.
 */
import { useState, useRef, type ReactNode, type ChangeEvent, type DragEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '@/components/layouts';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Badge,
  Progress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  toastSuccess,
  toastError,
} from '@/components/ui';
import { CandidatesService } from '@/services';
import { handleApiError } from '@/utils';
import type {
  CreateCandidatePayload,
  BulkCreateCandidatesResponse,
  BulkCreateResultItem,
} from '@/@types/candidate';

type UploadState = 'idle' | 'parsing' | 'uploading' | 'complete' | 'error';

interface ParsedCandidate extends CreateCandidatePayload {
  rowIndex: number;
  isValid: boolean;
  validationError?: string;
}

/**
 * Parse CSV content into candidate records.
 */
function parseCSV(content: string): ParsedCandidate[] {
  const lines = content.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) {
    return [];
  }

  // Parse header - expect: email, firstName, lastName, phone (optional)
  const headerLine = lines[0];
  if (!headerLine) {
    return [];
  }
  const header = headerLine.toLowerCase().split(',').map((h) => h.trim());
  const emailIndex = header.indexOf('email');
  const firstNameIndex = header.indexOf('firstname');
  const lastNameIndex = header.indexOf('lastname');
  const phoneIndex = header.indexOf('phone');

  if (emailIndex === -1 || firstNameIndex === -1 || lastNameIndex === -1) {
    throw new Error('CSV must have email, firstName, and lastName columns');
  }

  const candidates: ParsedCandidate[] = [];

  for (let i = 1; i < lines.length; i++) {
    const currentLine = lines[i];
    if (!currentLine) continue;
    
    const values = currentLine.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
    const email = values[emailIndex] || '';
    const firstName = values[firstNameIndex] || '';
    const lastName = values[lastNameIndex] || '';
    const phone = phoneIndex !== -1 ? values[phoneIndex] : undefined;

    let isValid = true;
    let validationError: string | undefined;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      isValid = false;
      validationError = 'Invalid email';
    } else if (!firstName) {
      isValid = false;
      validationError = 'Missing first name';
    } else if (!lastName) {
      isValid = false;
      validationError = 'Missing last name';
    }

    const candidate: ParsedCandidate = {
      email,
      firstName,
      lastName,
      rowIndex: i,
      isValid,
    };
    
    if (phone) {
      candidate.phone = phone;
    }
    if (validationError) {
      candidate.validationError = validationError;
    }
    
    candidates.push(candidate);
  }

  return candidates;
}

/**
 * CandidateBulkCreateView provides bulk import functionality.
 */
export function CandidateBulkCreateView(): ReactNode {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [isDragOver, setIsDragOver] = useState(false);
  const [parsedCandidates, setParsedCandidates] = useState<ParsedCandidate[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<BulkCreateCandidatesResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const validCandidates = parsedCandidates.filter((c) => c.isValid);
  const invalidCandidates = parsedCandidates.filter((c) => !c.isValid);

  const handleFileSelect = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toastError(t('candidates.bulkCreate.invalidFileType'));
      return;
    }

    setUploadState('parsing');
    setErrorMessage('');

    try {
      const content = await file.text();
      const candidates = parseCSV(content);
      
      if (candidates.length === 0) {
        setErrorMessage(t('candidates.bulkCreate.emptyFile'));
        setUploadState('error');
        return;
      }

      setParsedCandidates(candidates);
      setUploadState('idle');
    } catch (error) {
      console.error('Failed to parse CSV:', error);
      setErrorMessage(error instanceof Error ? error.message : t('candidates.bulkCreate.parseError'));
      setUploadState('error');
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleUpload = async () => {
    if (validCandidates.length === 0) {
      toastError(t('candidates.bulkCreate.noValidCandidates'));
      return;
    }

    setUploadState('uploading');
    setUploadProgress(0);

    try {
      // Create payload without internal fields
      const payload: CreateCandidatePayload[] = validCandidates.map((candidate) => {
        const item: CreateCandidatePayload = {
          email: candidate.email,
          firstName: candidate.firstName,
          lastName: candidate.lastName,
        };
        if (candidate.phone) {
          item.phone = candidate.phone;
        }
        return item;
      });

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const result = await CandidatesService.bulkCreate({ candidates: payload });
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadResult(result);
      setUploadState('complete');

      if (result.successCount > 0) {
        toastSuccess(t('candidates.bulkCreate.success', { count: result.successCount }));
      }
    } catch (error) {
      handleApiError(error);
      setErrorMessage(t('candidates.bulkCreate.uploadError'));
      setUploadState('error');
    }
  };

  const handleReset = () => {
    setParsedCandidates([]);
    setUploadState('idle');
    setUploadProgress(0);
    setUploadResult(null);
    setErrorMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleBack = () => {
    navigate('/candidates');
  };

  const renderResultBadge = (result: BulkCreateResultItem) => {
    if (result.success) {
      return <Badge variant="default">{t('common.success')}</Badge>;
    }
    return (
      <Badge variant="destructive" title={result.error}>
        {t('common.failed')}
      </Badge>
    );
  };

  return (
    <PageContainer
      title={t('candidates.bulkCreate.title')}
      description={t('candidates.bulkCreate.description')}
    >
      <div className="space-y-6">
        {/* Back button */}
        <Button variant="outline" onClick={handleBack}>
          ← {t('common.back')}
        </Button>

        {/* Upload zone */}
        {uploadState !== 'complete' && parsedCandidates.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t('candidates.bulkCreate.uploadTitle')}</CardTitle>
              <CardDescription>{t('candidates.bulkCreate.uploadDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className={`
                  border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                  transition-colors duration-200
                  ${isDragOver 
                    ? 'border-primary bg-primary/5' 
                    : 'border-gray-300 dark:border-gray-600 hover:border-primary/50'
                  }
                  ${uploadState === 'error' ? 'border-destructive bg-destructive/5' : ''}
                `}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    fileInputRef.current?.click();
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={t('candidates.bulkCreate.dropzoneLabel')}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleInputChange}
                  className="hidden"
                  aria-hidden="true"
                />
                <div className="space-y-2">
                  <p className="text-lg font-medium">
                    {t('candidates.bulkCreate.dropzoneText')}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('candidates.bulkCreate.dropzoneSubtext')}
                  </p>
                </div>
              </div>
              {errorMessage && (
                <p className="mt-4 text-sm text-destructive">{errorMessage}</p>
              )}
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">
                  {t('candidates.bulkCreate.formatTitle')}
                </p>
                <code className="text-xs block bg-background p-2 rounded border">
                  email,firstName,lastName,phone
                  <br />
                  john@example.com,John,Doe,+1234567890
                </code>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Preview table */}
        {parsedCandidates.length > 0 && uploadState !== 'complete' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t('candidates.bulkCreate.previewTitle')}</CardTitle>
                  <CardDescription>
                    {t('candidates.bulkCreate.previewDescription', {
                      valid: validCandidates.length,
                      invalid: invalidCandidates.length,
                    })}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleReset} disabled={uploadState === 'uploading'}>
                    {t('common.reset')}
                  </Button>
                  <Button 
                    onClick={handleUpload} 
                    disabled={validCandidates.length === 0 || uploadState === 'uploading'}
                  >
                    {uploadState === 'uploading' 
                      ? t('candidates.bulkCreate.uploading') 
                      : t('candidates.bulkCreate.uploadButton', { count: validCandidates.length })}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {uploadState === 'uploading' && (
                <div className="mb-4">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-sm text-gray-500 mt-1">
                    {t('candidates.bulkCreate.progress', { percent: uploadProgress })}
                  </p>
                </div>
              )}
              <div className="rounded-lg border border-gray-200 dark:border-gray-700">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">{t('candidates.bulkCreate.rowColumn')}</TableHead>
                      <TableHead>{t('candidates.columns.email')}</TableHead>
                      <TableHead>{t('candidates.columns.name')}</TableHead>
                      <TableHead>{t('candidates.form.phone')}</TableHead>
                      <TableHead className="w-32">{t('candidates.columns.status')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedCandidates.slice(0, 10).map((candidate) => (
                      <TableRow key={candidate.rowIndex}>
                        <TableCell className="text-gray-500">{candidate.rowIndex}</TableCell>
                        <TableCell>{candidate.email}</TableCell>
                        <TableCell>{`${candidate.firstName} ${candidate.lastName}`}</TableCell>
                        <TableCell className="text-gray-500">{candidate.phone || '-'}</TableCell>
                        <TableCell>
                          {candidate.isValid ? (
                            <Badge variant="outline">{t('candidates.bulkCreate.valid')}</Badge>
                          ) : (
                            <Badge variant="destructive" title={candidate.validationError}>
                              {t('candidates.bulkCreate.invalid')}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {parsedCandidates.length > 10 && (
                <p className="mt-2 text-sm text-gray-500">
                  {t('candidates.bulkCreate.moreRows', { count: parsedCandidates.length - 10 })}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {uploadState === 'complete' && uploadResult && (
          <Card>
            <CardHeader>
              <CardTitle>{t('candidates.bulkCreate.resultsTitle')}</CardTitle>
              <CardDescription>
                {t('candidates.bulkCreate.resultsDescription', {
                  total: uploadResult.totalProcessed,
                  success: uploadResult.successCount,
                  failed: uploadResult.failureCount,
                })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6">
                <div className="text-center p-4 bg-muted rounded-lg flex-1">
                  <p className="text-2xl font-bold text-green-600">{uploadResult.successCount}</p>
                  <p className="text-sm text-gray-500">{t('candidates.bulkCreate.successCount')}</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg flex-1">
                  <p className="text-2xl font-bold text-red-600">{uploadResult.failureCount}</p>
                  <p className="text-sm text-gray-500">{t('candidates.bulkCreate.failureCount')}</p>
                </div>
              </div>

              {uploadResult.results.length > 0 && (
                <div className="rounded-lg border border-gray-200 dark:border-gray-700">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">{t('candidates.bulkCreate.rowColumn')}</TableHead>
                        <TableHead>{t('candidates.columns.email')}</TableHead>
                        <TableHead className="w-32">{t('candidates.columns.status')}</TableHead>
                        <TableHead>{t('candidates.bulkCreate.errorColumn')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {uploadResult.results.map((result, index) => (
                        <TableRow key={index}>
                          <TableCell className="text-gray-500">{result.index + 1}</TableCell>
                          <TableCell>{validCandidates[result.index]?.email || '-'}</TableCell>
                          <TableCell>{renderResultBadge(result)}</TableCell>
                          <TableCell className="text-gray-500 text-sm">
                            {result.error || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              <div className="mt-6 flex gap-2">
                <Button variant="outline" onClick={handleReset}>
                  {t('candidates.bulkCreate.uploadMore')}
                </Button>
                <Button onClick={() => navigate('/candidates')}>
                  {t('candidates.bulkCreate.viewCandidates')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}
