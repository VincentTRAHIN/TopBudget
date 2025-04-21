"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth.hook";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import AuthNav from "@/components/auth/authNav.component";
import { toast } from "react-hot-toast";

const LoginSchema = Yup.object().shape({
  email: Yup.string().email("Email invalide").required("Requis"),
  motDePasse: Yup.string().required("Requis"),
});

export default function LoginPage() {
  const router = useRouter();
  const { login, loadingAction } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <AuthNav />
      <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Connexion</h1>

        <Formik
          initialValues={{ email: "", motDePasse: "" }}
          validationSchema={LoginSchema}
          onSubmit={async (values, { setSubmitting }) => {
            try {
              await login(values.email, values.motDePasse);
              toast.success("Connexion réussie");
              router.push("/");
            } catch {
              toast.error("Identifiants incorrects");
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ isSubmitting }) => (
            <Form className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <Field
                  type="email"
                  name="email"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3"
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
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3"
                />
                <ErrorMessage name="motDePasse" component="div" className="text-red-500 text-sm" />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || loadingAction}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {isSubmitting ? "Connexion..." : "Se connecter"}
              </button>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}
