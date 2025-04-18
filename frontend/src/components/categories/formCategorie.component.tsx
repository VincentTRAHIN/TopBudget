"use client";

import { useCategories } from "@/hooks/useCategories.hook";
import { Formik, Form, Field, ErrorMessage, FormikHelpers } from "formik";
import { toast } from "react-hot-toast";
import * as Yup from "yup";
import fetcher from '@/utils/fetcher.utils';
import { categoriesEndpoint } from '@/services/api.service';

const CategorieSchema = Yup.object().shape({
  nom: Yup.string().required("Nom requis"),
  description: Yup.string(),
});

interface CategorieFormValues {
    nom: string;
    description: string;
}

export default function FormCategorie() {
  const { refreshCategories } = useCategories();

  const initialValues: CategorieFormValues = {
    nom: "",
    description: "",
  };

  const handleSubmit = async (values: CategorieFormValues, { resetForm }: FormikHelpers<CategorieFormValues>) => {
    try {
      await fetcher(categoriesEndpoint, {
        method: "POST",
        body: JSON.stringify(values),
      });

      refreshCategories();
      resetForm();
      toast.success("Catégorie ajoutée !");

    } catch (error: unknown) {
      console.error("Erreur lors de l'ajout de la catégorie:", error);
      if (error instanceof Error) {
        toast.error(error.message || "Erreur lors de l'ajout de la catégorie");
      } else {
        toast.error("Erreur inconnue lors de l'ajout de la catégorie");
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Ajouter une Catégorie</h3>

      <Formik
        initialValues={initialValues}
        validationSchema={CategorieSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting }) => (
          <Form className="space-y-4">
            <div>
              <Field
                type="text"
                name="nom"
                placeholder="Nom de la catégorie"
                className="input"
              />
              <ErrorMessage name="nom" component="div" className="text-red-500 text-sm" />
            </div>

            <div>
              <Field
                type="text"
                name="description"
                placeholder="Description (optionnel)"
                className="input"
              />
              <ErrorMessage name="description" component="div" className="text-red-500 text-sm" />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
            >
              {isSubmitting ? "Ajout..." : "Ajouter Catégorie"}
            </button>
          </Form>
        )}
      </Formik>
    </div>
  );
}