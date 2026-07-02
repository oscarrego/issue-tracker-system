import { createContext, useContext, useState } from "react";

const DataContext = createContext(null);

export const DataProvider = ({ children }) => {
  const [cache, setCache] = useState({
    dashboard: null,
    issues: null,
    myIssuesAssigned: null,
    myIssuesCreated: null,
    inbox: null,
    members: null,
    projects: null,
    views: null,
    issueDetails: {},
    issueActivities: {},
    projectDetails: {},
    viewDetails: {},
  });

  const setCacheValue = (key, value) => {
    setCache((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const setDetailCacheValue = (subKey, id, value) => {
    setCache((prev) => ({
      ...prev,
      [subKey]: {
        ...prev[subKey],
        [id]: value,
      },
    }));
  };

  const clearCache = () => {
    setCache({
      dashboard: null,
      issues: null,
      myIssuesAssigned: null,
      myIssuesCreated: null,
      inbox: null,
      members: null,
      projects: null,
      views: null,
      issueDetails: {},
      issueActivities: {},
      projectDetails: {},
      viewDetails: {},
    });
  };

  return (
    <DataContext.Provider value={{ cache, setCacheValue, setDetailCacheValue, clearCache }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};
