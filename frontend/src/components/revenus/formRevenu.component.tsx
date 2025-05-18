'use client';

import { useRef, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage, FormikHelpers } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-hot-toast';
import fetcher from '@/utils/fetcher.utils';
import { X } from 'lucide-react';
import { useRevenus } from '@/hooks/useRevenus.hook';
import { IRevenu } from '@/types/revenu.type';
import { revenusEndpoint } from '@/services/api.service';
import { useCategoriesRevenu } from '@/hooks/useCategoriesRevenu.hook';
import { ICategorieRevenu } from '@/types/categorieRevenu.type';

const RevenuSchema = Yup.object().shape({
  montant: Yup.number()
    .typeError('Doit être un nombre')
    .positive('Doit être positif')
    .required('Requis'),
  description: Yup.string().required('Requis'),
  date: Yup.string().required('Requis'),
  typeCompte: Yup.string().oneOf(['Perso', 'Conjoint']).required('Requis'),
  commentaire: Yup.string(),
  categorieRevenu: Yup.string().required('Catégorie de revenu requise'),
  estRecurrent: Yup.boolean(),
});

interface RevenuFormValues {
  montant: number | string;
  description: string;
  date: string;
  typeCompte: 'Perso' | 'Conjoint';
  commentaire?: string;
  categorieRevenu: string;
  estRecurrent: boolean;
}

export default function FormRevenu({
  existingRevenu,
  onClose,
}: {
  existingRevenu?: IRevenu;
  onClose?: () => void;
}) {
  const { refreshRevenus } = useRevenus();
  const { categoriesRevenu } = useCategoriesRevenu();
  const formRef = useRef<HTMLFormElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  const initialValues: RevenuFormValues = existingRevenu
    ? {
        montant: existingRevenu.montant,
        description: existingRevenu.description,
        date: existingRevenu.date.slice(0, 10),
        typeCompte: existingRevenu.typeCompte,
        commentaire: existingRevenu.commentaire || '',
        categorieRevenu:
          typeof existingRevenu.categorieRevenu === 'object'
            ? existingRevenu.categorieRevenu._id
            : existingRevenu.categorieRevenu || '',
        estRecurrent: existingRevenu.estRecurrent ?? false,
      }
    : {
        montant: '',
        description: '',
        date: new Date().toISOString().slice(0, 10),
        typeCompte: 'Perso',
        commentaire: '',
        categorieRevenu: '',
        estRecurrent: false,
      };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (formRef.current) {
        firstInputRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
        firstInputRef.current?.focus();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (
    values: RevenuFormValues,
    { resetForm }: FormikHelpers<RevenuFormValues>,
  ) => {
    const isEdit = !!existingRevenu;
    const url = isEdit
      ? `${revenusEndpoint}/${existingRevenu?._id}`
      : revenusEndpoint;
    const method = isEdit ? 'PUT' : 'POST';
    try {
      await fetcher(url, {
        method,
        body: JSON.stringify(values),
      });
      await refreshRevenus();
      toast.success(
        isEdit ? 'Revenu modifié avec succès' : 'Revenu ajouté avec succès',
      );
      onClose?.();
      resetForm();
    } catch (error: unknown) {
      toast.error(
        (error as Error)?.message ||
          "Erreur lors de l'enregistrement du revenu",
      );
    }
  };

  return (
    <div className="relative bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto">
      <button
        type="button"
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
        onClick={onClose}
        aria-label="Fermer"
      >
        <X size={20} />
      </button>
      <Formik
        initialValues={initialValues}
        validationSchema={RevenuSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ isSubmitting }) => (
          <Form ref={formRef} className="space-y-4">
            <div>
              <label
                htmlFor="montant"
                className="block text-sm font-medium text-gray-700"
              >
                Montant
              </label>
              <Field
                innerRef={firstInputRef}
                name="montant"
                type="number"
                step="0.01"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Montant du revenu"
              />
              <ErrorMessage
                name="montant"
                component="div"
                className="text-red-500 text-xs mt-1"
              />
            </div>
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700"
              >
                Description
              </label>
              <Field
                name="description"
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Ex: Salaire, CAF, etc."
              />
              <ErrorMessage
                name="description"
                component="div"
                className="text-red-500 text-xs mt-1"
              />
            </div>
            <div>
              <label
                htmlFor="date"
                className="block text-sm font-medium text-gray-700"
              >
                Date
              </label>
              <Field
                name="date"
                type="date"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <ErrorMessage
                name="date"
                component="div"
                className="text-red-500 text-xs mt-1"
              />
            </div>
            <div>
              <label
                htmlFor="typeCompte"
                className="block text-sm font-medium text-gray-700"
              >
                Type de compte
              </label>
              <Field
                as="select"
                name="typeCompte"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="Perso">Perso</option>
                <option value="Conjoint">Conjoint</option>
              </Field>
              <ErrorMessage
                name="typeCompte"
                component="div"
                className="text-red-500 text-xs mt-1"
              />
            </div>
            <div>
              <label
                htmlFor="categorieRevenu"
                className="block text-sm font-medium text-gray-700"
              >
                Catégorie de Revenu
              </label>
              <Field
                as="select"
                name="categorieRevenu"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Sélectionner une catégorie</option>
                {categoriesRevenu.map((cat: ICategorieRevenu) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.nom}
                  </option>
                ))}
              </Field>
              <ErrorMessage
                name="categorieRevenu"
                component="div"
                className="text-red-500 text-xs mt-1"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Field
                type="checkbox"
                name="estRecurrent"
                id="estRecurrentRevenu"
              />
              <label
                htmlFor="estRecurrentRevenu"
                className="text-sm font-medium text-gray-700"
              >
                Marquer comme revenu récurrent/fixe
              </label>
            </div>
            <div>
              <label
                htmlFor="commentaire"
                className="block text-sm font-medium text-gray-700"
              >
                Commentaire
              </label>
              <Field
                name="commentaire"
                as="textarea"
                rows={2}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Commentaire (optionnel)"
              />
              <ErrorMessage
                name="commentaire"
                component="div"
                className="text-red-500 text-xs mt-1"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {existingRevenu ? 'Modifier' : 'Ajouter'}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}
