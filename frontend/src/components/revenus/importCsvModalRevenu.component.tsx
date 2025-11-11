"use client";

import ImportCsvModalBase from "@/components/shared/ImportCsvModalBase";
import { useRevenus } from "@/hooks/useRevenus.hook";
import { importRevenusEndpoint } from "@/services/api.service";

interface ImportCsvModalRevenuProps {
  onClose: () => void;
}

const RevenusFormatInstructions = () => (
  <>
    <p>
      <strong>Format attendu :</strong>
    </p>
    <ul className="list-disc list-inside ml-4">
      <li>Séparateur : Point-Virgule (;)</li>
      <li>Encodage : UTF-8</li>
      <li>
        En-têtes (insensible à la casse, ordre indifférent) :<br />
        <strong>Requis :</strong> <code>Date</code>, <code>Montant</code>, <code>CategorieRevenu</code>
        <br />
        <strong>Optionnels :</strong> <code>Description</code>, <code>TypeCompte</code> (défaut &quot;Perso&quot;),
        <code>Commentaire</code>, <code>EstRecurrent</code> (défaut false)
      </li>
      <li>
        Format Date : <code>JJ/MM/AAAA</code> (ex: 31/12/2023)
      </li>
      <li>Format Montant : Nombre avec point ou virgule comme séparateur décimal (ex: 10.50 ou 10,50)</li>
      <li>
        TypeCompte : <code>Perso</code> ou <code>Conjoint</code> (optionnel, défaut &quot;Perso&quot;)
      </li>
      <li>CategorieRevenu : Nom de la catégorie de revenu (sera créée automatiquement si elle n'existe pas)</li>
      <li>
        EstRecurrent : <code>true</code>, <code>false</code>, <code>1</code> ou <code>0</code> (optionnel, défaut false)
      </li>
      <li>
        <strong>Aliases acceptés :</strong> CategorieRevenu peut aussi être nommé
        <code>Categorie</code>, TypeCompte peut être <code>Compte</code>, etc.
      </li>
    </ul>
  </>
);

export default function ImportCsvModalRevenu({ onClose }: ImportCsvModalRevenuProps) {
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
