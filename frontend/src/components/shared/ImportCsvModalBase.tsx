'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import fetcher from '@/utils/fetcher.utils';
import { X, UploadCloud, FileText } from 'lucide-react';

interface ImportError {
  ligne: number;
  erreurs: string[];
  donnees: Record<string, string>;
  contexte: string;
}

interface ImportResult {
  success: boolean;
  message: string;
  totalLines: number;
  successCount: number;
  errorCount: number;
  errors: ImportError[];
  statistiques?: {
    lignesAvecEntetes: number;
    lignesVides: number;
    lignesValides: number;
  };
}

interface ImportCsvModalBaseProps {
  onClose: () => void;
  modalTitle: string;
  endpoint: string;
  onImportSuccess: () => void;
  formatInstructions: React.ReactNode;
  importedItemLabel: string;
  inputId?: string;
}

export default function ImportCsvModalBase({
  onClose,
  modalTitle,
  endpoint,
  onImportSuccess,
  formatInstructions,
  importedItemLabel,
  inputId = 'csv-file-input',
}: ImportCsvModalBaseProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

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
      const result = await fetcher<ImportResult>(endpoint, {
        method: 'POST',
        body: formData,
      });
      setImportResult(result);
      
      // Nettoyer le message pour éviter les doublons d'icônes (react-hot-toast ajoute déjà sa propre icône)
      const cleanMessage = (result.message || 'Importation terminée avec succès !')
        .replace(/^[✅❌⚠️🔥]?\s*/, ''); // Supprimer les émojis en début de message
      
      // Afficher le toast approprié selon le résultat
      if (result.success && result.successCount > 0) {
        toast.success(cleanMessage);
        onImportSuccess();
      } else if (result.success && result.successCount === 0) {
        toast.error('Aucune ligne importée : ' + cleanMessage);
      } else {
        toast.error('Erreur d\'importation : ' + cleanMessage);
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
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
      setImportResult({
        success: false,
        message: errorMessage,
        totalLines: 0,
        successCount: 0,
        errorCount: 0,
        errors: [],
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
        <h2 className="text-xl font-semibold mb-4">{modalTitle}</h2>

        <div className="mb-4 p-4 border border-blue-200 bg-blue-50 rounded-md text-sm text-blue-700">
          {formatInstructions}
        </div>

        <div className="mb-4">
          <label
            htmlFor={inputId}
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
              id={inputId}
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
              <li>Lignes lues : {importResult.totalLines}</li>
              <li>{importedItemLabel} : {importResult.successCount}</li>
              <li>Lignes avec erreurs : {importResult.errorCount}</li>
              {importResult.statistiques && (
                <li>Lignes vides : {importResult.statistiques.lignesVides}</li>
              )}
            </ul>
            {importResult.errors && importResult.errors.length > 0 && (
              <div className="mt-2 max-h-32 overflow-y-auto text-xs border-t border-red-200 pt-2">
                <p className="font-medium text-red-800 mb-1">
                  Détails des erreurs :
                </p>
                {importResult.errors.slice(0, 10).map((err, index) => (
                  <p key={index} className="text-red-600">
                    Ligne {err.ligne}: {err.erreurs.join(', ')}
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