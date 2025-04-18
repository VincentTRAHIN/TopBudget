"use client";

import { useAuth } from "@/hooks/useAuth.hook";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useRouter } from "next/navigation";

const LoginSchema = Yup.object().shape({
  email: Yup.string().email("Email invalide").required("Requis"),
  motDePasse: Yup.string().required("Requis"),
});

export default function LoginPage() {
  const { login, loadingAction } = useAuth();
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Connexion</h2>

        <Formik
          initialValues={{ email: "", motDePasse: "" }}
          validationSchema={LoginSchema}
          onSubmit={async (values, { setSubmitting }) => {
            try {
              await login(values.email, values.motDePasse);
              router.push("/dashboard");
            } catch (error) {
              console.error(error);
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ isSubmitting }) => (
            <Form className="flex flex-col space-y-4">
              <div>
                <Field
                  type="email"
                  name="email"
                  placeholder="Email"
                  className="input"
                />
                <ErrorMessage name="email" component="div" className="text-red-500 text-sm" />
              </div>

              <div>
                <Field
                  type="password"
                  name="motDePasse"
                  placeholder="Mot de passe"
                  className="input"
                />
                <ErrorMessage name="motDePasse" component="div" className="text-red-500 text-sm" />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || loadingAction}
                className="btn-primary"
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
