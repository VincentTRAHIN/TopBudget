import { IUser } from "@/types/user.type";
import { DynamicIcon } from "lucide-react/dynamic";

export function ChoiceView({
  handleVueMoi,
  handleVuePartenaire,
  handleVueCouple,
  selectedVue,
  hasPartner,
  partnerName,
  user,
}: {
  handleVueMoi: () => void;
  handleVuePartenaire: () => void;
  handleVueCouple: () => void;
  selectedVue: "moi" | "partenaire" | "couple_complet";
  hasPartner: boolean | "" | null | undefined;
  partnerName: string;
  user: IUser | null | undefined;
}) {
  return (
    <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
      <button
        onClick={handleVueMoi}
        className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${selectedVue === "moi" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-600 hover:text-gray-900"}`}>
        <DynamicIcon name="user" className="w-4 h-4" />
        <span>Mes Dépenses</span>
      </button>
      {hasPartner && (
        <button
          onClick={handleVuePartenaire}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${selectedVue === "partenaire" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-600 hover:text-gray-900"}`}>
          <DynamicIcon name="user" className="w-4 h-4" />
          <span>{partnerName}</span>
        </button>
      )}
      {user?.partenaireId && (
        <button
          onClick={handleVueCouple}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${selectedVue === "couple_complet" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-600 hover:text-gray-900"}`}>
          <DynamicIcon name="users" className="w-4 h-4" />
          <span>Couple Complet</span>
        </button>
      )}
    </div>
  );
}
