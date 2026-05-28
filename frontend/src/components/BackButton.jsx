import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function BackButton({ to }) {
  const navigate = useNavigate();
  return (
    <button className="btn btn-ghost" style={{ marginBottom: '1rem', paddingLeft: 0 }}
      onClick={() => to ? navigate(to) : navigate(-1)}>
      <ArrowLeft size={16} /> Back
    </button>
  );
}