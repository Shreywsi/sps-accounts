import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {

  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user")) || null
  );

  const [accessToken, setAccessToken] = useState(
    localStorage.getItem("accessToken")
  );


  useEffect(() => {
    if (accessToken) {
      localStorage.setItem("accessToken", accessToken);
    } else {
      localStorage.removeItem("accessToken");
    }
  }, [accessToken]);


  const login = (userData, token) => {

    setUser(userData);
    setAccessToken(token);

    localStorage.setItem(
      "user",
      JSON.stringify(userData)
    );
  };


  const logout = () => {
  setUser(null);
  setAccessToken(null);

  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
};


  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        login,
        logout,
        isAuthenticated: !!accessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}


export function useAuth() {
  return useContext(AuthContext);
}