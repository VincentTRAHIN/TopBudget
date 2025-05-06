'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import fetcher from '@/utils/fetcher.utils';
import { importDepensesEndpoint } from '@/services/api.service';
import { useDepenses } from '@/hooks/useDepenses.hook';
import { X, UploadCloud, FileText } from 'lucide-react';

interface ImportCsvModalProps {
  onClose: () => void;
}

interface ImportError {
  ligne: number;
  data: Record<string, string>;
  erreur: string;
}

interface ImportResult {
  message: string;
  totalLignesLues: number;
  importedCount: number;
  errorCount: number;
  erreurs: ImportError[];
}

export default function ImportCsvModal({ onClose }: ImportCsvModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const { refreshDepenses } = useDepenses();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (
        file.type === 'text/csv' ||
        file.name.toLowerCase().endsWith('.csv')
      ) {
        setSelectedFile(file);
        setImportResult(null);
      } else {
        toast.error('Veuillez sélectionner un fichier CSV valide.');
        setSelectedFile(null);
      }
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error('Veuillez sélectionner un fichier CSV.');
      return;
    }

    setIsImporting(true);
    setImportResult(null);
    const formData = new FormData();
    formData.append('csvFile', selectedFile);

    try {
      const result = await fetcher<ImportResult>(importDepensesEndpoint, {
        method: 'POST',
        body: formData,
      });
      setImportResult(result);
      toast.success(result.message || 'Importation terminée avec succès !');
      if (result.importedCount > 0) {
        refreshDepenses();
      }
    } catch (error: unknown) {
      console.error("Erreur lors de l'importation:", error);
      let errorMessage = "Erreur lors de l'importation.";
      if (typeof error === 'object' && error !== null && 'info' in error) {
        const errorInfo = (error as { info?: { message?: string } }).info;

        if (
          typeof errorInfo === 'object' &&
          errorInfo !== null &&
          'message' in errorInfo &&
          typeof errorInfo.message === 'string'
        ) {
          errorMessage = errorInfo.message;
        }
        else if (error instanceof Error) {
          errorMessage = error.message;
        }
      }
      else if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
      setImportResult({
        message: errorMessage,
        totalLignesLues: 0,
        importedCount: 0,
        errorCount: 0,
        erreurs: [],
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
          aria-label="Fermer"
        >
          <X size={24} />
        </button>
        <h2 className="text-xl font-semibold mb-4">
          Importer des Dépenses (CSV)
        </h2>

        <div className="mb-4 p-4 border border-blue-200 bg-blue-50 rounded-md text-sm text-blue-700">
          <p>
            <strong>Format attendu :</strong>
          </p>
          <ul className="list-disc list-inside ml-4">
            <li>Séparateur : Virgule (,)</li>
            <li>Encodage : UTF-8</li>
            <li>
              En-têtes (insensible à la casse, ordre indifférent) :{' '}
              <code>Date</code>, <code>Montant</code>, <code>Categorie</code>,{' '}
              <code>Description</code> (optionnel)
            </li>
            <li>
              Format Date : <code>JJ/MM/AAAA</code> (ex: 31/12/2023)
            </li>
            <li>
              Format Montant : Nombre avec point ou virgule comme séparateur
              décimal (ex: 10.50 ou 10,50)
            </li>
          </ul>
        </div>

        <div className="mb-4">
          <label
            htmlFor="csv-file-input"
            className="flex flex-col items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-md appearance-none cursor-pointer hover:border-gray-400 focus:outline-none"
          >
            {selectedFile ? (
              <div className="text-center">
                <FileText className="mx-auto h-8 w-8 text-gray-500" />
                <span className="mt-2 block text-sm font-medium text-gray-900">
                  {selectedFile.name}
                </span>
                <span className="text-xs text-gray-500">
                  Cliquez pour changer
                </span>
              </div>
            ) : (
              <div className="text-center">
                <UploadCloud className="mx-auto h-8 w-8 text-gray-500" />
                <span className="mt-2 block text-sm font-medium text-gray-900">
                  Glissez-déposez ou cliquez pour sélectionner un fichier CSV
                </span>
                <span className="text-xs text-gray-500">Max 10MB</span>
              </div>
            )}
            <input
              id="csv-file-input"
              type="file"
              accept=".csv, text/csv"
              onChange={handleFileChange}
              className="sr-only"
              disabled={isImporting}
            />
          </label>
        </div>

        {importResult && (
          <div
            className={`mb-4 p-4 rounded-md ${importResult.errorCount > 0 ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}
          >
            <p
              className={`font-semibold ${importResult.errorCount > 0 ? 'text-red-800' : 'text-green-800'}`}
            >
              Résultat de l&apos;importation :
            </p>
            <ul
              className={`text-sm ${importResult.errorCount > 0 ? 'text-red-700' : 'text-green-700'}`}
            >
              <li>Lignes lues : {importResult.totalLignesLues}</li>
              <li>Dépenses importées : {importResult.importedCount}</li>
              <li>Lignes avec erreurs : {importResult.errorCount}</li>
            </ul>
            {importResult.erreurs && importResult.erreurs.length > 0 && (
              <div className="mt-2 max-h-32 overflow-y-auto text-xs border-t border-red-200 pt-2">
                <p className="font-medium text-red-800 mb-1">
                  Détails des erreurs :
                </p>
                {importResult.erreurs.map((err, index) => (
                  <p key={index} className="text-red-600">
                    Ligne {err.ligne}: {err.erreur}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isImporting}
            className="btn-secondary"
          >
            Annuler
          </button>
          <button
            onClick={handleImport}
            disabled={!selectedFile || isImporting}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isImporting ? 'Importation...' : 'Importer'}
          </button>
        </div>
      </div>
    </div>
  );
}
