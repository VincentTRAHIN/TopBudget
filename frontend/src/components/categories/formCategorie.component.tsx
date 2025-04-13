"use client";

import { useCategories } from "@/hooks/useCategories.hook";
import { Formik, Form, Field, ErrorMessage, FormikHelpers } from "formik";
import { toast } from "react-hot-toast";
import * as Yup from "yup";
import fetcher from '@/utils/fetcher.utils'; // Import fetcher
import { categoriesEndpoint } from '@/services/api.service'; // Import endpoint URL

const CategorieSchema = Yup.object().shape({
  nom: Yup.string().required("Nom requis"),
  description: Yup.string(),
});

// Définir un type plus précis pour les valeurs du formulaire si nécessaire
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

  // Utiliser le type FormikHelpers avec le type des valeurs
  const handleSubmit = async (values: CategorieFormValues, { resetForm }: FormikHelpers<CategorieFormValues>) => {
    try {
      // Remplacer fetch par fetcher
      await fetcher(categoriesEndpoint, { // Utiliser l'URL importée
        method: "POST",
        // headers: { 'Content-Type': 'application/json' }, // fetcher gère Content-Type si body existe
        body: JSON.stringify(values),
      });

      // Si fetcher ne lance pas d'erreur, c'est un succès
      refreshCategories();
      resetForm();
      toast.success("Catégorie ajoutée !");

    } catch (error: unknown) { // Le catch reçoit l'erreur lancée par fetcher
      console.error("Erreur lors de l'ajout de la catégorie:", error);
      // Vérifier si l'erreur est un objet avec un message
      if (error instanceof Error) {
        toast.error(error.message || "Erreur lors de l'ajout de la catégorie");
      } else {
        toast.error("Erreur inconnue lors de l'ajout de la catégorie");
      }
    }
    // 'finally' n'est plus nécessaire ici car isSubmitting est géré par Formik
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