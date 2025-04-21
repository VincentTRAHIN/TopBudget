"use client";

import { useCategories } from "@/hooks/useCategories.hook";
import { useFormik } from "formik";
import { toast } from "react-hot-toast";
import * as Yup from "yup";
import fetcher from '@/utils/fetcher.utils';
import { categoriesEndpoint } from '@/services/api.service';
import { ICategorie } from "@/types/categorie.type";
import { useEffect } from "react";
import { X } from "lucide-react";

const CategorieSchema = Yup.object().shape({
  nom: Yup.string().required("Nom requis"),
  description: Yup.string(),
});

interface FormCategorieProps {
  existingCategorie?: ICategorie;
  onClose: () => void;
}

export default function FormCategorie({ existingCategorie, onClose }: FormCategorieProps) {
  const { refreshCategories } = useCategories();

  const formik = useFormik({
    initialValues: {
      nom: existingCategorie?.nom || "",
      description: existingCategorie?.description || "",
    },
    validationSchema: CategorieSchema,
    onSubmit: async (values, { resetForm }) => {
      try {
        if (existingCategorie) {
          await fetcher(`${categoriesEndpoint}/${existingCategorie._id}`, {
            method: "PUT",
            body: JSON.stringify(values),
          });
          toast.success("Catégorie modifiée !");
        } else {
          await fetcher(categoriesEndpoint, {
            method: "POST",
            body: JSON.stringify(values),
          });
          toast.success("Catégorie ajoutée !");
        }

        refreshCategories();
        resetForm();
        onClose();
      } catch (error: unknown) {
        console.error("Erreur lors de l'ajout/modification de la catégorie:", error);
        if (error instanceof Error) {
          toast.error(error.message || "Erreur lors de l'ajout/modification de la catégorie");
        } else {
          toast.error("Erreur inconnue lors de l'ajout/modification de la catégorie");
        }
      }
    },
  });

  useEffect(() => {
    if (existingCategorie) {
      formik.setValues({
        nom: existingCategorie.nom,
        description: existingCategorie.description || "",
      });
    } else {
      formik.setValues({
        nom: "",
        description: "",
      });
    }
  }, [existingCategorie]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md relative">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
      >
        <X size={20} />
      </button>
      <h3 className="text-lg font-semibold mb-4">
        {existingCategorie ? "Modifier la Catégorie" : "Ajouter une Catégorie"}
      </h3>

      <form onSubmit={formik.handleSubmit} className="space-y-4">
        <div>
          <input
            type="text"
            name="nom"
            placeholder="Nom de la catégorie"
            className="input"
            value={formik.values.nom}
            onChange={formik.handleChange}
          />
          {formik.errors.nom && (
            <div className="text-red-500 text-sm">{formik.errors.nom}</div>
          )}
        </div>

        <div>
          <input
            type="text"
            name="description"
            placeholder="Description (optionnel)"
            className="input"
            value={formik.values.description}
            onChange={formik.handleChange}
          />
          {formik.errors.description && (
            <div className="text-red-500 text-sm">{formik.errors.description}</div>
          )}
        </div>

        <button
          type="submit"
          disabled={formik.isSubmitting}
          className="btn-primary"
        >
          {formik.isSubmitting
            ? existingCategorie
              ? "Modification..."
              : "Ajout..."
            : existingCategorie
            ? "Modifier"
            : "Ajouter Catégorie"}
        </button>
      </form>
    </div>
  );
}