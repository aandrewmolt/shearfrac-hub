import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-corporate">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4 text-accent-gold">404</h1>
        <p className="text-xl text-corporate-light mb-4">Oops! Page not found</p>
        <Link to="/" className="text-accent-gold hover:text-accent-gold-dark underline">
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;