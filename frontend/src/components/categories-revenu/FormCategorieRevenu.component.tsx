'use client';

import { useCategoriesRevenu } from '@/hooks/useCategoriesRevenu.hook';
import { Formik, Form, Field, ErrorMessage, FormikHelpers } from 'formik';
import { toast } from 'react-hot-toast';
import * as Yup from 'yup';
import fetcher from '@/utils/fetcher.utils';
import { categoriesRevenuEndpoint } from '@/services/api.service';
import {
  ICategorieRevenu,
  CategorieRevenuPayload,
} from '@/types/categorieRevenu.type';
import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

const CategorieRevenuSchema = Yup.object().shape({
  nom: Yup.string().required('Nom requis'),
  description: Yup.string(),
  image: Yup.string().url('URL invalide').nullable(),
});

interface FormCategorieRevenuProps {
  existingCategorieRevenu?: ICategorieRevenu;
  onClose: () => void;
}

interface CategorieRevenuFormValues {
  nom: string;
  description: string;
  image?: string;
}

export default function FormCategorieRevenu({
  existingCategorieRevenu,
  onClose,
}: FormCategorieRevenuProps) {
  const { refreshCategoriesRevenu } = useCategoriesRevenu();

  const formRef = useRef<HTMLFormElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (formRef.current) {
        formRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      if (firstInputRef.current) {
        firstInputRef.current.focus();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const initialValues: CategorieRevenuFormValues = {
    nom: existingCategorieRevenu?.nom || '',
    description: existingCategorieRevenu?.description || '',
    image: existingCategorieRevenu?.image || '',
  };

  const handleSubmit = async (
    values: CategorieRevenuFormValues,
    { resetForm }: FormikHelpers<CategorieRevenuFormValues>,
  ) => {
    const payload: CategorieRevenuPayload = {
      nom: values.nom.trim(),
      description: values.description,
      image: values.image || undefined,
    };
    try {
      if (existingCategorieRevenu) {
        await fetcher(
          `${categoriesRevenuEndpoint}/${existingCategorieRevenu._id}`,
          {
            method: 'PUT',
            body: JSON.stringify(payload),
          },
        );
        toast.success('Catégorie de revenu modifiée !');
      } else {
        await fetcher(categoriesRevenuEndpoint, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        toast.success('Catégorie de revenu ajoutée !');
      }
      refreshCategoriesRevenu();
      resetForm();
      onClose();
    } catch (error: unknown) {
      console.error(
        "Erreur lors de l'ajout/modification de la catégorie de revenu:",
        error,
      );
      if (error instanceof Error) {
        toast.error(
          error.message ||
            "Erreur lors de l'ajout/modification de la catégorie de revenu",
        );
      } else {
        toast.error(
          "Erreur inconnue lors de l'ajout/modification de la catégorie de revenu",
        );
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md relative">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        aria-label="Fermer"
      >
        <X size={20} />
      </button>
      <h3 className="text-lg font-semibold mb-4">
        {existingCategorieRevenu
          ? 'Modifier la Catégorie de Revenu'
          : 'Ajouter une Catégorie de Revenu'}
      </h3>
      <Formik
        initialValues={initialValues}
        validationSchema={CategorieRevenuSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ isSubmitting }) => (
          <Form ref={formRef} className="space-y-4">
            <div>
              <label
                htmlFor="nom-cat-rev"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Nom
              </label>
              <Field
                id="nom-cat-rev"
                type="text"
                name="nom"
                placeholder="Nom de la catégorie de revenu"
                className="input"
                innerRef={firstInputRef}
              />
              <ErrorMessage
                name="nom"
                component="div"
                className="text-red-500 text-sm mt-1"
              />
            </div>
            <div>
              <label
                htmlFor="desc-cat-rev"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Description
              </label>
              <Field
                id="desc-cat-rev"
                type="text"
                name="description"
                placeholder="Optionnel"
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
                htmlFor="image-cat-rev"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Image (URL, optionnel)
              </label>
              <Field
                id="image-cat-rev"
                type="text"
                name="image"
                placeholder="https://..."
                className="input"
              />
              <ErrorMessage
                name="image"
                component="div"
                className="text-red-500 text-sm mt-1"
              />
            </div>
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary flex-1"
              >
                {isSubmitting
                  ? existingCategorieRevenu
                    ? 'Modification...'
                    : 'Ajout...'
                  : existingCategorieRevenu
                    ? 'Modifier'
                    : 'Ajouter'}
              </button>
              {existingCategorieRevenu && (
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
