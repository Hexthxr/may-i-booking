// frontend/src/pages/CategoryRedirect.jsx
import { useParams, Navigate } from 'react-router-dom';

export default function CategoryRedirect() {
  const { category } = useParams();

  const encoded = encodeURIComponent(category || '');

  return <Navigate to={`/browse?category=${encoded}`} replace />;
}
