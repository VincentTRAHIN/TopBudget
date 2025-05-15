"use client";
import Layout from "@/components/layout/Layout";
import RequireAuth from "@/components/auth/requireAuth.component";
import { useAuth } from "@/hooks/useAuth.hook";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { toast } from "react-hot-toast";
import { UserCircle } from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import fetcher from "@/utils/fetcher.utils";
import { profileAvatarEndpoint, profileChangePasswordEndpoint } from "@/services/api.service";

// Schéma de validation pour les informations personnelles
const ProfileSchema = Yup.object().shape({
  nom: Yup.string()
    .min(2, "Nom trop court")
    .max(50, "Nom trop long")
    .required("Nom requis"),
  email: Yup.string()
    .email("Email invalide")
    .required("Email requis"),
});

// Schéma de validation pour la liaison partenaire
const PartnerSchema = Yup.object().shape({
  partenaireIdentifier: Yup.string()
    .required("Identifiant du partenaire requis")
});

export default function ProfilPage() {
  const { user, isLoading, mutate: mutateAuth } = useAuth();
  const [unlinkPartner, setUnlinkPartner] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  if (isLoading || !user) {
    return <Layout><p>Chargement du profil...</p></Layout>;
  }

  // Gestion soumission des informations personnelles
  const handleProfileSubmit = async (values: { nom: string; email: string }, { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }) => {
    try {
      const response = await fetch('/api/profile/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nom: values.nom,
          email: values.email,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erreur lors de la mise à jour du profil");
      }

      // Réussite
      toast.success("Profil mis à jour avec succès");
      // Rafraîchir les données utilisateur
      mutateAuth();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message || "Une erreur est survenue");
      } else {
        toast.error("Une erreur inattendue est survenue");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Gestion soumission liaison partenaire
  const handlePartnerSubmit = async (values: { partenaireIdentifier?: string }, { setSubmitting, resetForm }: { setSubmitting: (isSubmitting: boolean) => void, resetForm: () => void }) => {
    try {
      // Mise à jour du profil avec le nouveau partenaireId ou null si déliaison
      const response = await fetch('/api/profile/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          partenaireId: unlinkPartner ? null : values.partenaireIdentifier,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erreur lors de la liaison avec le partenaire");
      }

      // Réussite
      toast.success(unlinkPartner 
        ? "Partenaire délié avec succès" 
        : "Partenaire lié avec succès");
      
      // Réinitialiser le formulaire après la déliaison
      if (unlinkPartner) {
        setUnlinkPartner(false);
        resetForm();
      }
      
      // Rafraîchir les données utilisateur
      mutateAuth();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message || "Une erreur est survenue");
      } else {
        toast.error("Une erreur inattendue est survenue");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Gestion upload avatar
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatarFile(e.target.files[0]);
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;
    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("avatar", avatarFile);
      await fetcher(profileAvatarEndpoint, {
        method: "POST",
        body: formData,
      });
      toast.success("Avatar mis à jour !");
      setAvatarFile(null);
      mutateAuth();
    } catch (error: unknown) {
      let message = "Erreur lors de l'upload de l'avatar";
      if (error instanceof Error && error.message) {
        // Gestion des erreurs HTTP (404, 500, etc.)
        if (error.message.includes("404")) {
          message = "Impossible de téléverser l'avatar (ressource non trouvée). Merci de réessayer plus tard.";
        } else if (error.message.includes("413")) {
          message = "Fichier trop volumineux. Choisis une image de moins de 2 Mo.";
        } else if (error.message.includes("415")) {
          message = "Format de fichier non supporté. Choisis une image JPEG, PNG ou GIF.";
        } else if (error.message.match(/\b4\d\d\b/)) {
          message = "Erreur de requête. Merci de vérifier le fichier et réessayer.";
        } else if (error.message.match(/\b5\d\d\b/)) {
          message = "Erreur serveur. Merci de réessayer plus tard.";
        } else {
          // Si le backend retourne un message d'erreur JSON
          try {
            const errObj = JSON.parse(error.message);
            if (errObj.message) message = errObj.message;
          } catch {
            message = error.message;
          }
        }
      }
      toast.error(message);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Déterminer si l'utilisateur a un partenaire en vérifiant si partenaireId est un objet (après population)
  const hasPartner = user.partenaireId && typeof user.partenaireId === 'object';

  return (
    <RequireAuth>
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Mon Profil</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Colonne Avatar + Infos */}
            <div className="md:col-span-1 bg-white p-6 rounded-lg shadow">
              {/* Avatar avec overlay upload */}
              <div className="relative mx-auto w-32 h-32 mb-2 group">
                {user.avatarUrl ? (
                  <Image 
                    src={user.avatarUrl} 
                    alt={`Avatar de ${user.nom}`}
                    className="rounded-full object-cover w-32 h-32 border-2 border-gray-200 shadow"
                    width={128}
                    height={128}
                  />
                ) : (
                  <UserCircle className="w-32 h-32 text-gray-400 bg-gray-200 rounded-full border-2 border-gray-200 shadow" />
                )}
                {/* Overlay cliquable */}
                <input
                  type="file"
                  accept="image/*"
                  id="avatar-upload"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                  onChange={handleAvatarChange}
                  disabled={isUploadingAvatar}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition flex items-center justify-center rounded-full z-10 pointer-events-none">
                  <svg className="text-white text-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-200" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="40" height="40" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l1.536 1.536A2 2 0 0120 8.268V17a2 2 0 01-2 2H6a2 2 0 01-2-2V8.268a2 2 0 01.586-1.414l1.536-1.536A2 2 0 017.768 4h8.464a2 2 0 011.414.586zM12 11a3 3 0 100 6 3 3 0 000-6z" />
                  </svg>
                </div>
                {isUploadingAvatar && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-60 rounded-full z-30">
                    <span className="text-primary font-bold animate-pulse">Upload...</span>
                  </div>
                )}
              </div>
              {/* Nom et email sous l'avatar */}
              <div className="text-center mb-4">
                <h2 className="text-xl font-semibold">{user.nom}</h2>
                <p className="text-gray-600 text-sm">{user.email}</p>
              </div>
              {/* Affichage du nom du fichier et bouton de confirmation */}
              {avatarFile && (
                <div className="w-full flex flex-col items-center gap-2 mt-2">
                  <span className="text-xs text-gray-700 truncate max-w-full">{avatarFile.name}</span>
                  <button
                    className="btn-primary w-full text-sm"
                    onClick={handleAvatarUpload}
                    disabled={isUploadingAvatar}
                  >
                    {isUploadingAvatar ? "Upload..." : "Confirmer l'upload"}
                  </button>
                </div>
              )}
            </div>

            {/* Colonne Formulaires */}
            <div className="md:col-span-2 space-y-6">
              {/* Formulaire Infos Perso */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Informations Personnelles</h3>
                <Formik
                  initialValues={{
                    nom: user.nom || '',
                    email: user.email || '',
                  }}
                  validationSchema={ProfileSchema}
                  onSubmit={handleProfileSubmit}
                >
                  {({ isSubmitting }) => (
                    <Form>
                      <div className="mb-4">
                        <label htmlFor="nom" className="block text-sm font-medium text-gray-700 mb-1">
                          Nom
                        </label>
                        <Field
                          type="text"
                          name="nom"
                          id="nom"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <ErrorMessage name="nom" component="div" className="text-red-500 text-sm mt-1" />
                      </div>
                      
                      <div className="mb-4">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <Field
                          type="email"
                          name="email"
                          id="email"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <ErrorMessage name="email" component="div" className="text-red-500 text-sm mt-1" />
                      </div>
                      
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn-primary w-full"
                      >
                        {isSubmitting ? "Enregistrement..." : "Enregistrer les modifications"}
                      </button>
                    </Form>
                  )}
                </Formik>
              </div>

              {/* Formulaire Liaison Partenaire */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Liaison Partenaire</h3>
                
                {hasPartner && typeof user.partenaireId === 'object' && user.partenaireId ? (
                  <div className="mb-4">
                    <p className="text-sm mb-2">
                      Vous êtes actuellement lié(e) à :
                    </p>
                    <div className="bg-gray-100 p-3 rounded-md flex items-center justify-between">
                      <div>
                        <p className="font-medium">{user.partenaireId.nom}</p>
                        <p className="text-gray-600 text-sm">{user.partenaireId.email}</p>
                      </div>
                      <button 
                        onClick={() => setUnlinkPartner(true)}
                        className="btn-danger-sm"
                      >
                        Délier le compte
                      </button>
                    </div>
                  </div>
                ) : (
                  <Formik
                    initialValues={{
                      partenaireIdentifier: '',
                    }}
                    validationSchema={PartnerSchema}
                    onSubmit={handlePartnerSubmit}
                  >
                    {({ isSubmitting }) => (
                      <Form>
                        <div className="mb-4">
                          <label htmlFor="partenaireIdentifier" className="block text-sm font-medium text-gray-700 mb-1">
                            Identifiant ou email du partenaire
                          </label>
                          <Field
                            type="text"
                            name="partenaireIdentifier"
                            id="partenaireIdentifier"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Entrez l'email ou l'identifiant de votre partenaire"
                          />
                          <ErrorMessage name="partenaireIdentifier" component="div" className="text-red-500 text-sm mt-1" />
                        </div>
                        
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="btn-primary w-full"
                        >
                          {isSubmitting ? "Liaison..." : "Lier le compte"}
                        </button>
                      </Form>
                    )}
                  </Formik>
                )}
                
                {unlinkPartner && (
                  <div className="mt-4">
                    <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md mb-3">
                      <p className="text-sm text-yellow-700">Êtes-vous sûr de vouloir vous délier de votre partenaire actuel ?</p>
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => setUnlinkPartner(false)}
                        className="btn-secondary flex-1"
                      >
                        Annuler
                      </button>
                      <Formik
                        initialValues={{}}
                        onSubmit={handlePartnerSubmit}
                      >
                        {({ isSubmitting }) => (
                          <Form className="flex-1">
                            <button
                              type="submit"
                              disabled={isSubmitting}
                              className="btn-danger w-full"
                            >
                              Confirmer la déliaison
                            </button>
                          </Form>
                        )}
                      </Formik>
                    </div>
                  </div>
                )}
              </div>

              {/* Formulaire Changement de mot de passe */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Changer de Mot de Passe</h3>
                <Formik
                  initialValues={{
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                  }}
                  validationSchema={Yup.object({
                    currentPassword: Yup.string().required("Mot de passe actuel requis"),
                    newPassword: Yup.string()
                      .required("Nouveau mot de passe requis")
                      .min(8, "8 caractères minimum")
                      .matches(/[A-Z]/, "Au moins une majuscule")
                      .matches(/[0-9]/, "Au moins un chiffre"),
                    confirmPassword: Yup.string()
                      .oneOf([Yup.ref('newPassword')], "Les mots de passe ne correspondent pas")
                      .required("Confirmation requise"),
                  })}
                  onSubmit={async (values, { setSubmitting, resetForm }) => {
                    try {
                      await fetcher(profileChangePasswordEndpoint, {
                        method: "PUT",
                        body: JSON.stringify(values),
                        headers: { "Content-Type": "application/json" },
                      });
                      toast.success("Mot de passe mis à jour avec succès");
                      resetForm();
                    } catch (error: unknown) {
                      toast.error((error instanceof Error && error.message) || "Erreur lors du changement de mot de passe");
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                >
                  {({ isSubmitting }) => (
                    <Form className="space-y-4">
                      <div>
                        <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">Mot de passe actuel</label>
                        <Field
                          type="password"
                          name="currentPassword"
                          id="currentPassword"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <ErrorMessage name="currentPassword" component="div" className="text-red-500 text-sm mt-1" />
                      </div>
                      <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe</label>
                        <Field
                          type="password"
                          name="newPassword"
                          id="newPassword"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <ErrorMessage name="newPassword" component="div" className="text-red-500 text-sm mt-1" />
                      </div>
                      <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirmer le nouveau mot de passe</label>
                        <Field
                          type="password"
                          name="confirmPassword"
                          id="confirmPassword"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <ErrorMessage name="confirmPassword" component="div" className="text-red-500 text-sm mt-1" />
                      </div>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn-primary w-full"
                      >
                        {isSubmitting ? "Changement..." : "Changer le mot de passe"}
                      </button>
                    </Form>
                  )}
                </Formik>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </RequireAuth>
  );
}
