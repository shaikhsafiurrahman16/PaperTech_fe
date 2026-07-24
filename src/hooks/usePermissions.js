import { useSelector } from "react-redux";
import { hasModuleAccess } from "../lib/accessModules";

function usePermissions(moduleKey) {
  const { user } = useSelector((state) => state.auth);

  return {
    canView: hasModuleAccess(user, moduleKey, "view"),
    canCreate: hasModuleAccess(user, moduleKey, "create"),
    canUpdate: hasModuleAccess(user, moduleKey, "update"),
    canDelete: hasModuleAccess(user, moduleKey, "delete"),
  };
}

export default usePermissions;
