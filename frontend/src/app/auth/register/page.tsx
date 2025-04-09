"use client";

import { useAuth } from "@/hooks/useAuth.hook";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useRouter } from "next/navigation";

const RegisterSchema = Yup.object().shape({
  nom: Yup.string().required("Requis"),
  email: Yup.string().email("Email invalide").required("Requis"),
  motDePasse: Yup.string().min(6, "6 caractères minimum").required("Requis"),
});

export default function RegisterPage() {
  const { register, loading } = useAuth();
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Inscription</h2>

        <Formik
          initialValues={{ nom: "", email: "", motDePasse: "" }}
          validationSchema={RegisterSchema}
          onSubmit={async (values, { setSubmitting }) => {
            try {
              await register(values);
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
                  type="text"
                  name="nom"
                  placeholder="Nom"
                  className="input"
                />
                <ErrorMessage name="nom" component="div" className="text-red-500 text-sm" />
              </div>

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
                disabled={isSubmitting || loading}
                className="btn-primary"
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
