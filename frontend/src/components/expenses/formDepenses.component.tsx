"use client";

import { useDepenses } from '@/hooks/useDepenses.hook';
import { useCategories } from '@/hooks/useCategories.hook';
import { IDepense } from '@/types/depense.type';
import { ICategorie } from '@/types/categorie.type'; 
import { Formik, Form, Field, ErrorMessage, FormikHelpers } from 'formik';
import { toast } from 'react-hot-toast';
import * as Yup from 'yup';
import fetcher from '@/utils/fetcher.utils'; 
import { depensesEndpoint } from '@/services/api.service';
import { X } from 'lucide-react';

const DepenseSchema = Yup.object().shape({
  montant: Yup.number().positive('Doit être positif').required('Requis'),
  date: Yup.date().required('Requis'),
  typeCompte: Yup.string()
    .oneOf(['Perso', 'Conjoint', 'Commun'])
    .required('Requis'),
  categorie: Yup.string().required('Requis'),
  commentaire: Yup.string(),
});

interface DepenseFormValues {
    montant: number | string; 
    date: string;
    typeCompte: 'Perso' | 'Conjoint' | 'Commun';
    categorie: string;
    commentaire: string;
}

export default function FormDepense({
  existingDepense,
  onClose,
}: {
  existingDepense?: IDepense;
  onClose?: () => void;
}) {
  const { refreshDepenses } = useDepenses();
  const { categories }: { categories: ICategorie[] } = useCategories();

  const initialValues: DepenseFormValues = existingDepense
    ? {
        montant: existingDepense.montant,
        date: existingDepense.date.split('T')[0],
        typeCompte: existingDepense.typeCompte,
        categorie:
          typeof existingDepense.categorie === 'string'
            ? existingDepense.categorie
            : existingDepense.categorie._id,
        commentaire: existingDepense.commentaire || '',
      }
    : {
        montant: '',
        date: new Date().toISOString().split('T')[0],
        typeCompte: 'Perso',
        categorie: '',
        commentaire: '',
      };

  const handleSubmit = async (values: DepenseFormValues, { resetForm }: FormikHelpers<DepenseFormValues>) => {
    try {
      const url = existingDepense ? `${depensesEndpoint}/${existingDepense._id}` : depensesEndpoint;
      const method = existingDepense ? "PUT" : "POST";

      await fetcher(url, {
        method,
        body: JSON.stringify(values),
      });

      refreshDepenses();
      resetForm();
      if (onClose) onClose();
      toast.success(existingDepense ? "Dépense modifiée !" : "Dépense ajoutée !");

    } catch (error: unknown) {
      console.error("Erreur lors de l'envoi:", error);
      if (error instanceof Error) {
        toast.error(error.message || "Erreur lors de l'envoi");
      } else {
        toast.error("Erreur inconnue lors de l'envoi");
      }
    }
  };

  return (
    <div key={existingDepense?._id || 'new'} className="bg-white p-6 rounded-lg shadow-md mb-6 relative">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
      >
        <X size={20} />
      </button>
      <h3 className="text-lg font-semibold mb-4">
        {existingDepense ? 'Modifier la Dépense' : 'Ajouter une Dépense'}
      </h3>

      <Formik
        initialValues={initialValues}
        validationSchema={DepenseSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ isSubmitting }) => (
          <Form className="space-y-4">
            <div>
              <label htmlFor="montant" className="block text-sm font-medium text-gray-700 mb-1">Montant (€)</label>
              <Field
                id="montant"
                type="number"
                name="montant"
                placeholder="10.50"
                className="input"
                step="0.01"
              />
              <ErrorMessage name="montant" component="div" className="text-red-500 text-sm mt-1" />
            </div>

            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <Field id="date" type="date" name="date" className="input" />
              <ErrorMessage name="date" component="div" className="text-red-500 text-sm mt-1" />
            </div>

            <div>
              <label htmlFor="typeCompte" className="block text-sm font-medium text-gray-700 mb-1">Compte</label>
              <Field as="select" id="typeCompte" name="typeCompte" className="input">
                <option value="Perso">Perso</option>
                <option value="Conjoint">Conjoint</option>
                <option value="Commun">Commun</option>
              </Field>
              <ErrorMessage name="typeCompte" component="div" className="text-red-500 text-sm mt-1" />
            </div>

            <div>
              <label htmlFor="categorie" className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
              <Field as="select" id="categorie" name="categorie" className="input">
                <option value="">Sélectionner une catégorie</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.nom}
                  </option>
                ))}
              </Field>
              <ErrorMessage name="categorie" component="div" className="text-red-500 text-sm mt-1" />
            </div>

            <div>
              <label htmlFor="commentaire" className="block text-sm font-medium text-gray-700 mb-1">Commentaire</label>
              <Field
                id="commentaire"
                type="text"
                name="commentaire"
                placeholder="Optionnel"
                className="input"
              />
              <ErrorMessage name="commentaire" component="div" className="text-red-500 text-sm mt-1" />
            </div>

            <div className="flex gap-4">
                 <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary flex-1"
                 >
                    {isSubmitting ? (existingDepense ? 'Modification...' : 'Ajout...') : (existingDepense ? 'Modifier' : 'Ajouter')}
                 </button>
                 {existingDepense && onClose && (
                    <button
                        type="button"
                        onClick={onClose}
                        className="bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-400 transition duration-300 flex-1"
                    >
                        Annuler
                    </button>
                 )}
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}