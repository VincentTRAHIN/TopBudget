'use client';

import { useCategories } from '@/hooks/useCategories.hook';
import { Formik, Form, Field, ErrorMessage, FormikHelpers } from 'formik';
import { toast } from 'react-hot-toast';
import * as Yup from 'yup';
import fetcher from '@/utils/fetcher.utils';
import { categoriesEndpoint } from '@/services/api.service';
import { ICategorie } from '@/types/categorie.type';
import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

const CategorieSchema = Yup.object().shape({
  nom: Yup.string().required('Nom requis'),
  description: Yup.string(),
});

interface FormCategorieProps {
  existingCategorie?: ICategorie;
  onClose: () => void;
}

interface CategorieFormValues {
  nom: string;
  description: string;
}

export default function FormCategorie({
  existingCategorie,
  onClose,
}: FormCategorieProps) {
  const { refreshCategories } = useCategories();

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

  const initialValues: CategorieFormValues = {
    nom: existingCategorie?.nom || '',
    description: existingCategorie?.description || '',
  };

  const handleSubmit = async (
    values: CategorieFormValues,
    { resetForm }: FormikHelpers<CategorieFormValues>,
  ) => {
    const payload = {
      ...values,
      nom: values.nom.trim(),
    };
    try {
      if (existingCategorie) {
        await fetcher(`${categoriesEndpoint}/${existingCategorie._id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        toast.success('Catégorie modifiée !');
      } else {
        await fetcher(categoriesEndpoint, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        toast.success('Catégorie ajoutée !');
      }
      refreshCategories();
      resetForm();
      onClose();
    } catch (error: unknown) {
      console.error(
        "Erreur lors de l'ajout/modification de la catégorie:",
        error,
      );
      if (error instanceof Error) {
        toast.error(
          error.message ||
            "Erreur lors de l'ajout/modification de la catégorie",
        );
      } else {
        toast.error(
          "Erreur inconnue lors de l'ajout/modification de la catégorie",
        );
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md relative">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
      >
        <X size={20} />
      </button>
      <h3 className="text-lg font-semibold mb-4">
        {existingCategorie ? 'Modifier la Catégorie' : 'Ajouter une Catégorie'}
      </h3>

      <Formik
        initialValues={initialValues}
        validationSchema={CategorieSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ isSubmitting }) => (
          <Form ref={formRef} className="space-y-4">
            <div>
              <label
                htmlFor="nom-cat"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Nom
              </label>
              <Field
                id="nom-cat"
                type="text"
                name="nom"
                placeholder="Nom de la catégorie"
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
                htmlFor="desc-cat"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Description
              </label>
              <Field
                id="desc-cat"
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

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary flex-1"
              >
                {isSubmitting
                  ? existingCategorie
                    ? 'Modification...'
                    : 'Ajout...'
                  : existingCategorie
                    ? 'Modifier'
                    : 'Ajouter'}
              </button>
              {existingCategorie && (
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
