'use client';

import { importDepensesEndpoint } from '@/services/api.service';
import { useDepenses } from '@/hooks/useDepenses.hook';
import ImportCsvModalBase from '@/components/shared/ImportCsvModalBase';

interface ImportCsvModalProps {
  onClose: () => void;
}

const ExpensesFormatInstructions = () => (
  <>
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
  </>
);

export default function ImportCsvModal({ onClose }: ImportCsvModalProps) {
  const { refreshDepenses } = useDepenses();

  return (
    <ImportCsvModalBase
      onClose={onClose}
      modalTitle="Importer des Dépenses (CSV)"
      endpoint={importDepensesEndpoint}
      onImportSuccess={refreshDepenses}
      formatInstructions={<ExpensesFormatInstructions />}
      importedItemLabel="Dépenses importées"
      inputId="csv-file-input"
    />
  );
}
