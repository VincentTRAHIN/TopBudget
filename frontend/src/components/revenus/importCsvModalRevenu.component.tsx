'use client';

import { importRevenusEndpoint } from '@/services/api.service';
import { useRevenus } from '@/hooks/useRevenus.hook';
import ImportCsvModalBase from '@/components/shared/ImportCsvModalBase';

interface ImportCsvModalRevenuProps {
  onClose: () => void;
}

const RevenusFormatInstructions = () => (
  <>
    <p>
      <strong>Format attendu :</strong>
    </p>
    <ul className="list-disc list-inside ml-4">
      <li>Séparateur : Virgule (,)</li>
      <li>Encodage : UTF-8</li>
      <li>
        En-têtes (insensible à la casse, ordre indifférent) :
        <code>Date</code>, <code>Montant</code>, <code>Description</code>,
        <code>CategorieRevenu</code> (ID ou nom exact, requis),
        <code>TypeCompte</code> (optionnel, défaut &quot;Perso&quot;),
        <code>Commentaire</code> (optionnel),
        <code>EstRecurrent</code> (optionnel, true/false ou 1/0)
      </li>
      <li>
        Format Date : <code>JJ/MM/AAAA</code> (ex: 31/12/2023)
      </li>
      <li>
        Format Montant : Nombre avec point ou virgule comme séparateur
        décimal (ex: 10.50 ou 10,50)
      </li>
      <li>
        TypeCompte : <code>Perso</code> ou <code>Conjoint</code>{' '}
        (optionnel, défaut &quot;Perso&quot;)
      </li>
      <li>
        CategorieRevenu : ID MongoDB de la catégorie de revenu (ou nom
        exact si supporté par le backend)
      </li>
      <li>
        EstRecurrent : <code>true</code>, <code>false</code>,{' '}
        <code>1</code> ou <code>0</code> (optionnel, défaut false)
      </li>
    </ul>
  </>
);

export default function ImportCsvModalRevenu({
  onClose,
}: ImportCsvModalRevenuProps) {
  const { refreshRevenus } = useRevenus();

  return (
    <ImportCsvModalBase
      onClose={onClose}
      modalTitle="Importer des Revenus (CSV)"
      endpoint={importRevenusEndpoint}
      onImportSuccess={refreshRevenus}
      formatInstructions={<RevenusFormatInstructions />}
      importedItemLabel="Revenus importés"
      inputId="csv-file-input-revenu"
    />
  );
}
