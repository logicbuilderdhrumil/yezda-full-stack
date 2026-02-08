/**
 * Files list view with pagination and file actions.
 */
import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Download, Trash2, FileIcon } from 'lucide-react';
import { PageContainer } from '@/components/layouts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Button,
  Pagination,
  PaginationInfo,
  SkeletonTable,
  toastError,
  toastSuccess,
} from '@/components/ui';
import { FileService } from '@/services';
import { formatDate } from '@/utils';
import type { FileMetadataDTO } from '@/@types/contracts';

const DEFAULT_PAGE_SIZE = 10;

/**
 * FilesListView displays uploaded files with actions for download and delete.
 */
export function FilesListView(): ReactNode {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [files, setFiles] = useState<FileMetadataDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // URL-synced pagination
  const page = Number(searchParams.get('page')) || 1;
  const offset = (page - 1) * DEFAULT_PAGE_SIZE;
  const totalPages = Math.ceil(totalItems / DEFAULT_PAGE_SIZE);

  // Fetch files
  const fetchFiles = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await FileService.list({
        limit: DEFAULT_PAGE_SIZE,
        offset,
      });
      setFiles(response.files);
      setTotalItems(response.total);
    } catch (error) {
      toastError(t('files.fetchError', 'Failed to load files'));
      console.error('Failed to fetch files:', error);
    } finally {
      setIsLoading(false);
    }
  }, [offset, t]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(newPage));
    setSearchParams(params);
  };

  const handleDownload = async (file: FileMetadataDTO) => {
    try {
      await FileService.download(file.id, file.originalFilename);
      toastSuccess(t('files.downloadSuccess', 'File downloaded'));
    } catch (error) {
      toastError(t('files.downloadError', 'Failed to download file'));
      console.error('Failed to download file:', error);
    }
  };

  const handleDelete = async (fileId: string) => {
    setDeletingId(fileId);
    try {
      await FileService.delete(fileId);
      toastSuccess(t('files.deleteSuccess', 'File deleted'));
      fetchFiles();
    } catch (error) {
      toastError(t('files.deleteError', 'Failed to delete file'));
      console.error('Failed to delete file:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const getScanStatusBadge = (status: FileMetadataDTO['scanStatus']) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      clean: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      infected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      error: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    };
    return (
      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${styles[status]}`}>
        {status}
      </span>
    );
  };

  return (
    <PageContainer
      title={t('files.title', 'Files')}
      description={t('files.description', 'Manage uploaded files')}
    >
      {/* Table */}
      {isLoading ? (
        <SkeletonTable rows={5} columns={5} />
      ) : (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('files.columns.name', 'Name')}</TableHead>
                <TableHead>{t('files.columns.type', 'Type')}</TableHead>
                <TableHead>{t('files.columns.size', 'Size')}</TableHead>
                <TableHead>{t('files.columns.status', 'Status')}</TableHead>
                <TableHead>{t('files.columns.uploaded', 'Uploaded')}</TableHead>
                <TableHead className="text-right">{t('files.columns.actions', 'Actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {files.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-gray-500">
                    {t('files.noResults', 'No files found')}
                  </TableCell>
                </TableRow>
              ) : (
                files.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileIcon className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{file.originalFilename}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-500">{file.mimeType}</TableCell>
                    <TableCell className="text-gray-500">{file.sizeFormatted}</TableCell>
                    <TableCell>{getScanStatusBadge(file.scanStatus)}</TableCell>
                    <TableCell className="text-gray-500">{formatDate(file.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(file)}
                          title={t('files.download', 'Download')}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (window.confirm(t('files.deleteConfirmMessage', 'Are you sure you want to delete this file?'))) {
                              handleDelete(file.id);
                            }
                          }}
                          disabled={deletingId === file.id}
                          title={t('files.delete', 'Delete')}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <PaginationInfo page={page} pageSize={DEFAULT_PAGE_SIZE} totalItems={totalItems} />
          <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
        </div>
      )}
    </PageContainer>
  );
}
