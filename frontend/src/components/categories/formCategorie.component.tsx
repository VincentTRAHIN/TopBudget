import { useCategories } from "@/hooks/useCategories.hook";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { toast } from "react-hot-toast";
import * as Yup from "yup";

const CategorieSchema = Yup.object().shape({
  nom: Yup.string().required("Nom requis"),
  description: Yup.string(),
});

export default function FormCategorie() {
  const { refreshCategories } = useCategories();

  const initialValues = {
    nom: "",
    description: "",
  };

  const handleSubmit = async (values: typeof initialValues, { resetForm }: import("formik").FormikHelpers<typeof initialValues>) => {
    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la création de la catégorie");
      }

      refreshCategories();
      resetForm();
      toast.success("Catégorie ajoutée !");
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de l'ajout de la catégorie");
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
