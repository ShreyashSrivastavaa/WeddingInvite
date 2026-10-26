import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, ApiError } from '../../lib/api';
import { Modal } from '../../components/common/Modal';
import { CsvImportPreviewResult } from '@rsvp/shared';
import {
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Download,
  AlertTriangle,
} from 'lucide-react';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  weddingId: string;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  weddingId,
}) => {
  const queryClient = useQueryClient();

  const [step, setStep] = useState<'upload' | 'preview'>('upload');
  const [csvContent, setCsvContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [previewData, setPreviewData] = useState<CsvImportPreviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const previewMutation = useMutation({
    mutationFn: (content: string) =>
      apiFetch<CsvImportPreviewResult>(`/api/weddings/${weddingId}/households/import/preview`, {
        method: 'POST',
        body: JSON.stringify({ csvContent: content }),
      }),
    onSuccess: (data) => {
      setPreviewData(data);
      setStep('preview');
      setError(null);
    },
    onError: (err: ApiError) => {
      setError(err.message);
    },
  });

  const commitMutation = useMutation({
    mutationFn: (validRows: any[]) =>
      apiFetch<{ success: boolean; importedCount: number }>(
        `/api/weddings/${weddingId}/households/import/commit`,
        {
          method: 'POST',
          body: JSON.stringify({ validRows }),
        }
      ),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['households', weddingId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', weddingId] });
      handleClose();
    },
    onError: (err: ApiError) => {
      setError(err.message);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      setError('File size exceeds the 1 MB limit.');
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvContent(text);
      previewMutation.mutate(text);
    };
    reader.onerror = () => {
      setError('Could not read the uploaded CSV file.');
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleClose = () => {
    setStep('upload');
    setCsvContent('');
    setFileName('');
    setPreviewData(null);
    setError(null);
    onClose();
  };

  const downloadSampleTemplate = () => {
    const sample =
      'name,phone,email,category,invited_count,notes\n' +
      'Dr. Rajesh Sharma,9876543210,rajesh@example.com,FAMILY,4,Groom uncle\n' +
      'Sunita Gupta,+91 98111 22233,sunita@example.com,FRIEND,2,Bride college friend\n' +
      'राजेश शर्मा,+91 98222 33344,rajesh.sharma@example.com,VIP,3,Hindi name support\n';

    const blob = new Blob([sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'wedding_guest_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Import Guests via CSV" maxWidth="2xl">
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {step === 'upload' ? (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-cream-50 border border-cream-200 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-stone-900">Need a template?</p>
              <p className="text-xs text-stone-500 mt-0.5">
                Download a pre-formatted CSV template with accepted columns.
              </p>
            </div>
            <button
              type="button"
              onClick={downloadSampleTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cream-300 bg-white hover:bg-cream-100 text-xs font-semibold text-stone-700 transition-colors"
            >
              <Download size={14} />
              <span>Download Template</span>
            </button>
          </div>

          <div className="border-2 border-dashed border-cream-300 rounded-2xl p-8 text-center hover:border-maroon-600 transition-colors bg-white">
            <div className="w-12 h-12 rounded-xl bg-cream-100 text-maroon-700 flex items-center justify-center mx-auto mb-3">
              <Upload size={24} />
            </div>
            <p className="text-sm font-semibold text-stone-900 mb-1">
              Select or drop your guest CSV file here
            </p>
            <p className="text-xs text-stone-500 mb-4">
              Accepted format: UTF-8 CSV, max 1 MB, up to 5,000 rows. Supports Devanagari Hindi names.
            </p>

            <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-maroon-700 hover:bg-maroon-800 text-white font-medium text-sm cursor-pointer shadow-sm transition-colors">
              <FileSpreadsheet size={16} />
              <span>{previewMutation.isPending ? 'Reading File...' : 'Choose CSV File'}</span>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileChange}
                disabled={previewMutation.isPending}
                className="hidden"
              />
            </label>
          </div>
        </div>
      ) : (
        /* Preview Step */
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
              <p className="text-xs text-emerald-700 font-medium">Valid to Import</p>
              <p className="text-xl font-bold text-emerald-900 mt-0.5">
                {previewData?.validRowCount || 0}
              </p>
            </div>
            <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
              <p className="text-xs text-rose-700 font-medium">Invalid Rows</p>
              <p className="text-xl font-bold text-rose-900 mt-0.5">
                {previewData?.invalidRowCount || 0}
              </p>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
              <p className="text-xs text-amber-700 font-medium">Duplicate Warnings</p>
              <p className="text-xl font-bold text-amber-900 mt-0.5">
                {previewData?.duplicateWarningCount || 0}
              </p>
            </div>
          </div>

          <p className="text-xs text-stone-600">
            Preview of parsed rows from <strong>{fileName}</strong>:
          </p>

          <div className="max-h-72 overflow-y-auto border border-cream-200 rounded-xl">
            <table className="min-w-full divide-y divide-cream-200 text-xs">
              <thead className="bg-cream-50 sticky top-0">
                <tr className="text-left font-semibold text-stone-600">
                  <th className="py-2.5 px-3">Row</th>
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Phone</th>
                  <th className="py-2.5 px-3">Seats</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-100 bg-white">
                {previewData?.rows.map((row) => (
                  <tr
                    key={row.rowNumber}
                    className={row.isValid ? 'hover:bg-cream-50/50' : 'bg-rose-50/30'}
                  >
                    <td className="py-2 px-3 font-mono text-stone-400">{row.rowNumber}</td>
                    <td className="py-2 px-3 font-medium text-stone-900">
                      {row.displayName || <span className="text-rose-600">Missing Name</span>}
                    </td>
                    <td className="py-2 px-3 text-stone-600">
                      {row.phoneE164 || row.phoneRaw}
                      {row.duplicateWarning && (
                        <span className="block text-[10px] text-amber-800 font-medium flex items-center gap-1 mt-0.5">
                          <AlertTriangle size={10} /> Shares phone with "{row.duplicateWarning.existingHouseholdName}"
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-stone-700">{row.invitedCount}</td>
                    <td className="py-2 px-3">
                      {row.isValid ? (
                        <span className="inline-flex items-center gap-1 text-emerald-800 font-semibold text-[11px]">
                          <CheckCircle2 size={12} /> Valid
                        </span>
                      ) : (
                        <span className="text-rose-700 font-medium text-[11px] block">
                          {row.errors.join(', ')}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-4 border-t border-cream-200 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep('upload')}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900"
            >
              Choose different file
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 border border-cream-300 rounded-xl text-xs font-semibold text-stone-700 hover:bg-cream-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!previewData?.validRowCount || commitMutation.isPending}
                onClick={() => {
                  const valid = previewData?.rows.filter((r) => r.isValid) || [];
                  commitMutation.mutate(valid);
                }}
                className="px-5 py-2 rounded-xl bg-maroon-700 hover:bg-maroon-800 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
              >
                {commitMutation.isPending
                  ? 'Importing...'
                  : `Confirm & Import ${previewData?.validRowCount || 0} Households`}
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};
