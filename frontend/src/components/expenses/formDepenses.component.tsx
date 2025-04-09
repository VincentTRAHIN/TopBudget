import { useDepenses } from '@/hooks/useDepenses.hook';
import { useCategories } from '@/hooks/useCategories.hook';
import { IDepense } from '@/types/depense.type';
import { Formik, Form, Field, ErrorMessage, FormikHelpers } from 'formik';
import { toast } from 'react-hot-toast';
import * as Yup from 'yup';

const DepenseSchema = Yup.object().shape({
  montant: Yup.number().positive('Doit être positif').required('Requis'),
  date: Yup.date().required('Requis'),
  typeCompte: Yup.string()
    .oneOf(['Perso', 'Conjoint', 'Commun'])
    .required('Requis'),
  categorie: Yup.string().required('Requis'),
  commentaire: Yup.string(),
});

export default function FormDepense({
  existingDepense,
  onClose,
}: {
  existingDepense?: IDepense;
  onClose?: () => void;
}) {
  const { refreshDepenses } = useDepenses();
  const { categories } = useCategories();

  const initialValues = existingDepense
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

      const handleSubmit = async (values: typeof initialValues, { resetForm }: FormikHelpers<typeof initialValues>) => {
        try {
          const url = existingDepense ? `/api/depenses/${existingDepense._id}` : "/api/depenses";
          const method = existingDepense ? "PUT" : "POST";
      
          const response = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(values),
          });
      
          if (!response.ok) {
            throw new Error("Erreur");
          }
      
          refreshDepenses();
          resetForm();
          if (onClose) onClose();
          toast.success(existingDepense ? "Dépense modifiée !" : "Dépense ajoutée !");
        } catch (error) {
          console.error(error);
          toast.error("Erreur lors de l'envoi");
        }
      };
      

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Ajouter une Dépense</h3>

      <Formik
        initialValues={initialValues}
        validationSchema={DepenseSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting }) => (
          <Form className="space-y-4">
            <div>
              <Field
                type="number"
                name="montant"
                placeholder="Montant (€)"
                className="input"
              />
              <ErrorMessage
                name="montant"
                component="div"
                className="text-red-500 text-sm"
              />
            </div>

            <div>
              <Field type="date" name="date" className="input" />
              <ErrorMessage
                name="date"
                component="div"
                className="text-red-500 text-sm"
              />
            </div>

            <div>
              <Field as="select" name="typeCompte" className="input">
                <option value="Perso">Perso</option>
                <option value="Conjoint">Conjoint</option>
                <option value="Commun">Commun</option>
              </Field>
              <ErrorMessage
                name="typeCompte"
                component="div"
                className="text-red-500 text-sm"
              />
            </div>

            <div>
              <Field as="select" name="categorie" className="input">
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
                className="text-red-500 text-sm"
              />
            </div>

            <div>
              <Field
                type="text"
                name="commentaire"
                placeholder="Commentaire (optionnel)"
                className="input"
              />
              <ErrorMessage
                name="commentaire"
                component="div"
                className="text-red-500 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
            >
              {isSubmitting ? 'Ajout...' : 'Ajouter'}
            </button>
          </Form>
        )}
      </Formik>
    </div>
  );
}
