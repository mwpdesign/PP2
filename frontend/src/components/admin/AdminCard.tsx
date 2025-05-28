import React from 'react';
import { Link } from 'react-router-dom';

interface AdminCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  link: string;
  color: string;
}

const AdminCard: React.FC<AdminCardProps> = ({
  title,
  description,
  icon,
  link,
  color
}) => {
  return (
    <Link
      to={link}
      className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200"
    >
      <div className="flex items-center mb-4">
        <div className={`p-3 rounded-lg ${color} text-white mr-4`}>
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      </div>
      <p className="text-gray-600">{description}</p>
    </Link>
  );
};

export default AdminCard; 