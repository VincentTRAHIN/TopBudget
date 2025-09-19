'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import useDeleteAllDepenses from '@/hooks/useDeleteAllDepenses.hook';

interface DeleteAllExpensesButtonProps {
  className?: string;
  onSuccess?: (deletedCount: number) => void;
}

/**
 * Composant bouton pour supprimer toutes les dépenses avec confirmation
 */
const DeleteAllExpensesButton: React.FC<DeleteAllExpensesButtonProps> = ({
  className = '',
  onSuccess
}) => {
  const [showModal, setShowModal] = useState(false);
  const { deleteAllDepenses, isLoading } = useDeleteAllDepenses();

  const handleDeleteClick = () => {
    setShowModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      const result = await deleteAllDepenses();
      
      setShowModal(false);
      toast.success(`${result.deletedCount} dépenses supprimées avec succès`);
      
      if (onSuccess) {
        onSuccess(result.deletedCount);
      }
    } catch (error) {
      console.error('Erreur lors de la suppression des dépenses:', error);
      toast.error('Erreur lors de la suppression des dépenses');
    }
  };

  const handleCancelDelete = () => {
    setShowModal(false);
  };

  return (
    <>
      {/* Bouton principal */}
      <button
        onClick={handleDeleteClick}
        disabled={isLoading}
        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-300 rounded-lg hover:bg-red-100 focus:ring-4 focus:outline-none focus:ring-red-300 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        Supprimer toutes les dépenses
      </button>

      {/* Modal de confirmation */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 mt-4">
                Confirmation de suppression
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Êtes-vous sûr de vouloir supprimer toutes vos dépenses ?
                  <br />
                  <span className="font-semibold text-red-600">Cette action est irréversible.</span>
                </p>
              </div>
              <div className="flex gap-3 px-4 py-3 justify-center">
                <button
                  onClick={handleCancelDelete}
                  disabled={isLoading}
                  className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={isLoading}
                  className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Suppression...
                    </>
                  ) : (
                    'Supprimer'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DeleteAllExpensesButton;