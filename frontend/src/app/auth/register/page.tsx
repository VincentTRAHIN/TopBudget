"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth.hook";
import { Formik, Form, Field, ErrorMessage, FormikHelpers } from "formik";
import * as Yup from "yup";
import AuthNav from "@/components/auth/authNav.component";
import { UserRegisterPayload } from "@/types/user.type";

const RegisterSchema = Yup.object().shape({
  nom: Yup.string().required("Requis"),
  email: Yup.string().email("Email invalide").required("Requis"),
  motDePasse: Yup.string().min(6, "6 caractères minimum").required("Requis"),
});

export default function RegisterPage() {
  const router = useRouter();
  const { register, loadingAction } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <AuthNav />
      <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Inscription</h1>

        <Formik
          initialValues={{ nom: "", email: "", motDePasse: "" }}
          validationSchema={RegisterSchema}
          onSubmit={async (
            values: UserRegisterPayload,
            { setSubmitting }: FormikHelpers<UserRegisterPayload>
          ) => {
            try {
              await register(values.nom, values.email, values.motDePasse);
              router.push("/auth/login");
            } catch (error) {
              console.error(error);
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ isSubmitting }) => (
            <Form className="space-y-4">
              <div>
                <label htmlFor="nom" className="block text-sm font-medium text-gray-700">
                  Nom
                </label>
                <Field
                  type="text"
                  name="nom"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-1"
                />
                <ErrorMessage name="nom" component="div" className="text-red-500 text-sm" />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <Field
                  type="email"
                  name="email"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-1"
                />
                <ErrorMessage name="email" component="div" className="text-red-500 text-sm" />
              </div>

              <div>
                <label htmlFor="motDePasse" className="block text-sm font-medium text-gray-700">
                  Mot de passe
                </label>
                <Field
                  type="password"
                  name="motDePasse"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-1"
                />
                <ErrorMessage name="motDePasse" component="div" className="text-red-500 text-sm" />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || loadingAction}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {isSubmitting ? "Inscription..." : "S'inscrire"}
              </button>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}
