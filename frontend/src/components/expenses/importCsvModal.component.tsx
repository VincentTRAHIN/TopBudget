"use client";

import ImportCsvModalBase from "@/components/shared/ImportCsvModalBase";
import { useDepenses } from "@/hooks/useDepenses.hook";
import { importDepensesEndpoint } from "@/services/api.service";

interface ImportCsvModalProps {
  onClose: () => void;
}

const ExpensesFormatInstructions = () => (
  <>
    <p>
      <strong>Format attendu :</strong>
    </p>
    <ul className="list-disc list-inside ml-4">
      <li>Séparateur : Point-Virgule (;)</li>
      <li>Encodage : UTF-8</li>
      <li>
        En-têtes (insensible à la casse, ordre indifférent) :<code>Date</code>, <code>Montant</code>,{" "}
        <code>Categorie</code>,<code>Description</code> (optionnel),
        <code>TypeCompte</code> (optionnel, défaut &quot;Perso&quot;),
        <code>TypeDepense</code> (optionnel),
        <code>Commentaire</code> (optionnel)
      </li>
      <li>
        Format Date : <code>JJ/MM/AAAA</code> (ex: 31/12/2023)
      </li>
      <li>Format Montant : Nombre avec point ou virgule comme séparateur décimal (ex: 10.50 ou 10,50)</li>
      <li>
        TypeCompte : <code>Perso</code>, <code>Conjoint</code> ou <code>Commun</code> (optionnel, défaut
        &quot;Perso&quot;)
      </li>
      <li>
        TypeDepense : <code>Perso</code> ou <code>Commune</code> (optionnel)
      </li>
      <li>Categorie : Nom de la catégorie (sera créée automatiquement si elle n'existe pas)</li>
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
