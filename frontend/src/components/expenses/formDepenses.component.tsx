'use client';

import { useDepenses, DepensesResponse } from '@/hooks/useDepenses.hook';
import { useRef, useEffect } from 'react';
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
  typeDepense: Yup.string().oneOf(['Perso', 'Commune']).required('Requis'),
  categorie: Yup.string().required('Requis'),
  description: Yup.string().max(500, 'Doit contenir moins de 500 caractères'),
  commentaire: Yup.string(),
  estChargeFixe: Yup.boolean(),
});

interface DepenseFormValues {
  montant: number | string;
  date: string;
  typeCompte: 'Perso' | 'Conjoint';
  typeDepense: 'Perso' | 'Commune';
  categorie: string;
  description: string;
  commentaire: string;
  estChargeFixe: boolean;
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

  const formRef = useRef<HTMLFormElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (formRef.current) {
        firstInputRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
        if (firstInputRef.current) {
          firstInputRef.current.focus();
        }
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const initialValues: DepenseFormValues = existingDepense
    ? {
        montant: existingDepense.montant,
        date: existingDepense.date.split('T')[0],
        typeCompte: existingDepense.typeCompte,
        typeDepense: existingDepense.typeDepense,
        categorie:
          typeof existingDepense.categorie === 'string'
            ? existingDepense.categorie
            : existingDepense.categorie._id,
        commentaire: existingDepense.commentaire || '',
        description: existingDepense.description || '',
        estChargeFixe: existingDepense?.estChargeFixe ?? false,
      }
    : {
        montant: '',
        date: new Date().toISOString().split('T')[0],
        typeCompte: 'Perso',
        typeDepense: 'Perso',
        categorie: '',
        commentaire: '',
        description: '',
        estChargeFixe: false,
      };

  const handleSubmit = async (
    values: DepenseFormValues,
    { resetForm }: FormikHelpers<DepenseFormValues>,
  ) => {
    const isEditing = !!existingDepense;
    const url = isEditing
      ? `${depensesEndpoint}/${existingDepense._id}`
      : depensesEndpoint;
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const updatedOrNewDepense = await fetcher<IDepense>(url, {
        method,
        body: JSON.stringify(values),
      });

      refreshDepenses(
        (
          currentData: DepensesResponse | undefined,
        ): DepensesResponse | undefined => {
          if (!currentData) return currentData;

          let newDepensesArray: IDepense[];

          if (isEditing) {
            newDepensesArray = currentData.depenses.map((depense) =>
              depense._id === updatedOrNewDepense._id
                ? updatedOrNewDepense
                : depense,
            );
          } else {
            newDepensesArray = [updatedOrNewDepense, ...currentData.depenses];
          }

          const finalCacheData = {
            ...currentData,
            depenses: newDepensesArray,
          };
          return finalCacheData;
        },
      );

      resetForm();
      if (onClose) onClose();
      toast.success(isEditing ? 'Dépense modifiée !' : 'Dépense ajoutée !');
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
    <div
      key={existingDepense?._id || 'new'}
      className="bg-white p-6 rounded-lg shadow-md mb-6 relative"
    >
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
          <Form ref={formRef} className="space-y-4">
            <div>
              <label
                htmlFor="montant"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Montant (€)
              </label>
              <Field
                id="montant"
                type="number"
                name="montant"
                placeholder="10.50"
                className="input"
                step="0.01"
                innerRef={firstInputRef}
              />
              <ErrorMessage
                name="montant"
                component="div"
                className="text-red-500 text-sm mt-1"
              />
            </div>

            <div>
              <label
                htmlFor="date"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Date
              </label>
              <Field id="date" type="date" name="date" className="input" />
              <ErrorMessage
                name="date"
                component="div"
                className="text-red-500 text-sm mt-1"
              />
            </div>

            <div>
              <label
                htmlFor="typeCompte"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Compte
              </label>
              <Field
                as="select"
                id="typeCompte"
                name="typeCompte"
                className="input"
              >
                <option value="Perso">Perso</option>
                <option value="Conjoint">Conjoint</option>
                <option value="Commun">Commun</option>
              </Field>
              <ErrorMessage
                name="typeCompte"
                component="div"
                className="text-red-500 text-sm mt-1"
              />
            </div>

            <div>
              <label
                htmlFor="typeDepense"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Nature de la Dépense
              </label>
              <Field
                as="select"
                id="typeDepense"
                name="typeDepense"
                className="input"
              >
                <option value="Perso">Perso</option>
                <option value="Commune">Commune</option>
              </Field>
              <ErrorMessage
                name="typeDepense"
                component="div"
                className="text-red-500 text-sm mt-1"
              />
            </div>

            <div>
              <label
                htmlFor="categorie"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Catégorie
              </label>
              <Field
                as="select"
                id="categorie"
                name="categorie"
                className="input"
              >
                <option value="">Sélectionner une catégorie</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.nom}
                  </option>
                ))}
              </Field>
              <ErrorMessage
                name="categorie"
                component="div"
                className="text-red-500 text-sm mt-1"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Description
              </label>
              <Field
                id="description"
                type="text"
                name="description"
                className="input"
              />
              <ErrorMessage
                name="description"
                component="div"
                className="text-red-500 text-sm mt-1"
              />
            </div>

            <div>
              <label
                htmlFor="commentaire"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Commentaire
              </label>
              <Field
                id="commentaire"
                type="text"
                name="commentaire"
                placeholder="Optionnel"
                className="input"
              />
              <ErrorMessage
                name="commentaire"
                component="div"
                className="text-red-500 text-sm mt-1"
              />
            </div>

            <div className="flex items-center gap-2">
              <Field
                type="checkbox"
                name="estChargeFixe"
                id="estChargeFixe"
                className="form-checkbox h-5 w-5 text-indigo-600"
              />
              <label
                htmlFor="estChargeFixe"
                className="ml-2 text-sm text-gray-900"
              >
                Marquer comme charge fixe
              </label>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary flex-1"
              >
                {isSubmitting
                  ? existingDepense
                    ? 'Modification...'
                    : 'Ajout...'
                  : existingDepense
                    ? 'Modifier'
                    : 'Ajouter'}
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
